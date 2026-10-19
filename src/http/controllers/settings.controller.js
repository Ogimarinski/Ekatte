const settingsService = require("../../services/settings.service");
const { validateSchema } = require("../../validators/validator");
const { handleError } = require("../utils/errorHandler");
const { parseRequestBody } = require("../utils/request");
const { sendHttpResponse } = require("../utils/response");

async function getSettings(req, res) {
    try {
        const result = await settingsService.getSettings(req.user.id);

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

async function updateSettings(req, res) {
    try {
        const body = await parseRequestBody(req);

        const validatedBody = validateSchema("settings", "update", body);

        const result = await settingsService.updateSettings(req.user.id, validatedBody);

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
    getSettings,
    updateSettings
};
