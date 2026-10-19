const municipalityController = require("../controllers/municipality.controller");

module.exports = [
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/municipalities" }),
        handler: municipalityController.getMunicipalities
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/municipalities/options" }),
        handler: municipalityController.getMunicipalityOptions
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/municipalities/:id" }),
        handler: municipalityController.getMunicipalitesById
    },
    {
        method: "POST",
        pattern: new URLPattern({ pathname: "/api/municipalities" }),
        handler: municipalityController.createMunicipality
    },
    {
        method: "PUT",
        pattern: new URLPattern({ pathname: "/api/municipalities/:id" }),
        handler: municipalityController.updateMunicipality
    },
    {
        method: "DELETE",
        pattern: new URLPattern({ pathname: "/api/municipalities" }),
        handler: municipalityController.deleteMunicipalities
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/municipalities/export/csv" }),
        handler: municipalityController.exportMunicipalityCsv,
        requiresAuth: false
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/municipalities/export/excel" }),
        handler: municipalityController.exportMunicipalityExcel,
        requiresAuth: false
    }
];