const statsController = require("../controllers/stats.controller");

module.exports = [
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/stats" }),
        handler: statsController.getStats
    }
];