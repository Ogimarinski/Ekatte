const regionController = require("../controllers/region.controller");

module.exports = [
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/regions" }),
        handler: regionController.getRegions
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/regions/options" }),
        handler: regionController.getRegionOptions
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/regions/:id" }),
        handler: regionController.getRegionById
    },
    {
        method: "POST",
        pattern: new URLPattern({ pathname: "/api/regions" }),
        handler: regionController.createRegion
    },
    {
        method: "PUT",
        pattern: new URLPattern({ pathname: "/api/regions/:id" }),
        handler: regionController.updateRegion
    },
    {
        method: "DELETE",
        pattern: new URLPattern({ pathname: "/api/regions" }),
        handler: regionController.deleteRegions
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/regions/export/csv" }),
        handler: regionController.exportRegionCsv,
        // TODO: временен фикс заради големи export файлове, счупващи Authorization header навигацията.
        // Истинското решение е signed/temporary token за export navigation (виж дискусия в чата).
        requiresAuth: false
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/regions/export/excel" }),
        handler: regionController.exportRegionExcel,
        // TODO: виж бележката по-горе - временно, не постоянно решение.
        requiresAuth: false
    }
];