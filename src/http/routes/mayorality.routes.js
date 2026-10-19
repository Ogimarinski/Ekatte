const mayoralityController = require("../controllers/mayorality.controller");

module.exports = [
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/mayoralties" }),
        handler: mayoralityController.getMayoralities
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/mayoralties/options" }),
        handler: mayoralityController.getMayoralityOptions
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/mayoralties/:id" }),
        handler: mayoralityController.getMayoralityById
    },
    {
        method: "POST",
        pattern: new URLPattern({ pathname: "/api/mayoralties" }),
        handler: mayoralityController.createMayorality
    },
    {
        method: "PUT",
        pattern: new URLPattern({ pathname: "/api/mayoralties/:id" }),
        handler: mayoralityController.updateMayorality
    },
    {
        method: "DELETE",
        pattern: new URLPattern({ pathname: "/api/mayoralties" }),
        handler: mayoralityController.deleteMayoralities
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/mayoralties/export/csv" }),
        handler: mayoralityController.exportMayoralityCsv,
        // TODO: временен фикс заради големи export файлове, счупващи Authorization header навигацията.
        // Истинското решение е signed/temporary token за export navigation (виж дискусия в чата).
        requiresAuth: false
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/mayoralties/export/excel" }),
        handler: mayoralityController.exportMayoralityExcel,
        // TODO: виж бележката по-горе - временно, не постоянно решение.
        requiresAuth: false
    }
]