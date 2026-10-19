const regionRepository = require("../repositories/region.repository");
const { NotFoundError } = require("../errors/NotFoundError");

async function exportRegions(filters) {
    return regionRepository.streamRegions(filters);
}

async function getRegions(filters) {
    return regionRepository.findRegions(filters);
}

async function getRegionById(id) {
    const region = await regionRepository.findRegionById(id);

    if (!region) {
        throw new NotFoundError("Region not found");
    }

    return region;
}

async function createRegion(data) {
    return regionRepository.createRegion(data);
}

async function updateRegion(id, data) {
    const updatedRegion = await regionRepository.updateRegion(id, data);

    if (!updatedRegion) {
        throw new NotFoundError("Region not found");
    }

    return updatedRegion;
}

async function deleteRegions(ids) {
    console.log(ids);

    const deleted = await regionRepository.deleteRegions(ids);

    console.log(deleted);

    if (deleted.length !== ids.length) {
        throw new NotFoundError("Some regions were not found");
    }

    return deleted;
}

async function getRegionOptions() {
    return regionRepository.findRegionOptions();
}

module.exports = {
    exportRegions,
    getRegions,
    getRegionById,
    createRegion,
    updateRegion,
    deleteRegions,
    getRegionOptions
};