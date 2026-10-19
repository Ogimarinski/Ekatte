const climateController = require("../controllers/climate.controller");

module.exports = [
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/climate/summary" }),
        handler: climateController.getSummary
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/climate/timeseries" }),
        handler: climateController.getTimeseries
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/climate/top-settlements" }),
        handler: climateController.getTopSettlements
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/climate/year-range" }),
        handler: climateController.getYearRange
    }
];