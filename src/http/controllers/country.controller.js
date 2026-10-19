const countryService = require("../../services/country.service");
const { sendHttpResponse } = require("../utils/response");
const { handleError } = require("../utils/errorHandler");

async function getCountries(req, res) {
    try {
        const countries = await countryService.getCountries();
        return sendHttpResponse(res, 200, JSON.stringify(countries), "application/json");
    } catch (err) {
        handleError(res, err);
    }
}

module.exports = { getCountries };