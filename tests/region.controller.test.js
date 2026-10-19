jest.mock("../src/services/region.service");
jest.mock("../src/validators/validator");
jest.mock("../src/http/utils/request");
jest.mock("../src/http/utils/response");
jest.mock("../src/http/utils/errorHandler");
jest.mock("../src/http/utils/export");

const regionService = require("../src/services/region.service");

const {
    validateSchema
} = require("../src/validators/validator");

const {
    exportRegionCsv,
    exportRegionExcel,
    getRegions,
    getRegionById,
    createRegion,
    updateRegion,
    deleteRegions,
    getRegionOptions
} = require("../src/http/controllers/region.controller");

const { parseRequestBody } = require("../src/http/utils/request");
const { sendHttpResponse } = require("../src/http/utils/response");
const { handleError } = require("../src/http/utils/errorHandler");
const { streamCsv, streamExcel } = require("../src/http/utils/export");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("exportRegionCsv", () => {
    test("exports regions as csv", async () => {
        const req = {};
        const res = {
            writeHead: jest.fn()
        };

        const stream = {};

        validateSchema.mockReturnValue({
            query: "Varna"
        });

        regionService.exportRegions.mockResolvedValue(stream);

        await exportRegionCsv(
            req,
            res,
            { query: { query: "Varna" } }
        );

        expect(validateSchema).toHaveBeenCalledWith(
            "region",
            "list",
            {
                query: "Varna"
            }
        );

        expect(regionService.exportRegions)
            .toHaveBeenCalledWith({
                query: "Varna"
            });

        expect(res.writeHead).toHaveBeenCalled();

        expect(streamCsv).toHaveBeenCalled();
    });

    test("handles export error before headers are sent", async () => {
        const error = new Error("boom");

        validateSchema.mockReturnValue({});

        regionService.exportRegions.mockRejectedValue(error);

        const res = {
            headersSent: false
        };

        await exportRegionCsv({}, res, { query: {} });

        expect(handleError).toHaveBeenCalledWith(res, error);
    });

    test("destroys response when headers are sent", async () => {
        const error = new Error("boom");

        validateSchema.mockReturnValue({});

        regionService.exportRegions.mockRejectedValue(error);

        const res = {
            headersSent: true,
            destroy: jest.fn()
        };

        await exportRegionCsv({}, res, { query: {} });

        expect(res.destroy).toHaveBeenCalled();
        expect(handleError).not.toHaveBeenCalled();
    });
});

describe("exportRegionExcel", () => {
    test("exports regions as excel", async () => {
        const stream = {};

        validateSchema.mockReturnValue({});

        regionService.exportRegions.mockResolvedValue(stream);

        const res = {
            writeHead: jest.fn()
        };

        await exportRegionExcel({}, res, { query: {} });

        expect(streamExcel).toHaveBeenCalledWith(
            stream,
            expect.any(Array),
            res
        );
    });

    test("handles excel export error before headers are sent", async () => {
        const error = new Error("boom");

        validateSchema.mockReturnValue({});

        regionService.exportRegions.mockRejectedValue(error);

        const res = {
            headersSent: false
        };

        await exportRegionExcel({}, res, { query: {} });

        expect(handleError).toHaveBeenCalledWith(res, error);
    });

    test("destroys response when excel export fails after headers are sent", async () => {
        const error = new Error("boom");

        validateSchema.mockReturnValue({});

        regionService.exportRegions.mockRejectedValue(error);

        const res = {
            headersSent: true,
            destroy: jest.fn()
        };

        await exportRegionExcel({}, res, { query: {} });

        expect(res.destroy).toHaveBeenCalled();
        expect(handleError).not.toHaveBeenCalled();
    });
});

describe("getRegions", () => {
    test("returns regions", async () => {
        const req = {};
        const res = {};

        validateSchema.mockReturnValue({
            page: 1
        });

        regionService.getRegions.mockResolvedValue({
            results: [],
            count: 0
        });

        await getRegions(
            req,
            res,
            { query: { page: "1" } }
        );

        expect(validateSchema).toHaveBeenCalled();

        expect(regionService.getRegions)
            .toHaveBeenCalledWith({
                page: 1
            });

        expect(sendHttpResponse).toHaveBeenCalled();
    });

    test("handles error", async () => {
        const error = new Error("Database error");

        validateSchema.mockReturnValue({});

        regionService.getRegions.mockRejectedValue(error);

        await getRegions({}, {}, { query: {} });

        expect(handleError).toHaveBeenCalled();
    });
});

describe("getRegionById", () => {
    test("returns region", async () => {
        validateSchema.mockReturnValue({
            id: 1
        });

        regionService.getRegionById.mockResolvedValue({
            id: 1,
            name: "Varna"
        });

        const res = {};

        await getRegionById({}, res, { params: { id: "1" } });

        expect(validateSchema).toHaveBeenCalledWith(
            "region",
            "getById",
            {
                id: "1"
            }
        );

        expect(regionService.getRegionById)
            .toHaveBeenCalledWith(1);

        expect(sendHttpResponse).toHaveBeenCalled();
    });

    test("handles error", async () => {
        const error = new Error("boom");

        validateSchema.mockReturnValue({
            id: 1
        });

        regionService.getRegionById.mockRejectedValue(error);

        await getRegionById({}, {}, { params: { id: "1" } });

        expect(handleError).toHaveBeenCalled();
    });
});

describe("createRegion", () => {
    test("creates region", async () => {
        parseRequestBody.mockResolvedValue({
            name: "Varna"
        });

        validateSchema.mockReturnValue({
            name: "Varna"
        });

        regionService.createRegion.mockResolvedValue({
            id: 1,
            name: "Varna"
        });

        const res = {};

        await createRegion({}, res);

        expect(parseRequestBody).toHaveBeenCalled();

        expect(validateSchema).toHaveBeenCalledWith(
            "region",
            "create",
            {
                name: "Varna"
            }
        );

        expect(regionService.createRegion)
            .toHaveBeenCalledWith({
                name: "Varna"
            });

        expect(sendHttpResponse).toHaveBeenCalled();
    });

    test("handles create error", async () => {
        const error = new Error("boom");

        parseRequestBody.mockRejectedValue(error);

        await createRegion({}, {});

        expect(handleError).toHaveBeenCalled();
    });
});

describe("updateRegion", () => {
    test("updates region", async () => {
        parseRequestBody.mockResolvedValue({
            name: "Updated"
        });

        validateSchema.mockReturnValue({
            id: "1",
            name: "Updated"
        });

        regionService.updateRegion.mockResolvedValue({
            id: 1,
            name: "Updated"
        });

        const res = {};

        await updateRegion({}, res, { params: { id: "1" } });

        expect(regionService.updateRegion)
            .toHaveBeenCalledWith(
                "1",
                {
                    id: "1",
                    name: "Updated"
                }
            );

        expect(sendHttpResponse).toHaveBeenCalled();
    });

    test("handles update error", async () => {
        const error = new Error("boom");

        parseRequestBody.mockRejectedValue(error);

        await updateRegion({}, {}, { params: { id: "1" } });

        expect(handleError).toHaveBeenCalled();
    });
});

describe("deleteRegions", () => {
    test("deletes regions", async () => {
        parseRequestBody.mockResolvedValue({
            ids: [1, 2]
        });

        validateSchema.mockReturnValue({
            ids: [1, 2]
        });

        regionService.deleteRegions.mockResolvedValue([
            { id: 1 },
            { id: 2 }
        ]);

        const res = {};

        await deleteRegions({}, res);

        expect(validateSchema).toHaveBeenCalledWith(
            "region",
            "delete",
            {
                ids: [1, 2]
            }
        );

        expect(regionService.deleteRegions)
            .toHaveBeenCalledWith([1, 2]);

        expect(sendHttpResponse).toHaveBeenCalled();
    });

    test("handles delete error", async () => {
        const error = new Error("boom");

        parseRequestBody.mockRejectedValue(error);

        await deleteRegions({}, {});

        expect(handleError).toHaveBeenCalled();
    });
});

describe("getRegionOptions", () => {
    test("returs regions for dropdown", async () => {
        regionService.getRegionOptions.mockResolvedValue([]);

        const res = {};

        await getRegionOptions(
            {},
            res
        );

        expect(sendHttpResponse).toHaveBeenCalled();
    });

    test("handle errors", async () => {
        const error = new Error("error");

        regionService.getRegionOptions.mockRejectedValue(error);

        const res = {};

        await getRegionOptions({}, res);

        expect(handleError).toHaveBeenCalledWith(res, error);
    });

});