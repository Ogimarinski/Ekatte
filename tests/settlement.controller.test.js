jest.mock("../src/services/settlement.service");
jest.mock("../src/validators/validator");
jest.mock("../src/http/utils/request");
jest.mock("../src/http/utils/response");
jest.mock("../src/http/utils/errorHandler");
jest.mock("../src/http/utils/export");

const settlementService = require("../src/services/settlement.service");
const {
    validateSchema
} = require("../src/validators/validator");
const { getSettlements, exportSettlementCsv, exportSettlementExcel, getSettlementById, createSettlement, updateSettlement, deleteSettlements, getSettlementClimate, getSettlementClimateYears } = require("../src/http/controllers/settlement.controller");
const { sendHttpResponse } = require("../src/http/utils/response");
const { parseRequestBody } = require("../src/http/utils/request")
const { handleError } = require("../src/http/utils/errorHandler");
const { streamCsv, streamExcel } = require("../src/http/utils/export");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("exportSettlementCsv", () => {
    test("exports settlements as csv", async () => {
        const req = {};
        const res = {
            writeHead: jest.fn()
        };

        const stream = {};

        validateSchema.mockReturnValue({
            query: "Sofia"
        });

        settlementService.exportSettlements.mockResolvedValue(stream);

        await exportSettlementCsv(
            req,
            res,
            { query: { query: "Sofia" } }
        );

        expect(validateSchema).toHaveBeenCalledWith(
            "settlement",
            "list",
            {
                query: "Sofia"
            }
        );

        expect(settlementService.exportSettlements)
            .toHaveBeenCalledWith({
                query: "Sofia"
            });

        expect(res.writeHead).toHaveBeenCalledWith(
            200,
            {
                "Content-Type": "text/csv",
                "Content-Disposition": "attachment; filename=settlements.csv"
            }
        );

        expect(streamCsv).toHaveBeenCalled();
    });

    test("handles export error before headers are sent", async () => {
        const req = {};
        const res = {
            headersSent: false
        };

        const error = new Error("boom");

        validateSchema.mockReturnValue({});

        settlementService.exportSettlements.mockRejectedValue(error);

        await exportSettlementCsv(req, res, { query: {} });

        expect(handleError).toHaveBeenCalledWith(res, error);
    });

    test("destroys response when export fails and headers are sent", async () => {
        const req = {};
        const res = {
            headersSent: true,
            destroy: jest.fn()
        };

        const error = new Error("error");

        validateSchema.mockReturnValue({});

        settlementService.exportSettlements.mockRejectedValue(error);

        await exportSettlementCsv(req, res, { query: {} });

        expect(res.destroy).toHaveBeenCalled();
        expect(handleError).not.toHaveBeenCalled();
    });
});

describe("exportSettlmentExcel", () => {
    test("exports settlements as excel", async () => {
        const req = {};

        const res = {
            writeHead: jest.fn()
        };

        const stream = {};

        validateSchema.mockReturnValue({
            query: "Sofia"
        });

        settlementService.exportSettlements.mockResolvedValue(stream);

        await exportSettlementExcel(
            req,
            res,
            { query: { query: "Sofia" } }
        );

        expect(validateSchema).toHaveBeenCalledWith(
            "settlement",
            "list",
            {
                query: "Sofia"
            }
        );

        expect(settlementService.exportSettlements)
            .toHaveBeenCalledWith({
                query: "Sofia"
            });

        expect(res.writeHead).toHaveBeenCalledWith(
            200,
            {
                "content-type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "content-disposition":
                    "attachment; filename=settlements.xlsx"
            }
        );

        expect(streamExcel).toHaveBeenCalledWith(
            stream,
            expect.any(Array),
            res
        );
    });

    test("handles excel export error before headers are sent", async () => {
        const req = {};

        const res = {
            headersSent: false
        };

        const error = new Error("boom");

        validateSchema.mockReturnValue({});

        settlementService.exportSettlements.mockRejectedValue(error);

        await exportSettlementExcel(req, res, { query: {} });

        expect(handleError).toHaveBeenCalledWith(res, error);
    });

    test("destroys response when excel export fails after headers are sent", async () => {
        const req = {};

        const res = {
            headersSent: true,
            destroy: jest.fn()
        };

        const error = new Error("boom");

        validateSchema.mockReturnValue({});

        settlementService.exportSettlements.mockRejectedValue(error);

        await exportSettlementExcel(req, res, { query: {} });

        expect(res.destroy).toHaveBeenCalled();
        expect(handleError).not.toHaveBeenCalled();
    });
});

describe("getSettlements", () => {
    test("returns settlements", async () => {
        const req = {};
        const res = {};

        validateSchema.mockReturnValue({
            page: 1
        });

        settlementService.getSettlements.mockReturnValue({
            results: [],
            count: 0
        });

        await getSettlements(req, res,
            { query: { page: "1" } }
        );

        expect(validateSchema).toHaveBeenCalledWith(
            "settlement",
            "list",
            {
                page: "1"
            }
        );

        expect(settlementService.getSettlements)
            .toHaveBeenCalledWith({
                page: 1
            });

        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            200,
            JSON.stringify({
                results: [],
                count: 0
            }),
            "application/json"
        );
    });

    test("handles error", async () => {
        const req = {};
        const res = {};

        validateSchema.mockReturnValue({});

        const error = new Error("Database error");

        settlementService.getSettlements.mockRejectedValue(error);

        await getSettlements(req, res, { query: {} });

        expect(handleError).toHaveBeenCalledWith(res, error);
    });
});

describe("getSettlementById", () => {
    test("returns http response 200 with settlement", async () => {
        const req = {};
        const res = {};

        validateSchema.mockReturnValue({
            id: 1
        });

        settlementService.getSettlemetById.mockResolvedValue({
            id: 1,
            name: "Sofia"
        });

        await getSettlementById(req, res, { params: { id: "1" } });

        expect(validateSchema).toHaveBeenCalledWith(
            "settlement",
            "getById",
            {
                id: "1"
            }
        );

        expect(settlementService.getSettlemetById).toHaveBeenCalledWith(1);

        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            200,
            JSON.stringify({
                id: 1,
                name: "Sofia"
            }),
            "application/json"
        );
    });

    test("handles error", async () => {
        const req = {};
        const res = {};

        const error = new Error("error");

        validateSchema.mockReturnValue({
            id: 1
        });

        settlementService.getSettlemetById.mockRejectedValue(error);

        await getSettlementById(req, res, { params: { id: "1" } });

        expect(handleError).toHaveBeenCalledWith(res, error);
    });
});


describe("createSettlement", () => {
    test("creates settlement", async () => {
        const req = {};
        const res = {};

        parseRequestBody.mockResolvedValue({
            name: "Sofia"
        });

        validateSchema.mockReturnValue({
            name: "Sofia"
        });

        settlementService.createSettlement.mockResolvedValue({
            id: 1,
            name: "Sofia"
        });

        await createSettlement(req, res);

        expect(parseRequestBody).toHaveBeenCalledWith(req);

        expect(validateSchema).toHaveBeenCalledWith(
            "settlement",
            "create",
            {
                name: "Sofia"
            }
        );

        expect(settlementService.createSettlement)
            .toHaveBeenCalledWith({
                name: "Sofia"
            });

        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            201,
            JSON.stringify({
                id: 1,
                name: "Sofia"
            }),
            "application/json"
        );
    });

    test("handles create settlement error", async () => {
        const req = {};
        const res = {};

        const error = new Error("Validation failed");

        parseRequestBody.mockRejectedValue(error);

        await createSettlement(req, res);

        expect(handleError).toHaveBeenCalledWith(
            res,
            error
        );
    });
});

describe("updateSettlement", () => {
    test("updates settlement", async () => {
        const req = {};
        const res = {};

        parseRequestBody.mockResolvedValue({
            name: "Updated"
        });

        validateSchema.mockReturnValue({
            id: "1",
            name: "Updated"
        });

        settlementService.updateSettlement.mockResolvedValue({
            id: 1,
            name: "Updated"
        });

        await updateSettlement(req, res, { params: { id: "1" } });

        expect(parseRequestBody).toHaveBeenCalledWith(req);

        expect(validateSchema).toHaveBeenCalledWith(
            "settlement",
            "update",
            {
                id: "1",
                name: "Updated"
            }
        );

        expect(settlementService.updateSettlement)
            .toHaveBeenCalledWith(
                "1",
                {
                    id: "1",
                    name: "Updated"
                }
            );

        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            200,
            JSON.stringify({
                id: 1,
                name: "Updated"
            }),
            "application/json"
        );
    });

    test("handles update settlement error", async () => {
        const req = {};
        const res = {};

        const error = new Error("Validation failed");

        parseRequestBody.mockRejectedValue(error);

        await updateSettlement(req, res, { params: { id: "1" } });

        expect(handleError).toHaveBeenCalledWith(
            res,
            error
        );
    });
});

describe("deleteSettlements", () => {
    test("deletes settlements", async () => {
        const req = {};
        const res = {};

        parseRequestBody.mockResolvedValue({
            ids: [1, 2]
        });

        validateSchema.mockReturnValue({
            ids: [1, 2]
        });

        settlementService.deleteSettlements.mockResolvedValue([
            { id: 1 },
            { id: 2 }
        ]);

        await deleteSettlements(req, res);

        expect(parseRequestBody).toHaveBeenCalledWith(req);

        expect(validateSchema).toHaveBeenCalledWith(
            "settlement",
            "delete",
            {
                ids: [1, 2]
            }
        );

        expect(settlementService.deleteSettlements)
            .toHaveBeenCalledWith([1, 2]);

        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            200,
            JSON.stringify([
                { id: 1 },
                { id: 2 }
            ]),
            "application/json"
        );
    });

    test("handles delete settlements error", async () => {
        const req = {};
        const res = {};

        const error = new Error("Validation failed");

        parseRequestBody.mockRejectedValue(error);

        await deleteSettlements(req, res);

        expect(handleError).toHaveBeenCalledWith(
            res,
            error
        );
    });
});

describe("getSettlementClimate", () => {
    test("returns climate data for settlement and year", async () => {
        const req = {};
        const res = {};

        validateSchema.mockReturnValue({ id: 5, year: 2023 });
        settlementService.getSettlementClimate.mockResolvedValue({
            year: 2023,
            avg_temperature: 12.3
        });

        await getSettlementClimate(req, res, { params: { id: "5", year: "2023" } });

        expect(validateSchema).toHaveBeenCalledWith(
            "settlement",
            "climate",
            { id: "5", year: "2023" }
        );

        expect(settlementService.getSettlementClimate)
            .toHaveBeenCalledWith(5, 2023);

        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            200,
            JSON.stringify({ year: 2023, avg_temperature: 12.3 }),
            "application/json"
        );
    });

    test("handles error", async () => {
        const err = new Error("boom");
        validateSchema.mockImplementation(() => { throw err; });

        await getSettlementClimate({}, {}, { params: { id: "5", year: "2023" } });

        expect(handleError).toHaveBeenCalledWith({}, err);
    });
});

describe("getSettlementClimateYears", () => {
    test("returns yearly climate data for settlement", async () => {
        const req = {};
        const res = {};
        const query = { avg_temperature_from: "5" };

        validateSchema.mockReturnValue({
            id: 5,
            avg_temperature_from: 5
        });

        settlementService.getSettlementClimateYears.mockResolvedValue([
            { year: 2022, avg_temperature: 10.1 }
        ]);

        await getSettlementClimateYears(req, res, { params: { id: "5" }, query: query });

        expect(validateSchema).toHaveBeenCalledWith(
            "settlement",
            "climate_years",
            { id: "5", avg_temperature_from: "5" }
        );

        expect(settlementService.getSettlementClimateYears)
            .toHaveBeenCalledWith(5, { avg_temperature_from: 5 });

        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            200,
            JSON.stringify([{ year: 2022, avg_temperature: 10.1 }]),
            "application/json"
        );
    });

    test("uses id from the path even when query contains id", async () => {
        validateSchema.mockReturnValue({ id: 5 });
        settlementService.getSettlementClimateYears.mockResolvedValue([]);

        await getSettlementClimateYears({}, {}, { params: { id: "5" }, query: { id: "7" } });

        expect(validateSchema).toHaveBeenCalledWith(
            "settlement",
            "climate_years",
            { id: "5" }
        );
        expect(settlementService.getSettlementClimateYears).toHaveBeenCalledWith(5, {});
    });

    test("handles error", async () => {
        const err = new Error("boom");
        validateSchema.mockImplementation(() => { throw err; });

        await getSettlementClimateYears({}, {}, { params: { id: "5" }, query: {} });

        expect(handleError).toHaveBeenCalledWith({}, err);
    });
});