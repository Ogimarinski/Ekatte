const settlementController = require("../controllers/settlement.controller");

module.exports = [
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/settlements" }),
        handler: settlementController.getSettlements
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/settlements/:id" }),
        handler: settlementController.getSettlementById
    },
    {
        method: "POST",
        pattern: new URLPattern({ pathname: "/api/settlements" }),
        handler: settlementController.createSettlement
    },
    {
        method: "PUT",
        pattern: new URLPattern({ pathname: "/api/settlements/:id" }),
        handler: settlementController.updateSettlement
    },
    {
        method: "DELETE",
        pattern: new URLPattern({ pathname: "/api/settlements" }),
        handler: settlementController.deleteSettlements
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/settlements/export/csv" }),
        handler: settlementController.exportSettlementCsv,
        requiresAuth: false
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/settlements/export/excel" }),
        handler: settlementController.exportSettlementExcel,
        requiresAuth: false
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/settlements/:id/climate-years" }),
        handler: settlementController.getSettlementClimateYears
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/settlements/:id/climate/:year" }),
        handler: settlementController.getSettlementClimate
    }
]