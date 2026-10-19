const climateRepository = require("../repositories/climate.repository");

async function getSummary(filters) {
    return climateRepository.findSummary(filters);
}

async function getTimeseries(filters) {
    return climateRepository.findTimeseries(filters);
}

async function getTopSettlements(filters) {
    return climateRepository.findTopSettlements(filters);
}

async function getYearRange() {
    return climateRepository.findYearRange();
}

module.exports = {
    getSummary,
    getTimeseries,
    getTopSettlements,
    getYearRange
};