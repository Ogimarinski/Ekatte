jest.mock("../src/repositories/mayorality.repository");
jest.mock("../src/repositories/municipality.repository");

const mayoralityRepository = require("../src/repositories/mayorality.repository");
const municipalityRepository = require("../src/repositories/municipality.repository");

const {
    exportMayoralities,
    getMayoralities,
    getMayoralityById,
    createMayorality,
    updateMayorality,
    deleteMayoralities,
    getMayoralityOptions
} = require("../src/services/mayorality.service");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("exportMayoralities", () => {
    test("delegates to repository", async () => {
        const stream = {};

        mayoralityRepository.streamMayoralities.mockResolvedValue(stream);

        const result = await exportMayoralities({
            query: "Test"
        });

        expect(mayoralityRepository.streamMayoralities)
            .toHaveBeenCalledWith({
                query: "Test"
            });

        expect(result).toBe(stream);
    });
});

describe("getMayoralities", () => {
    test("delegates to repository", async () => {
        const response = {
            results: [],
            count: 0
        };

        mayoralityRepository.findMayoralities.mockResolvedValue(response);

        const result = await getMayoralities({
            page: 1
        });

        expect(mayoralityRepository.findMayoralities)
            .toHaveBeenCalledWith({
                page: 1
            });

        expect(result).toBe(response);
    });
});

describe("getMayoralityOptions", () => {
    test("delegates to repository", async () => {
        const options = [
            { id: 1, name: "Mayorality 1" }
        ];

        mayoralityRepository.findMayoralityOptions.mockResolvedValue(options);

        const result = await getMayoralityOptions({
            municipality_id: 5
        });

        expect(mayoralityRepository.findMayoralityOptions)
            .toHaveBeenCalledWith({
                municipality_id: 5
            });

        expect(result).toEqual(options);
    });
});

describe("getMayoralityById", () => {
    test("returns mayorality by id", async () => {
        mayoralityRepository.findMayoralityById.mockResolvedValue({
            id: 1,
            name: "Mayorality"
        });

        const result = await getMayoralityById(1);

        expect(mayoralityRepository.findMayoralityById)
            .toHaveBeenCalledWith(1);

        expect(result).toEqual({
            id: 1,
            name: "Mayorality"
        });
    });

    test("throws when mayorality is not found", async () => {
        mayoralityRepository.findMayoralityById.mockResolvedValue(undefined);

        await expect(
            getMayoralityById(1)
        ).rejects.toThrow("Mayorality not found");
    });
});

describe("createMayorality", () => {
    test("generates next mayorality code", async () => {
        municipalityRepository.findMunicipalityById.mockResolvedValue({
            id: 1,
            code: "PAZ08"
        });

        mayoralityRepository.findMaxMayoralityNumber.mockResolvedValue(1);

        mayoralityRepository.createMayorality.mockResolvedValue({
            id: 1,
            code: "PAZ08-02"
        });

        await createMayorality({
            name: "Test",
            municipality_id: 1
        });

        expect(municipalityRepository.findMunicipalityById)
            .toHaveBeenCalledWith(1);

        expect(mayoralityRepository.findMaxMayoralityNumber)
            .toHaveBeenCalledWith(1);

        expect(mayoralityRepository.createMayorality)
            .toHaveBeenCalledWith({
                name: "Test",
                municipality_id: 1,
                code: "PAZ08-02"
            });
    });

    test("starts from 01 when municipality has no mayoralities", async () => {
        municipalityRepository.findMunicipalityById.mockResolvedValue({
            code: "PAZ08"
        });

        mayoralityRepository.findMaxMayoralityNumber.mockResolvedValue(null);

        mayoralityRepository.createMayorality.mockResolvedValue({});

        await createMayorality({
            municipality_id: 1
        });

        expect(mayoralityRepository.createMayorality)
            .toHaveBeenCalledWith({
                municipality_id: 1,
                code: "PAZ08-01"
            });
    });

    test("throws when municipality does not exist", async () => {
        municipalityRepository.findMunicipalityById.mockResolvedValue(undefined);

        await expect(
            createMayorality({
                municipality_id: 1
            })
        ).rejects.toThrow("Municipality not found");
    });
});

describe("updateMayorality", () => {
    test("updates mayorality", async () => {
        const mayorality = {
            id: 1,
            name: "Updated"
        };

        mayoralityRepository.updateMayorality.mockResolvedValue(
            mayorality
        );

        const result = await updateMayorality(1, {
            name: "Updated"
        });

        expect(mayoralityRepository.updateMayorality)
            .toHaveBeenCalledWith(1, {
                name: "Updated"
            });

        expect(result).toBe(mayorality);
    });

    test("throws when mayorality does not exist", async () => {
        mayoralityRepository.updateMayorality.mockResolvedValue(undefined);

        await expect(
            updateMayorality(1, {
                name: "Updated"
            })
        ).rejects.toThrow("Mayorality not found");
    });


    test("regenerates code when municipality changes", async () => {
        municipalityRepository.findMunicipalityById.mockResolvedValue({
            code: "PAZ08"
        });

        mayoralityRepository.findMaxMayoralityNumber.mockResolvedValue(2);

        mayoralityRepository.updateMayorality.mockResolvedValue({
            id: 1,
            municipality_id: 5,
            code: "PAZ08-03"
        });

        await updateMayorality(1, {
            municipality_id: 5
        });

        expect(municipalityRepository.findMunicipalityById)
            .toHaveBeenCalledWith(5);

        expect(mayoralityRepository.findMaxMayoralityNumber)
            .toHaveBeenCalledWith(5);

        expect(mayoralityRepository.updateMayorality)
            .toHaveBeenCalledWith(1, {
                municipality_id: 5,
                code: "PAZ08-03"
            });
    });
});

describe("deleteMayoralities", () => {
    test("deletes mayoralities", async () => {
        const deleted = [
            { id: 1 },
            { id: 2 }
        ];

        mayoralityRepository.deleteMayoralties.mockResolvedValue(
            deleted
        );

        const result = await deleteMayoralities([1, 2]);

        expect(mayoralityRepository.deleteMayoralties)
            .toHaveBeenCalledWith([1, 2]);

        expect(result).toEqual(deleted);
    });

    test("throws when some mayoralities are not found", async () => {
        mayoralityRepository.deleteMayoralties.mockResolvedValue([
            { id: 1 }
        ]);

        await expect(
            deleteMayoralities([1, 2])
        ).rejects.toThrow(
            "Some mayoralties were not found"
        );
    });
});
