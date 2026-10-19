const { NotFoundError } = require("../errors/NotFoundError");
const mayoralityRepository = require("../repositories/mayorality.repository");
const municipalityRepository = require("../repositories/municipality.repository");

async function exportMayoralities(filters) {
    return mayoralityRepository.streamMayoralities(filters);
}

async function getMayoralities(filters) {
    return mayoralityRepository.findMayoralities(filters);
}

async function getMayoralityById(id) {
    const mayorality = await mayoralityRepository.findMayoralityById(id);

    if (!mayorality) {
        throw new NotFoundError("Mayorality not found");
    }

    return mayorality;
}

async function generateMayoralityCode(munId) {
    const municipality = await municipalityRepository.findMunicipalityById(munId);

    if (!municipality) {
        throw new NotFoundError("Municipality not found");
    }

    const max = await mayoralityRepository.findMaxMayoralityNumber(munId);

    const next = (max || 0) + 1;

    return `${municipality.code}-${String(next).padStart(2, "0")}`;
}

async function createMayorality(data) {
    const code = await generateMayoralityCode(data.municipality_id);

    return mayoralityRepository.createMayorality({
        ...data,
        code
    });
}

async function updateMayorality(id, data) {

    const updatedData = data.municipality_id
        ? {
            ...data,
            code: await generateMayoralityCode(data.municipality_id)
        }
        : { ...data };

    const updatedMayorality = await mayoralityRepository.updateMayorality(id, updatedData);

    if (!updatedMayorality) {
        throw new NotFoundError("Mayorality not found");
    }

    return updatedMayorality;
}

async function deleteMayoralities(ids) {
    const deleted = await mayoralityRepository.deleteMayoralties(ids);

    if (deleted.length !== ids.length) {
        throw new NotFoundError("Some mayoralties were not found");
    }

    return deleted;
}

async function getMayoralityOptions(filters) {
    return mayoralityRepository.findMayoralityOptions(filters);
}

module.exports = {
    exportMayoralities,
    getMayoralities,
    getMayoralityById,
    createMayorality,
    updateMayorality,
    deleteMayoralities,
    getMayoralityOptions
}