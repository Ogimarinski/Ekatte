jest.mock("../src/repositories/settlement.repository");
jest.mock("../src/repositories/municipality.repository");
jest.mock("../src/repositories/mayorality.repository");
jest.mock("../src/helper");
jest.mock("../src/services/geonames.service");
jest.mock("../src/loaders/geonames.loader");
const loadGeoNames = require("../src/loaders/geonames.loader");

const repository = require("../src/repositories/settlement.repository");
const municipalityRepository = require("../src/repositories/municipality.repository");
const mayoralityRepository = require("../src/repositories/mayorality.repository");
const { NotFoundError } = require("../src/errors/NotFoundError");
const geonamesService = require("../src/services/geonames.service");
const { generateEkatteFrom4 } = require("../src/helper");

const {
    exportSettlements,
    getSettlements,
    getSettlemetById,
    createSettlement,
    updateSettlement,
    deleteSettlements,
    enrichSettlementsWithCoordinates,
    getSettlementClimate,
    importChineseSettlements
} = require("../src/services/settlement.service");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("exportSettlements", () => {
    test("exportSettlements delegates to repository", async () => {
        const stream = {};

        repository.streamSettlements.mockResolvedValue(stream);

        const result = await exportSettlements({ query: "Sofia" });

        expect(repository.streamSettlements)
            .toHaveBeenCalledWith({ query: "Sofia" });

        expect(result).toBe(stream);
    });
});

describe("getSettlements", () => {
    test("getSettlements delegates to repository", async () => {
        const response = {
            results: [],
            count: 0
        };

        repository.findSettlements.mockResolvedValue(response);

        const result = await getSettlements({ page: 1 });

        expect(repository.findSettlements)
            .toHaveBeenCalledWith({ page: 1 });

        expect(result).toBe(response);
    });
});

describe("getSettlementById", () => {
    test("returns settlement by id", async () => {
        repository.findSettlementById.mockResolvedValue({
            id: 1,
            name: "Sofia"
        });

        const result = await getSettlemetById(1);

        expect(repository.findSettlementById).toHaveBeenCalledWith(1);
        expect(result).toEqual({
            id: 1,
            name: "Sofia"
        });
    });

    test("throws when settlement is not found", async () => {
        repository.findSettlementById.mockResolvedValue(undefined);

        await expect(getSettlemetById(1))
            .rejects
            .toThrow("Settlement not found");
    });
});

describe("createSettlement", () => {
    beforeEach(() => {
        municipalityRepository.findMunicipalityById.mockResolvedValue({ id: 1 });
        mayoralityRepository.findMayoralityById.mockResolvedValue({ municipality_id: 1 });
    });
    test("generates next ekatte when creating settlement", async () => {
        repository.findMaxSettlementNumber.mockResolvedValue(1234);

        generateEkatteFrom4.mockReturnValue("12345");

        repository.createSettlement.mockResolvedValue({
            id: 1,
            ekatte: "12345"
        });

        await createSettlement({
            name: "Sofia",
            municipality_id: 1,
            mayorality_id: 2
        });

        expect(repository.findMaxSettlementNumber)
            .toHaveBeenCalled();

        expect(generateEkatteFrom4)
            .toHaveBeenCalledWith("1235");

        expect(repository.createSettlement)
            .toHaveBeenCalledWith({
                name: "Sofia",
                municipality_id: 1,
                mayorality_id: 2,
                ekatte: "12345"
            });
    });

    test("starts from 0001 when there are no settlements", async () => {
        repository.findMaxSettlementNumber.mockResolvedValue(null);

        generateEkatteFrom4.mockReturnValue("00015");

        repository.createSettlement.mockResolvedValue({});

        await createSettlement({
            name: "Sofia"
        });

        expect(generateEkatteFrom4)
            .toHaveBeenCalledWith("0001");
    });

    test("throws NotFoundError and does not create when the municipality does not exist", async () => {
        municipalityRepository.findMunicipalityById.mockResolvedValue(undefined);

        const promise = createSettlement({ name: "Sofia", municipality_id: 999 });

        await expect(promise).rejects.toThrow(NotFoundError);
        await expect(promise).rejects.toThrow("Municipality not found");
        expect(repository.createSettlement).not.toHaveBeenCalled();
    });

    test("throws NotFoundError and does not create when the mayorality does not exist", async () => {
        mayoralityRepository.findMayoralityById.mockResolvedValue(undefined);

        const promise = createSettlement({ name: "Sofia", municipality_id: 1, mayorality_id: 999 });

        await expect(promise).rejects.toThrow(NotFoundError);
        await expect(promise).rejects.toThrow("Mayorality not found");
        expect(repository.createSettlement).not.toHaveBeenCalled();
    });

    test("does not look up a mayorality when mayorality_id is null", async () => {
        repository.createSettlement.mockResolvedValue({});

        await createSettlement({ name: "Sofia", municipality_id: 1, mayorality_id: null });

        expect(mayoralityRepository.findMayoralityById).not.toHaveBeenCalled();
        expect(repository.createSettlement).toHaveBeenCalled();
    });
});

describe("updateSettlement", () => {
    test("updateSettlement", async () => {
        const settlement = {
            id: 1,
            name: "Updated"
        };

        repository.updateSettlement.mockResolvedValue(settlement);

        const result = await updateSettlement(1, {
            name: "Updated"
        });

        expect(repository.updateSettlement)
            .toHaveBeenCalledWith(1, {
                name: "Updated"
            });

        expect(result).toBe(settlement);
    });

    test("throws error when settlement doesnt exist", async () => {
        repository.updateSettlement.mockResolvedValue(undefined);

        await expect(
            updateSettlement(1, {
                name: "Updated"
            })
        ).rejects.toThrow("Settlement not found");
    });

    test("throws NotFoundError and does not update when the new municipality does not exist", async () => {
        municipalityRepository.findMunicipalityById.mockResolvedValue(undefined);

        const promise = updateSettlement(1, { municipality_id: 999 });

        await expect(promise).rejects.toThrow(NotFoundError);
        await expect(promise).rejects.toThrow("Municipality not found");
        expect(repository.updateSettlement).not.toHaveBeenCalled();
    });

    test("does not look up parents when they are not being changed", async () => {
        repository.updateSettlement.mockResolvedValue({ id: 1, name: "Updated" });

        await updateSettlement(1, { name: "Updated" });

        expect(municipalityRepository.findMunicipalityById).not.toHaveBeenCalled();
        expect(mayoralityRepository.findMayoralityById).not.toHaveBeenCalled();
    });
});

describe("deleteSettlement", () => {
    test("deletes settlements", async () => {
        const deleted = [
            { id: 1 },
            { id: 2 }
        ];

        repository.deleteSettlements.mockResolvedValue(deleted);

        const result = await deleteSettlements([1, 2]);

        expect(repository.deleteSettlements)
            .toHaveBeenCalledWith([1, 2]);

        expect(result).toEqual(deleted);
    });

    test("throws when some settlements are not found ", async () => {
        const deleted = [
            { id: 1 }
        ];

        repository.deleteSettlements.mockResolvedValue(deleted);

        await expect(deleteSettlements([1, 2])).rejects.toThrow("Some settlements were not found");
    });
});

describe("getSettlementClimate", () => {
    test("delegates to repository", async () => {
        const climate = [
            {
                month: 1,
                avg_temperature: 2
            }
        ];

        repository.findClimateBySettlementAndYear.mockResolvedValue(climate);

        const result = await getSettlementClimate(1, 2025);

        expect(repository.findClimateBySettlementAndYear)
            .toHaveBeenCalledWith(1, 2025);

        expect(result).toBe(climate);
    });
});

describe("enrichSettlementsWithCoordinates", () => {
    test("updates settlement coordinates from geonames", async () => {
        repository.findAllForGeonames.mockResolvedValue([
            {
                id: 1,
                municipality_id: 5
            }
        ]);

        geonamesService.searchSettlement.mockReturnValue([
            {}
        ]);

        geonamesService.findBestMatch.mockReturnValue({
            latitude: 42.7,
            longitude: 23.3
        });

        await enrichSettlementsWithCoordinates();

        expect(repository.updateCoordinates)
            .toHaveBeenCalledWith(
                1,
                42.7,
                23.3
            );
    });

    test("uses municipality coordinates as fallback", async () => {
        repository.findAllForGeonames.mockResolvedValue([
            {
                id: 1,
                municipality_id: 5
            }
        ]);

        geonamesService.searchSettlement.mockReturnValue([]);

        geonamesService.findBestMatch.mockReturnValue(undefined);

        repository.findCoordinatesByMunicipality.mockResolvedValue({
            latitude: 42.1,
            longitude: 23.1
        });

        await enrichSettlementsWithCoordinates();

        expect(repository.findCoordinatesByMunicipality)
            .toHaveBeenCalledWith(5, 1);

        expect(repository.updateCoordinates)
            .toHaveBeenCalledWith(
                1,
                42.1,
                23.1
            );
    });

    test("does not update coordinates when no match is found", async () => {
        repository.findAllForGeonames.mockResolvedValue([
            {
                id: 1,
                municipality_id: 5
            }
        ]);

        geonamesService.searchSettlement.mockReturnValue([]);

        geonamesService.findBestMatch.mockReturnValue(undefined);

        repository.findCoordinatesByMunicipality.mockResolvedValue(undefined);

        await enrichSettlementsWithCoordinates();

        expect(repository.updateCoordinates)
            .not.toHaveBeenCalled();
    });
});

describe("importChineseSettlements", () => {
    test("imports settlements in batches of 1000", async () => {
        const settlements = Array.from({ length: 2500 }, (_, i) => ({ geonameId: i }));

        loadGeoNames.mockReturnValue(settlements);
        repository.createSettlementsBulk.mockResolvedValue();

        await importChineseSettlements();

        expect(loadGeoNames).toHaveBeenCalledWith("CN");
        expect(repository.createSettlementsBulk).toHaveBeenCalledTimes(3);

        expect(repository.createSettlementsBulk).toHaveBeenNthCalledWith(
            1,
            settlements.slice(0, 1000)
        );
        expect(repository.createSettlementsBulk).toHaveBeenNthCalledWith(
            3,
            settlements.slice(2000, 2500)
        );
    });
});