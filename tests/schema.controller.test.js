jest.mock("../src/http/utils/response");
jest.mock("../src/http/utils/errorHandler");

const { sendHttpResponse } = require("../src/http/utils/response");
const { handleError } = require("../src/http/utils/errorHandler");

const {
    getCreateSchema,
    getUpdateSchema
} = require("../src/http/controllers/schema.controller");


describe("getCreateSchema", () => {
    test("returns create schema", async () => {
        const req = {};
        const res = {};

        await getCreateSchema(req, res, { params: { resource: "regions" } });

        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            200,
            expect.any(String),
            "application/json"
        );
    });

    test("returns 404 when create schema does not exist", async () => {
        const req = {};
        const res = {};

        await getCreateSchema(req, res, { params: { resource: "invalid" } });

        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            404,
            JSON.stringify({
                error: "Schema not found"
            }),
            "application/json"
        );
    });

    test("calls handleError when sendHttpResponse throws", async () => {
        const req = {};
        const res = {};

        const error = new Error("boom");

        sendHttpResponse.mockImplementation(() => {
            throw error;
        });

        await getCreateSchema(req, res, { params: { resource: "regions" } });

        expect(handleError).toHaveBeenCalledWith(res, error);
    });
});


describe("getUpdateSchema", () => {
    test("returns update schema", async () => {
        const req = {};
        const res = {};

        await getUpdateSchema(req, res, { params: { resource: "regions" } });

        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            200,
            expect.any(String),
            "application/json"
        );
    });

    test("returns 404 when update schema does not exist", async () => {
        const req = {};
        const res = {};

        await getUpdateSchema(req, res, { params: { resource: "invalid" } });

        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            404,
            JSON.stringify({
                error: "Schema not found"
            }),
            "application/json"
        );
    });

    test("calls handleError when sendHttpResponse throws", async () => {
        const req = {};
        const res = {};

        const error = new Error("boom");

        sendHttpResponse.mockImplementation(() => {
            throw error;
        });

        await getUpdateSchema(req, res, { params: { resource: "regions" } });

        expect(handleError).toHaveBeenCalledWith(res, error);
    });
});