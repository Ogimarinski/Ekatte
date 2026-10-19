jest.mock("../src/services/mayorality.service");
jest.mock("../src/validators/validator");
jest.mock("../src/http/utils/request");
jest.mock("../src/http/utils/response");
jest.mock("../src/http/utils/errorHandler");
jest.mock("../src/http/utils/export");

const mayoralityService = require("../src/services/mayorality.service");

const {
    validateSchema
} = require("../src/validators/validator");

const {
    exportMayoralityCsv,
    exportMayoralityExcel,
    getMayoralities,
    getMayoralityById,
    createMayorality,
    updateMayorality,
    deleteMayoralities,
    getMayoralityOptions
} = require("../src/http/controllers/mayorality.controller");

const { parseRequestBody } = require("../src/http/utils/request");
const { sendHttpResponse } = require("../src/http/utils/response");
const { handleError } = require("../src/http/utils/errorHandler");
const { streamCsv, streamExcel } = require("../src/http/utils/export");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("exportMayoralityCsv", () => {
    test("exports mayoralities as csv", async () => {
        const req = {};
        const res = { writeHead: jest.fn() };
        const stream = {};

        validateSchema.mockReturnValue({
            query: "Test"
        });
        mayoralityService.exportMayoralities.mockResolvedValue(stream);

        await exportMayoralityCsv(
            req,
            res,
            { query: { query: "Test" } }
        );

        expect(validateSchema).toHaveBeenCalledWith(
            "mayorality",
            "list",
            {
                query: "Test"
            }
        );

        expect(mayoralityService.exportMayoralities)
            .toHaveBeenCalledWith({
                query: "Test"
            });

        expect(res.writeHead).toHaveBeenCalled();

        expect(streamCsv).toHaveBeenCalled();
    });

    test("handles export error", async () => {
        const error = new Error("boom");

        validateSchema.mockReturnValue({});
        mayoralityService.exportMayoralities.mockRejectedValue(error);

        await exportMayoralityCsv(
            {},
            { headersSent: false },
            { query: {} }
        );

        expect(handleError).toHaveBeenCalled();
    });

    test("destroys response when headers already sent", async () => {
        const error = new Error("boom");

        validateSchema.mockReturnValue({});
        mayoralityService.exportMayoralities.mockRejectedValue(error);

        const res = {
            headersSent: true,
            destroy: jest.fn()
        };

        await exportMayoralityCsv({}, res, { query: {} });

        expect(res.destroy).toHaveBeenCalled();
    });
});

describe("exportMayoralityExcel", () => {
    test("exports mayoralities as excel", async () => {
        const stream = {};

        validateSchema.mockReturnValue({});
        mayoralityService.exportMayoralities.mockResolvedValue(stream);

        const res = {
            writeHead: jest.fn()
        };

        await exportMayoralityExcel({}, res, { query: {} });

        expect(streamExcel).toHaveBeenCalledWith(
            stream,
            expect.any(Array),
            res
        );
    });

    test("handles excel export error before headers are sent", async () => {
        const error = new Error("boom");

        validateSchema.mockReturnValue({});

        mayoralityService.exportMayoralities.mockRejectedValue(error);

        const res = {
            headersSent: false
        };

        await exportMayoralityExcel({}, res, { query: {} });

        expect(handleError).toHaveBeenCalledWith(res, error);
    });

    test("destroys response when excel export fails after headers are sent", async () => {
        const error = new Error("boom");

        validateSchema.mockReturnValue({});

        mayoralityService.exportMayoralities.mockRejectedValue(error);

        const res = {
            headersSent: true,
            destroy: jest.fn()
        };

        await exportMayoralityExcel({}, res, { query: {} });

        expect(res.destroy).toHaveBeenCalled();
        expect(handleError).not.toHaveBeenCalled();
    });
});

describe("getMayoralities", () => {
    test("returns mayoralities", async () => {
        validateSchema.mockReturnValue({
            page: 1
        });

        mayoralityService.getMayoralities.mockResolvedValue({
            results: [],
            count: 0
        });

        const res = {};

        await getMayoralities(
            {},
            res,
            { query: { page: "1" } }
        );

        expect(validateSchema).toHaveBeenCalledWith(
            "mayorality",
            "list",
            {
                page: "1"
            }
        );

        expect(sendHttpResponse).toHaveBeenCalled();
    });

    test("handles error", async () => {
        const error = new Error("boom");

        validateSchema.mockReturnValue({});

        mayoralityService.getMayoralities.mockRejectedValue(error);

        const res = {};

        await getMayoralities({}, res, { query: {} });

        expect(handleError).toHaveBeenCalledWith(res, error);
    });
});

describe("getMayoralityById", () => {
    test("returns mayorality", async () => {
        validateSchema.mockReturnValue({
            id: 1
        });

        mayoralityService.getMayoralityById.mockResolvedValue({
            id: 1
        });

        const res = {};

        await getMayoralityById({}, res, { params: { id: "1" } });

        expect(validateSchema).toHaveBeenCalledWith(
            "mayorality",
            "getById",
            {
                id: "1"
            }
        );

        expect(sendHttpResponse).toHaveBeenCalled();
    });

    test("handles error", async () => {
        const error = new Error("boom");

        validateSchema.mockReturnValue({
            id: 1
        });

        mayoralityService.getMayoralityById.mockRejectedValue(error);

        const res = {};

        await getMayoralityById({}, res, { params: { id: "1" } });

        expect(handleError).toHaveBeenCalledWith(res, error);
    });
});

describe("createMayorality", () => {
    test("creates mayorality", async () => {
        parseRequestBody.mockResolvedValue({
            name: "Test"
        });

        validateSchema.mockReturnValue({
            name: "Test"
        });

        mayoralityService.createMayorality.mockResolvedValue({
            id: 1
        });

        const res = {};

        await createMayorality({}, res);

        expect(parseRequestBody).toHaveBeenCalled();

        expect(validateSchema).toHaveBeenCalledWith(
            "mayorality",
            "create",
            {
                name: "Test"
            }
        );

        expect(sendHttpResponse).toHaveBeenCalled();
    });

    test("handles error", async () => {
        const error = new Error("boom");

        parseRequestBody.mockRejectedValue(error);

        const res = {};

        await createMayorality({}, res);

        expect(handleError).toHaveBeenCalledWith(res, error);
    });
});

describe("updateMayorality", () => {
    test("updates mayorality", async () => {
        parseRequestBody.mockResolvedValue({
            name: "Updated"
        });

        validateSchema.mockReturnValue({
            id: "1",
            name: "Updated"
        });

        mayoralityService.updateMayorality.mockResolvedValue({
            id: 1
        });

        const res = {};

        await updateMayorality({}, res, { params: { id: "1" } });

        expect(validateSchema).toHaveBeenCalledWith(
            "mayorality",
            "update",
            {
                id: "1",
                name: "Updated"
            }
        );

        expect(mayoralityService.updateMayorality)
            .toHaveBeenCalledWith(
                "1",
                {
                    id: "1",
                    name: "Updated"
                }
            );

        expect(sendHttpResponse).toHaveBeenCalled();
    });

    test("handles error", async () => {
        const error = new Error("boom");

        parseRequestBody.mockRejectedValue(error);

        const res = {};

        await updateMayorality({}, res, { params: { id: "1" } });

        expect(handleError).toHaveBeenCalledWith(res, error);
    });
});

describe("deleteMayoralities", () => {
    test("deletes mayoralities", async () => {
        parseRequestBody.mockResolvedValue({
            ids: [1, 2]
        });

        validateSchema.mockReturnValue({
            ids: [1, 2]
        });

        mayoralityService.deleteMayoralities.mockResolvedValue([
            { id: 1 },
            { id: 2 }
        ]);

        const res = {};

        await deleteMayoralities({}, res);

        expect(validateSchema).toHaveBeenCalledWith(
            "mayorality",
            "delete",
            {
                ids: [1, 2]
            }
        );

        expect(sendHttpResponse).toHaveBeenCalled();
    });

    test("handles error", async () => {
        const error = new Error("boom");

        parseRequestBody.mockRejectedValue(error);

        const res = {};

        await deleteMayoralities({}, res);

        expect(handleError).toHaveBeenCalledWith(res, error);
    });
});

describe("getMayoralityOptions", () => {
    test("returns mayoralities for dropdown", async () => {
        validateSchema.mockReturnValue({
            id: 1
        });

        mayoralityService.getMayoralityOptions.mockResolvedValue([]);

        const res = {};

        await getMayoralityOptions(
            {},
            res,
            { query: { id: "1" } }
        );

        expect(validateSchema).toHaveBeenCalledWith(
            "mayorality",
            "options",
            {
                id: "1"
            }
        );

        expect(sendHttpResponse).toHaveBeenCalled();
    });

    test("handles error", async () => {
        const error = new Error("error");

        validateSchema.mockReturnValue({});

        mayoralityService.getMayoralityOptions.mockRejectedValue(error);

        const res = {};

        await getMayoralityOptions({}, res, { query: {} });

        expect(handleError).toHaveBeenCalledWith(res, error);
    });
});
