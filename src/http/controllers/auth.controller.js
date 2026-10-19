const authService = require("../../services/auth.service");
const { validateSchema } = require("../../validators/validator");
const { handleError } = require("../utils/errorHandler");
const { parseRequestBody } = require("../utils/request");
const { sendHttpResponse } = require("../utils/response");

async function register(req, res) {
    try {

        const body = await parseRequestBody(req);

        const validatedBody = validateSchema("auth", "register", body);

        const result = await authService.register(
            validatedBody.email,
            validatedBody.password
        );

        return sendHttpResponse(
            res,
            201,
            JSON.stringify(result),
            "application/json"
        );

    } catch (err) {
        handleError(res, err);
    }
}

async function verify(req, res, { query }) {
    try {
        const validatedQuery = validateSchema("auth", "verify", query);

        const result = await authService.verify(
            validatedQuery.token
        );

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(result),
            "application/json"
        );

    } catch (err) {
        handleError(res, err);
    }
}

async function resendVerification(req, res) {
    try {
        const body = await parseRequestBody(req);

        const validatedBody = validateSchema("auth", "resend", body);

        const result = await authService.resendVerification(
            validatedBody.email
        );

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(result),
            "application/json"
        );
    } catch (err) {
        handleError(res, err);
    }
}

async function login(req, res) {
    try {
        const body = await parseRequestBody(req);

        const validatedBody = validateSchema("auth", "login", body);

        const result = await authService.login(
            validatedBody.email,
            validatedBody.password
        );

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(result),
            "application/json"
        );

    } catch (err) {
        handleError(res, err);
    }
}

module.exports = {
    register,
    verify,
    resendVerification,
    login
}