jest.mock("../src/repositories/region.repository");

const regionRepository = require("../src/repositories/region.repository");

const {
    exportRegions,
    getRegions,
    getRegionById,
    createRegion,
    updateRegion,
    deleteRegions,
    getRegionOptions
} = require("../src/services/region.service");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("exportRegions", () => {
    test("delegates to repository", async () => {
        const stream = {};

        regionRepository.streamRegions.mockResolvedValue(stream);

        const result = await exportRegions({
            query: "Varna"
        });

        expect(regionRepository.streamRegions)
            .toHaveBeenCalledWith({
                query: "Varna"
            });

        expect(result).toBe(stream);
    });
});

describe("getRegions", () => {
    test("delegates to repository", async () => {
        const response = {
            results: [],
            count: 0
        };

        regionRepository.findRegions.mockResolvedValue(response);

        const result = await getRegions({
            page: 1
        });

        expect(regionRepository.findRegions)
            .toHaveBeenCalledWith({
                page: 1
            });

        expect(result).toBe(response);
    });
});

describe("getRegionById", () => {
    test("returns region by id", async () => {
        regionRepository.findRegionById.mockResolvedValue({
            id: 1,
            name: "Varna"
        });

        const result = await getRegionById(1);

        expect(regionRepository.findRegionById)
            .toHaveBeenCalledWith(1);

        expect(result).toEqual({
            id: 1,
            name: "Varna"
        });
    });

    test("throws when region is not found", async () => {
        regionRepository.findRegionById.mockResolvedValue(undefined);

        await expect(
            getRegionById(1)
        ).rejects.toThrow("Region not found");
    });
});

describe("createRegion", () => {
    test("creates region", async () => {
        const region = {
            id: 1,
            code: "VAR",
            name: "Varna"
        };

        regionRepository.createRegion.mockResolvedValue(region);

        const result = await createRegion({
            code: "VAR",
            name: "Varna"
        });

        expect(regionRepository.createRegion)
            .toHaveBeenCalledWith({
                code: "VAR",
                name: "Varna"
            });

        expect(result).toBe(region);
    });
});

describe("updateRegion", () => {
    test("updates region", async () => {
        const region = {
            id: 1,
            name: "Updated"
        };

        regionRepository.updateRegion.mockResolvedValue(region);

        const result = await updateRegion(1, {
            name: "Updated"
        });

        expect(regionRepository.updateRegion)
            .toHaveBeenCalledWith(1, {
                name: "Updated"
            });

        expect(result).toBe(region);
    });

    test("throws when region does not exist", async () => {
        regionRepository.updateRegion.mockResolvedValue(undefined);

        await expect(
            updateRegion(1, {
                name: "Updated"
            })
        ).rejects.toThrow("Region not found");
    });
});

describe("deleteRegions", () => {
    test("deletes regions", async () => {
        const deleted = [
            { id: 1 },
            { id: 2 }
        ];

        regionRepository.deleteRegions.mockResolvedValue(
            deleted
        );

        const result = await deleteRegions([1, 2]);

        expect(regionRepository.deleteRegions)
            .toHaveBeenCalledWith([1, 2]);

        expect(result).toEqual(deleted);
    });

    test("throws when some regions are not found", async () => {
        regionRepository.deleteRegions.mockResolvedValue([
            { id: 1 }
        ]);

        await expect(
            deleteRegions([1, 2])
        ).rejects.toThrow(
            "Some regions were not found"
        );
    });
});

describe("getRegionOptions", () => {
    test("delegates to repository", async () => {
        const options = [{ id: 1, name: "Sofia" }];
        regionRepository.findRegionOptions.mockResolvedValue(options);

        const result = await getRegionOptions();

        expect(regionRepository.findRegionOptions).toHaveBeenCalled();
        expect(result).toBe(options);
    });
});