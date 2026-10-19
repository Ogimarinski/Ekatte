const statsRepository = require("../repositories/stats.repository");

async function getStatsData() {
    return await statsRepository.findStats();
}

module.exports = { getStatsData };