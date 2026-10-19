const { AppError } = require("../../errors/AppError");
const { ConflictError } = require("../../errors/ConflictError");
const { sendHttpResponse } = require("./response");

const INTERNAL_ERROR_MESSAGE = "Вътрешна грешка на сървъра.";
const INTERNAL_ERROR_STATUSCODE = 500;

const HTTP_STATUS_RANGES = Object.freeze({
    CLIENT_ERROR: Object.freeze({ MIN: 400, MAX: 499 }),
    SERVER_ERROR: Object.freeze({ MIN: 500, MAX: 599 })
});

const { MIN: CLIENT_ERROR_MIN } = HTTP_STATUS_RANGES.CLIENT_ERROR;
const { MAX: SERVER_ERROR_MAX } = HTTP_STATUS_RANGES.SERVER_ERROR;
const { MIN: SERVER_ERROR_MIN } = HTTP_STATUS_RANGES.SERVER_ERROR;

const PG_ERROR_CODES = Object.freeze({
    UNIQUE_VIOLATION: "23505"
});

function sendJsonError(res, statusCode, message) {
    return sendHttpResponse(
        res,
        statusCode,
        JSON.stringify({ error: message }),
        "application/json"
    );
}

function transformToAppError(err) {
    if (err?.code === PG_ERROR_CODES.UNIQUE_VIOLATION) {
        return new ConflictError("Този код вече съществува.", { cause: err });
    }

    return err;
}

function getStatusCode(err) {

    if (
        err instanceof AppError &&
        Number.isInteger(err.statusCode) &&
        err.statusCode >= CLIENT_ERROR_MIN &&
        err.statusCode <= SERVER_ERROR_MAX
    ) {
        return err.statusCode;
    }

    return INTERNAL_ERROR_STATUSCODE;
}

function handleError(res, err) {
    if (res.headersSent) {
        console.error("Грешка след изпратени хедъри", err);
        return res.destroy();
    }

    const error = transformToAppError(err);
    const statusCode = getStatusCode(error);

    if (statusCode >= SERVER_ERROR_MIN) {
        console.error(error);

        return sendJsonError(
            res,
            statusCode,
            INTERNAL_ERROR_MESSAGE
        );
    }

    return sendJsonError(res, statusCode, error.message);
}


module.exports = {
    handleError
};