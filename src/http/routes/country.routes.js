const countryController = require("../controllers/country.controller");

module.exports = [
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/countries" }),
        handler: countryController.getCountries
    }
];