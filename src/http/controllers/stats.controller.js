const { sendHttpResponse } = require("../../http/utils/response");
const statsService = require("../../services/stats.service");

async function getStats(req, res) {
    try {
        const stats = await statsService.getStatsData();

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(stats),
            "application/json"
        );
    } catch (err) {
        return sendHttpResponse(
            res,
            500,
            JSON.stringify({ error: err.message }),
            "application/json"
        );
    }
}

module.exports = { getStats };