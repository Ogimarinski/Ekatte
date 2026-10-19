jest.mock("../src/http/utils/response");

const { sendHttpResponse } = require("../src/http/utils/response");
const { handleError } = require("../src/http/utils/errorHandler");

const { AppError } = require("../src/errors/AppError");
const { ValidationError } = require("../src/errors/ValidationError");
const { ConflictError } = require("../src/errors/ConflictError");
const { NotFoundError } = require("../src/errors/NotFoundError");
const { UnauthorizedError } = require("../src/errors/UnauthorizedError");
const { ForbiddenError } = require("../src/errors/ForbiddenError");
const { LockedError } = require("../src/errors/LockedError");
const { TooManyRequestsError } = require("../src/errors/TooManyRequestsError");

const INTERNAL_ERROR_MESSAGE = "Вътрешна грешка на сървъра.";

function expectJsonError(res, statusCode, message) {
    expect(sendHttpResponse).toHaveBeenCalledWith(
        res,
        statusCode,
        JSON.stringify({ error: message }),
        "application/json"
    );
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => { });
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe("handleError", () => {
    describe("client errors (4xx)", () => {
        test.each([
            [ValidationError, 400],
            [UnauthorizedError, 401],
            [ForbiddenError, 403],
            [NotFoundError, 404],
            [ConflictError, 409],
            [LockedError, 423],
            [TooManyRequestsError, 429]
        ])("%p sends status %i with its own message and is not logged", (ErrorClass, statusCode) => {
            const res = {};

            handleError(res, new ErrorClass("Test message"));

            expectJsonError(res, statusCode, "Test message");
            expect(console.error).not.toHaveBeenCalled();
        });

        test("translates a postgres unique violation into 409", () => {
            const res = {};
            const error = Object.assign(new Error("duplicate key value violates unique constraint"), {
                code: "23505"
            });

            handleError(res, error);

            expectJsonError(res, 409, "Този код вече съществува.");
        });
    });

    describe("server errors (5xx)", () => {
        test("hides the message of an unknown error and logs it", () => {
            const res = {};
            const error = new Error('column "secret_column" does not exist');

            handleError(res, error);

            expectJsonError(res, 500, INTERNAL_ERROR_MESSAGE);
            expect(console.error).toHaveBeenCalledWith(error);
        });

        test("does not trust a statusCode on errors that are not AppError", () => {
            const res = {};
            const error = Object.assign(new Error("internal details"), { statusCode: 400 });

            handleError(res, error);

            expectJsonError(res, 500, INTERNAL_ERROR_MESSAGE);
            expect(console.error).toHaveBeenCalledWith(error);
        });

        test("keeps the status of a 5xx AppError but hides its message", () => {
            const res = {};
            const error = new AppError(503, "Database is down");

            handleError(res, error);

            expectJsonError(res, 503, INTERNAL_ERROR_MESSAGE);
            expect(console.error).toHaveBeenCalledWith(error);
        });

        test.each([200, 302, 700])("treats an AppError with invalid status %i as 500", (statusCode) => {
            const res = {};

            handleError(res, new AppError(statusCode, "internal details"));

            expectJsonError(res, 500, INTERNAL_ERROR_MESSAGE);
        });
    });

    test("destroys the response when headers are already sent", () => {
        const res = { headersSent: true, destroy: jest.fn() };
        const error = new Error("Stream broke");

        handleError(res, error);

        expect(res.destroy).toHaveBeenCalled();
        expect(sendHttpResponse).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(expect.any(String), error);
    });
});