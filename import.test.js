const fs = require("fs/promises");
const db = require("./db");
const { importData, runAllImports } = require("./import");

jest.mock("fs/promises");
jest.mock("./db");
let consoleErrorSpy;
let consoleLogSpy;

describe("Тестване на фунцкията importData", () => {

    beforeEach(() => {
        jest.resetAllMocks();

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("Трябва успешно на прочете файл, да мапне данните и да извика db.query", async () => {

        const mockFileContent = JSON.stringify([
            { oblast: "SOF", name: "София" },
        ]);

        fs.readFile.mockResolvedValue(mockFileContent);

        const testParams = {
            filePath: './fake/path.json',
            entityName: 'области',
            statementName: 'insert-region',
            queryText: 'INSERT INTO regions...',
            mapItem: (item) => {
                if (!item.oblast) return null;
                return [item.oblast, item.name];
            }
        };

        await importData(testParams);

        expect(fs.readFile).toHaveBeenCalledWith("./fake/path.json", "utf-8");

        expect(db.query).toHaveBeenCalledTimes(1);

        expect(db.query).toHaveBeenCalledWith({
            name: 'insert-region',
            text: 'INSERT INTO regions...',
            values: ["SOF", "София"]
        });

        expect(consoleLogSpy).toHaveBeenCalledWith("Импортирането на области приключи успешно!");


    });

    test("Трябва да не прави нищо, ако файлът е празен", async () => {
        fs.readFile.mockResolvedValue("");

        await expect(importData({ filePath: "./empty.json" })).rejects.toThrow("Файлът ./empty.json е празен");

        expect(db.query).not.toHaveBeenCalled();
    });

    test("Трябва да спре при невалиден JSON", async () => {
        fs.readFile.mockResolvedValue("{invalid json");

        await expect(importData({ filePath: './invalid.json' })).rejects.toThrow(`Невалиден JSON във файл ./invalid.json`);

        expect(db.query).not.toHaveBeenCalled();
    });

    test("Трябва да спре ако JSON, не е масив", async () => {
        fs.readFile.mockResolvedValue(JSON.stringify({ test: "test" }));

        await expect(importData({ filePath: "./object.json" })).rejects.toThrow("JSON в ./object.json не е масив");

        expect(db.query).not.toHaveBeenCalled();
    });

    test("Трябва да спре, ако масивът е празен", async () => {
        fs.readFile.mockResolvedValue(JSON.stringify([]));

        await expect(importData({ filePath: "./empty.json" })).rejects.toThrow("Няма записи за импорт в ./empty.json");

        expect(db.query).not.toHaveBeenCalled();
    });

    test("Трябва да спре ако statementName или queryText липсват", async () => {
        fs.readFile.mockResolvedValue(JSON.stringify([{ entityName: "тест" }]));

        await expect(importData({ filePath: "./valid.json", entityName: "тест" })).rejects.toThrow("Невалиден statement за тест");

        expect(db.query).not.toHaveBeenCalled();
    });

    test("Трябва да продължи, дори ако db.query хвърли грешка за някой запис", async () => {
        fs.readFile.mockResolvedValue(JSON.stringify([{ id: 1 }, { id: 2 }]));

        db.query.mockRejectedValueOnce(new Error("DB Constraint Error")).mockResolvedValueOnce({});

        await importData({
            filePath: "./test.json",
            entityName: "тест",
            statementName: "stmt",
            queryText: "query",
            mapItem: (item) => [item.id]
        });

        expect(db.query).toHaveBeenCalledTimes(2);
        expect(consoleErrorSpy).toHaveBeenCalledWith("Грешка при insert на тест:", expect.any(Error));
    });

    test("Трябва да хване грешка при четене на файла", async () => {
        fs.readFile.mockRejectedValue(new Error("FILE NOT FOUND"));

        await expect(importData({ filePath: "./missing.json", entityName: "области" })).rejects.toThrow("FILE NOT FOUND");

    });

})


describe("Тестване на runAllImports", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        consoleLogSpy.mockRestore();
    })

    test("Трябва да обработи и 4-те файла и правилно да мапне данните", async () => {
        fs.readFile.mockImplementation(async (filePath) => {
            if (filePath === './data/ek_obl.json') {
                return JSON.stringify([
                    { oblast: "SOF", name: "София", name_en: "Sofia" },
                    { name: "" }
                ]);
            }

            if (filePath === './data/ek_obst.json') {
                return JSON.stringify([
                    { obshtina: "SOF01", name: "Столична", name_en: "Stolichna" },
                    { name: "" }
                ]);
            }

            if (filePath === './data/ek_kmet.json') {
                return JSON.stringify([
                    { kmetstvo: "BLG52-01", name: "Абланица", name_en: "Ablanitsa" },
                    { name: "" }
                ]);
            }

            if (filePath === './data/ek_atte.json') {
                return JSON.stringify([
                    { ekatte: "00014", name: "Абланица", name_en: "Ablanitsa", obshtina: "BLG52", kmetstvo: "BLG52-01" },
                    { name: "" }
                ]);
            }

            return "[]";
        });

        await runAllImports();

        expect(fs.readFile).toHaveBeenCalledTimes(4);
        expect(fs.readFile).toHaveBeenCalledWith('./data/ek_obl.json', 'utf-8');
        expect(fs.readFile).toHaveBeenCalledWith('./data/ek_obst.json', 'utf-8');
        expect(fs.readFile).toHaveBeenCalledWith('./data/ek_kmet.json', 'utf-8');
        expect(fs.readFile).toHaveBeenCalledWith('./data/ek_atte.json', 'utf-8');

        expect(db.query).toHaveBeenCalledTimes(4);

        expect(db.query).toHaveBeenNthCalledWith(1, expect.objectContaining({
            name: 'insert-region',
            values: ["SOF", "София", "Sofia"]
        }));

        expect(db.query).toHaveBeenNthCalledWith(2, expect.objectContaining({
            name: 'insert-municipality',
            values: ["SOF01", "Столична", "Stolichna", "SOF"]
        }));

        expect(db.query).toHaveBeenNthCalledWith(3, expect.objectContaining({
            name: 'insert-mayoralties',
            values: ["BLG52-01", "Абланица", "Ablanitsa", "BLG52"]
        }));

        expect(db.query).toHaveBeenNthCalledWith(4, expect.objectContaining({
            name: 'insert-settlements',
            values: ["00014", "Абланица", "Ablanitsa", "BLG52", "BLG52-01"]
        }));
    });


    test("логва грешка и exit-ва при failure", async () => {
        const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { });

        fs.readFile.mockRejectedValue(new Error("ERROR"));

        await runAllImports();

        expect(consoleErrorSpy)
            .toHaveBeenCalledWith("Импортът се провали:", "ERROR");

        expect(exitSpy).toHaveBeenCalledWith(1);
    });
})