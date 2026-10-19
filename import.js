const fs = require("fs/promises");
const db = require("./db");

async function importData({ filePath, entityName, statementName, queryText, mapItem }) {
    const rawData = await fs.readFile(filePath, "utf-8");
    if (!rawData) {
        throw new Error(`Файлът ${filePath} е празен`);
    }

    let items;
    try {
        items = JSON.parse(rawData);
    } catch (jsonError) {
        throw new Error(`Невалиден JSON във файл ${filePath}`, { cause: jsonError });
    }

    if (!Array.isArray(items)) {
        throw new Error(`JSON в ${filePath} не е масив`);
    }

    if (items.length === 0) {
        throw new Error(`Няма записи за импорт в ${filePath}`);
    }

    if (!statementName || !queryText) {
        throw new Error(`Невалиден statement за ${entityName}`);
    }

    console.log(`Намерени са ${items.length} записа за ${entityName}. Започва импорт...`);

    const statement = {
        name: statementName,
        text: queryText
    };

    for (const item of items) {
        const values = mapItem(item);

        if (!values) continue;

        try {
            await db.query({
                ...statement,
                values: values,
            });
        } catch (dbError) {
            console.error(`Грешка при insert на ${entityName}:`, dbError);
        }
    }

    console.log(`Импортирането на ${entityName} приключи успешно!`);
}

async function runAllImports() {
    try {
        await importData({
            filePath: './data/ek_obl.json',
            entityName: 'области',
            statementName: 'insert-region',
            queryText: "INSERT INTO regions(code, name, transliteration) VALUES($1, $2, $3) ON CONFLICT (code) DO NOTHING",
            mapItem: (item) => {
                if (!item.oblast) return null;
                return [item.oblast, item.name, item.name_en];
            }
        });

        await importData({
            filePath: './data/ek_obst.json',
            entityName: 'общини',
            statementName: 'insert-municipality',
            queryText: `
            INSERT INTO municipalities(code, name, transliteration, region_id)
            VALUES($1, $2, $3, (SELECT id FROM regions WHERE code = $4))
            ON CONFLICT (code) DO NOTHING
        `,
            mapItem: (item) => {
                if (!item.obshtina) return null;

                const regionCode = item.obshtina.substring(0, 3);
                return [item.obshtina, item.name, item.name_en, regionCode];
            }
        });

        await importData({
            filePath: './data/ek_kmet.json',
            entityName: 'кметства',
            statementName: 'insert-mayoralties',
            queryText: `
            INSERT INTO mayoralties(code, name, transliteration, municipality_id)
            VALUES($1, $2, $3, (SELECT id FROM municipalities WHERE code = $4))
            ON CONFLICT (code) DO NOTHING
        `,
            mapItem: (item) => {
                if (!item.kmetstvo) return null;

                const munCode = item.kmetstvo.substring(0, 5);
                return [item.kmetstvo, item.name, item.name_en, munCode];
            }
        });

        await importData({
            filePath: './data/ek_atte.json',
            entityName: 'селища',
            statementName: 'insert-settlements',
            queryText: `
            INSERT INTO settlements(ekatte, name, transliteration, municipality_id, mayorality_id)
            VALUES ($1, $2, $3,
            (SELECT id FROM municipalities WHERE code = $4),
            (SELECT id FROM mayoralties WHERE code = $5)
            )
            ON CONFLICT (ekatte) DO NOTHING
        `,
            mapItem: (item) => {
                if (!item.ekatte || !item.obshtina) return null;

                return [item.ekatte, item.name, item.name_en, item.obshtina, item.kmetstvo];
            }
        });

        console.log("Всички импорти приключиха успешно!");
    } catch (error) {
        console.error("Импортът се провали:", error.message);
        //прекратява програмата и връща код 1(грешка)
        process.exit(1);
    }
}

/* istanbul ignore if */
if (require.main === module) {
    runAllImports();
}

module.exports = { importData, runAllImports };