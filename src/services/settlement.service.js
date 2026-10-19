const { generateEkatteFrom4 } = require("../helper");
const settlementRepository = require("../repositories/settlement.repository");
const municipalityRepository = require("../repositories/municipality.repository");
const mayoralityRepository = require("../repositories/mayorality.repository");
const geonamesService = require("../services/geonames.service");
const loadGeoNames = require("../loaders/geonames.loader");
const { NotFoundError } = require("../errors/NotFoundError");


async function exportSettlements(filters) {
    return settlementRepository.streamSettlements(filters);
}

async function getSettlements(filters) {
    return settlementRepository.findSettlements(filters);
}

async function getSettlemetById(id) {
    const settlement = await settlementRepository.findSettlementById(id);

    if (!settlement) {
        throw new NotFoundError("Settlement not found");
    }

    return settlement;
}

async function generateSettlementCode() {
    const max = await settlementRepository.findMaxSettlementNumber();

    const nextCode = String((max || 0) + 1).padStart(4, "0");

    return generateEkatteFrom4(nextCode);
}

async function ensureParentsExist({ municipality_id, mayorality_id }) {
    if (municipality_id) {
        const municipality = await municipalityRepository.findMunicipalityById(municipality_id);

        if (!municipality) {
            throw new NotFoundError("Municipality not found");
        }
    }

    if (mayorality_id) {
        const mayorality = await mayoralityRepository.findMayoralityById(mayorality_id);

        if (!mayorality) {
            throw new NotFoundError("Mayorality not found");
        }
    }
}

async function createSettlement(data) {
    await ensureParentsExist(data);

    const ekatte = await generateSettlementCode();

    return settlementRepository.createSettlement({
        ...data,
        ekatte
    });
}

async function updateSettlement(id, data) {
    await ensureParentsExist(data);

    const updatedSettlement = await settlementRepository.updateSettlement(id, data);

    if (!updatedSettlement) {
        throw new NotFoundError("Settlement not found");
    }

    return updatedSettlement;
}

async function deleteSettlements(ids) {
    const deleted = await settlementRepository.deleteSettlements(ids);

    if (deleted.length !== ids.length) {
        throw new NotFoundError("Some settlements were not found");
    }

    return deleted;
}

async function enrichSettlementsWithCoordinates() {
    const settlements = await settlementRepository.findAllForGeonames();

    const notFound = [];

    for (const settlement of settlements) {
        const candidates = geonamesService.searchSettlement(settlement);

        const match = geonamesService.findBestMatch(settlement, candidates);

        if (!match) {
            const fallback = await settlementRepository.findCoordinatesByMunicipality(
                settlement.municipality_id,
                settlement.id
            );

            if (fallback) {
                await settlementRepository.updateCoordinates(
                    settlement.id,
                    fallback.latitude,
                    fallback.longitude
                );

                console.log(`${settlement.name} -> municipality callback`);
                continue;
            }

            notFound.push(settlement);
            continue;
        }

        await settlementRepository.updateCoordinates(
            settlement.id,
            match.latitude,
            match.longitude,
        );
    }

    console.log("Not found:", notFound.length);

    for (const settlement of notFound) {
        console.log(
            settlement.name,
            settlement.transliteration,
            settlement.municipality_code
        );
    }
}

async function getSettlementClimate(id, year) {
    return settlementRepository.findClimateBySettlementAndYear(id, year);
}

async function getSettlementClimateYears(id, filters) {
    return settlementRepository.findSettlementClimateYears(id, filters);
}

async function importChineseSettlements() {
    const chineseSettlements = loadGeoNames("CN");

    console.log(`Found ${chineseSettlements.length} Chinese settlements.`);

    const batchSize = 1000;

    for (let i = 0; i < chineseSettlements.length; i += batchSize) {
        const batch = chineseSettlements.slice(i, i + batchSize);

        await settlementRepository.createSettlementsBulk(batch);

        console.log(
            `Processed ${Math.min(i + batchSize, chineseSettlements.length)} / ${chineseSettlements.length}`
        );
    }
}

module.exports = {
    exportSettlements,
    getSettlements,
    getSettlemetById,
    createSettlement,
    updateSettlement,
    deleteSettlements,
    enrichSettlementsWithCoordinates,
    getSettlementClimate,
    getSettlementClimateYears,
    importChineseSettlements
}