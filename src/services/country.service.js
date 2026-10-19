const countryRepository = require("../repositories/country.repository");

async function getCountries() {
    return countryRepository.findAll();
}

module.exports = { getCountries };
