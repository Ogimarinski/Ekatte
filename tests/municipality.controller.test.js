jest.mock("../src/services/municipality.service");
jest.mock("../src/validators/validator");
jest.mock("../src/http/utils/request");
jest.mock("../src/http/utils/response");
jest.mock("../src/http/utils/errorHandler");
jest.mock("../src/http/utils/export");

const municipalityService = require("../src/services/municipality.service");

const {
    validateSchema
} = require("../src/validators/validator");

const {
    exportMunicipalityCsv,
    exportMunicipalityExcel,
    getMunicipalities,
    getMunicipalitesById,
    createMunicipality,
    updateMunicipality,
    deleteMunicipalities,
    getMunicipalityOptions
} = require("../src/http/controllers/municipality.controller");

const { parseRequestBody } = require("../src/http/utils/request");
const { sendHttpResponse } = require("../src/http/utils/response");
const { handleError } = require("../src/http/utils/errorHandler");
const { streamCsv, streamExcel } = require("../src/http/utils/export");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("exportMunicipalityCsv", () => {
    test("exports municipalities as csv", async () => {
        const req = {};
        const res = {
            writeHead: jest.fn()
        };

        const stream = {};

        validateSchema.mockReturnValue({
            query: "Varna"
        });

        municipalityService.exportMunicipalities.mockResolvedValue(stream);

        await exportMunicipalityCsv(
            req,
            res,
            { query: { query: "Varna" } }
        );

        expect(validateSchema).toHaveBeenCalledWith(
            "municipality",
            "list",
            {
                query: "Varna"
            }
        );

        expect(municipalityService.exportMunicipalities)
            .toHaveBeenCalledWith({
                query: "Varna"
            });

        expect(res.writeHead).toHaveBeenCalled();

        expect(streamCsv).toHaveBeenCalled();
    });

    test("handles export error before headers are sent", async () => {
        const error = new Error("boom");

        validateSchema.mockReturnValue({});

        municipalityService.exportMunicipalities.mockRejectedValue(error);

        await exportMunicipalityCsv(
            {},
            { headersSent: false },
            { query: {} }
        );

        expect(handleError).toHaveBeenCalledWith(
            expect.anything(),
            error
        );
    });

    test("destroys response when headers are sent", async () => {
        const error = new Error("boom");

        validateSchema.mockReturnValue({});

        municipalityService.exportMunicipalities.mockRejectedValue(error);

        const res = {
            headersSent: true,
            destroy: jest.fn()
        };

        await exportMunicipalityCsv({}, res, { query: {} });

        expect(res.destroy).toHaveBeenCalled();
        expect(handleError).not.toHaveBeenCalled();
    });
});

describe("exportMunicipalityExcel", () => {
    test("exports municipalities as excel", async () => {
        const stream = {};

        validateSchema.mockReturnValue({});

        municipalityService.exportMunicipalities.mockResolvedValue(stream);

        const res = {
            writeHead: jest.fn()
        };

        await exportMunicipalityExcel({}, res, { query: {} });

        expect(streamExcel).toHaveBeenCalledWith(
            stream,
            expect.any(Array),
            res
        );
    });

    test("handles excel export error before headers are sent", async () => {
        const error = new Error("boom");

        validateSchema.mockReturnValue({});

        municipalityService.exportMunicipalities.mockRejectedValue(error);

        const res = {
            headersSent: false
        };

        await exportMunicipalityExcel({}, res, { query: {} });

        expect(handleError).toHaveBeenCalledWith(res, error);
    });

    test("destroys response when excel export fails after headers are sent", async () => {
        const error = new Error("boom");

        validateSchema.mockReturnValue({});

        municipalityService.exportMunicipalities.mockRejectedValue(error);

        const res = {
            headersSent: true,
            destroy: jest.fn()
        };

        await exportMunicipalityExcel({}, res, { query: {} });

        expect(res.destroy).toHaveBeenCalled();
        expect(handleError).not.toHaveBeenCalled();
    });
});

describe("getMunicipalities", () => {
    test("returns municipalities", async () => {
        validateSchema.mockReturnValue({
            page: 1
        });

        municipalityService.getMunicipalities.mockResolvedValue({
            results: [],
            count: 0
        });

        const res = {};

        await getMunicipalities(
            {},
            res,
            { query: { page: "1" } }
        );

        expect(validateSchema).toHaveBeenCalledWith(
            "municipality",
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

        municipalityService.getMunicipalities.mockRejectedValue(error);

        const res = {};

        await getMunicipalities({}, res, { query: {} });

        expect(handleError).toHaveBeenCalledWith(res, error);
    });
});

describe("getMunicipalitesById", () => {
    test("returns municipality", async () => {
        validateSchema.mockReturnValue({
            id: 1
        });

        municipalityService.getMunicipalityById.mockResolvedValue({
            id: 1,
            name: "Varna"
        });

        const res = {};

        await getMunicipalitesById({}, res, { params: { id: "1" } });

        expect(validateSchema).toHaveBeenCalledWith(
            "municipality",
            "getById",
            {
                id: "1"
            }
        );

        expect(municipalityService.getMunicipalityById)
            .toHaveBeenCalledWith(1);

        expect(sendHttpResponse).toHaveBeenCalled();
    });

    test("handles error", async () => {
        const error = new Error("boom");

        validateSchema.mockReturnValue({
            id: 1
        });

        municipalityService.getMunicipalityById.mockRejectedValue(error);

        const res = {};

        await getMunicipalitesById({}, res, { params: { id: "1" } });

        expect(handleError).toHaveBeenCalledWith(res, error);
    });
});

describe("createMunicipality", () => {
    test("creates municipality", async () => {
        parseRequestBody.mockResolvedValue({
            name: "Varna"
        });

        validateSchema.mockReturnValue({
            name: "Varna"
        });

        municipalityService.createMunicipality.mockResolvedValue({
            id: 1
        });

        const res = {};

        await createMunicipality({}, res);

        expect(parseRequestBody).toHaveBeenCalled();

        expect(validateSchema).toHaveBeenCalledWith(
            "municipality",
            "create",
            {
                name: "Varna"
            }
        );

        expect(sendHttpResponse).toHaveBeenCalled();
    });

    test("handles error", async () => {
        const error = new Error("boom");

        parseRequestBody.mockRejectedValue(error);

        const res = {};

        await createMunicipality({}, res);

        expect(handleError).toHaveBeenCalledWith(res, error);
    });
});

describe("updateMunicipality", () => {
    test("updates municipality", async () => {
        parseRequestBody.mockResolvedValue({
            name: "Updated"
        });

        validateSchema.mockReturnValue({
            id: "1",
            name: "Updated"
        });

        municipalityService.updateMunicipality.mockResolvedValue({
            id: 1
        });

        const res = {};

        await updateMunicipality({}, res, { params: { id: "1" } });

        expect(validateSchema).toHaveBeenCalledWith(
            "municipality",
            "update",
            {
                id: "1",
                name: "Updated"
            }
        );

        expect(municipalityService.updateMunicipality)
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

        await updateMunicipality({}, res, { params: { id: "1" } });

        expect(handleError).toHaveBeenCalledWith(res, error);
    });
});

describe("deleteMunicipalities", () => {
    test("deletes municipalities", async () => {
        parseRequestBody.mockResolvedValue({
            ids: [1, 2]
        });

        validateSchema.mockReturnValue({
            ids: [1, 2]
        });

        municipalityService.deleteMunicipalities.mockResolvedValue([
            { id: 1 },
            { id: 2 }
        ]);

        const res = {};

        await deleteMunicipalities({}, res);

        expect(validateSchema).toHaveBeenCalledWith(
            "municipality",
            "delete",
            {
                ids: [1, 2]
            }
        );

        expect(municipalityService.deleteMunicipalities)
            .toHaveBeenCalledWith([1, 2]);

        expect(sendHttpResponse).toHaveBeenCalled();
    });

    test("handles error", async () => {
        const error = new Error("boom");

        parseRequestBody.mockRejectedValue(error);

        const res = {};

        await deleteMunicipalities({}, res);

        expect(handleError).toHaveBeenCalledWith(res, error);
    });
});

describe("getMunicipalityOptions", () => {
    test("returns municipalities for dropdown", async () => {
        validateSchema.mockReturnValue({
            id: 1
        });

        municipalityService.getMunicipalityOptions.mockResolvedValue([]);

        const res = {};

        await getMunicipalityOptions(
            {},
            res,
            { query: { id: "1" } }
        );

        expect(validateSchema).toHaveBeenCalledWith(
            "municipality",
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

        municipalityService.getMunicipalityOptions.mockRejectedValue(error);

        const res = {};

        await getMunicipalityOptions({}, res, { query: {} });

        expect(handleError).toHaveBeenCalledWith(res, error);
    });
});
