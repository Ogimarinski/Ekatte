jest.mock("../src/repositories/municipality.repository");
jest.mock("../src/repositories/region.repository");

const municipalityRepository = require("../src/repositories/municipality.repository");
const regionRepository = require("../src/repositories/region.repository");

const {
    exportMunicipalities,
    getMunicipalities,
    getMunicipalityById,
    createMunicipality,
    updateMunicipality,
    deleteMunicipalities
} = require("../src/services/municipality.service");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("exportMunicipalities", () => {
    test("delegates to repository", async () => {
        const stream = {};

        municipalityRepository.streamMunicipalities.mockResolvedValue(stream);

        const result = await exportMunicipalities({
            query: "Varna"
        });

        expect(municipalityRepository.streamMunicipalities)
            .toHaveBeenCalledWith({
                query: "Varna"
            });

        expect(result).toBe(stream);
    });
});

describe("getMunicipalities", () => {
    test("delegates to repository", async () => {
        const response = {
            results: [],
            count: 0
        };

        municipalityRepository.findMunicipalities.mockResolvedValue(response);

        const result = await getMunicipalities({
            page: 1
        });

        expect(municipalityRepository.findMunicipalities)
            .toHaveBeenCalledWith({
                page: 1
            });

        expect(result).toBe(response);
    });
});

describe("getMunicipalityById", () => {
    test("returns municipality by id", async () => {
        municipalityRepository.findMunicipalityById.mockResolvedValue({
            id: 1,
            name: "Varna"
        });

        const result = await getMunicipalityById(1);

        expect(municipalityRepository.findMunicipalityById)
            .toHaveBeenCalledWith(1);

        expect(result).toEqual({
            id: 1,
            name: "Varna"
        });
    });

    test("throws when municipality is not found", async () => {
        municipalityRepository.findMunicipalityById.mockResolvedValue(undefined);

        await expect(
            getMunicipalityById(1)
        ).rejects.toThrow("Municipality not found");
    });
});

describe("createMunicipality", () => {
    test("generates next municipality code", async () => {
        regionRepository.findRegionById.mockResolvedValue({
            id: 1,
            code: "VAR"
        });

        municipalityRepository.findMaxMunicipalityNumber.mockResolvedValue(1);

        municipalityRepository.createMunicipality.mockResolvedValue({
            id: 1,
            code: "VAR02"
        });

        await createMunicipality({
            name: "Varna",
            region_id: 1
        });

        expect(regionRepository.findRegionById)
            .toHaveBeenCalledWith(1);

        expect(municipalityRepository.findMaxMunicipalityNumber)
            .toHaveBeenCalledWith(1);

        expect(municipalityRepository.createMunicipality)
            .toHaveBeenCalledWith({
                name: "Varna",
                region_id: 1,
                code: "VAR02"
            });
    });

    test("starts from 01 when region has no municipalities", async () => {
        regionRepository.findRegionById.mockResolvedValue({
            code: "VAR"
        });

        municipalityRepository.findMaxMunicipalityNumber.mockResolvedValue(null);

        municipalityRepository.createMunicipality.mockResolvedValue({});

        await createMunicipality({
            region_id: 1
        });

        expect(municipalityRepository.createMunicipality)
            .toHaveBeenCalledWith({
                region_id: 1,
                code: "VAR01"
            });
    });

    test("throws when region does not exist", async () => {
        regionRepository.findRegionById.mockResolvedValue(undefined);

        await expect(
            createMunicipality({
                region_id: 1
            })
        ).rejects.toThrow("Region not found");
    });
});

describe("updateMunicipality", () => {
    test("updates municipality", async () => {
        const municipality = {
            id: 1,
            name: "Updated"
        };

        municipalityRepository.updateMunicipality.mockResolvedValue(
            municipality
        );

        const result = await updateMunicipality(1, {
            name: "Updated"
        });

        expect(municipalityRepository.updateMunicipality)
            .toHaveBeenCalledWith(1, {
                name: "Updated"
            });

        expect(result).toBe(municipality);
    });

    test("throws when municipality does not exist", async () => {
        municipalityRepository.updateMunicipality.mockResolvedValue(undefined);

        await expect(
            updateMunicipality(1, {
                name: "Updated"
            })
        ).rejects.toThrow("Municipality not found");
    });
});

describe("deleteMunicipalities", () => {
    test("deletes municipalities", async () => {
        const deleted = [
            { id: 1 },
            { id: 2 }
        ];

        municipalityRepository.deleteMunicipalities.mockResolvedValue(
            deleted
        );

        const result = await deleteMunicipalities([1, 2]);

        expect(municipalityRepository.deleteMunicipalities)
            .toHaveBeenCalledWith([1, 2]);

        expect(result).toEqual(deleted);
    });

    test("throws when some municipalities are not found", async () => {
        municipalityRepository.deleteMunicipalities.mockResolvedValue([
            { id: 1 }
        ]);

        await expect(
            deleteMunicipalities([1, 2])
        ).rejects.toThrow(
            "Some municipalities were not found"
        );
    });
});
