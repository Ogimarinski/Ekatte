const climateService = require("../../services/climate.service");
const { validateSchema } = require("../../validators/validator");
const { handleError } = require("../utils/errorHandler");
const { sendHttpResponse } = require("../utils/response");

async function getSummary(req, res, { query }) {
    try {
        const validatedParams = validateSchema("climate", "summary", query);

        const summary = await climateService.getSummary(validatedParams);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(summary),
            "application/json"
        );
    } catch (err) {
        handleError(res, err);
    }
}

async function getTimeseries(req, res, { query }) {
    try {
        const validatedParams = validateSchema("climate", "timeseries", query);

        const timeseries = await climateService.getTimeseries(validatedParams);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(timeseries),
            "application/json"
        );
    } catch (err) {
        handleError(res, err);
    }
}

async function getTopSettlements(req, res, { query }) {
    try {
        const validatedParams = validateSchema("climate", "topsettlements", query);

        const topSettlements = await climateService.getTopSettlements(validatedParams);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(topSettlements),
            "application/json"
        );

    } catch (err) {
        handleError(res, err);
    }
}

async function getYearRange(req, res) {
    try {

        const yearRange = await climateService.getYearRange();

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(yearRange),
            "application/json"
        );
    } catch (err) {
        handleError(res, err);
    }
}

module.exports = {
    getSummary,
    getTimeseries,
    getTopSettlements,
    getYearRange
}