const municipalityRepository = require("../repositories/municipality.repository");
const regionRepository = require("../repositories/region.repository");
const { NotFoundError } = require("../errors/NotFoundError");

async function exportMunicipalities(filters) {
    return municipalityRepository.streamMunicipalities(filters);
}

async function getMunicipalities(filters) {
    return municipalityRepository.findMunicipalities(filters);
}

async function getMunicipalityById(id) {
    const municipality = await municipalityRepository.findMunicipalityById(id);

    if (!municipality) {
        throw new NotFoundError("Municipality not found");
    }

    return municipality;
}

async function generateMunicipalityCode(regionId) {
    const region = await regionRepository.findRegionById(regionId);

    if (!region) {
        throw new NotFoundError("Region not found");
    }

    const max = await municipalityRepository.findMaxMunicipalityNumber(regionId);

    const next = (max || 0) + 1;

    return region.code + String(next).padStart(2, "0");

}

async function createMunicipality(data) {
    const code = await generateMunicipalityCode(data.region_id);

    return municipalityRepository.createMunicipality({
        ...data,
        code
    });
}

async function updateMunicipality(id, data) {

    const updatedData = data.region_id
        ? {
            ...data,
            code: await generateMunicipalityCode(data.region_id)
        }
        : { ...data };

    const updatedMunicipality = await municipalityRepository.updateMunicipality(id, updatedData);

    if (!updatedMunicipality) {
        throw new NotFoundError("Municipality not found");
    }

    return updatedMunicipality;
}
async function deleteMunicipalities(ids) {
    const deleted = await municipalityRepository.deleteMunicipalities(ids);

    if (deleted.length !== ids.length) {
        throw new NotFoundError("Some municipalities were not found");
    }

    return deleted;
}

async function getMunicipalityOptions(filters) {
    return municipalityRepository.findMunicipalityOptions(filters);
}

module.exports = {
    exportMunicipalities,
    getMunicipalities,
    getMunicipalityById,
    createMunicipality,
    updateMunicipality,
    deleteMunicipalities,
    getMunicipalityOptions
};