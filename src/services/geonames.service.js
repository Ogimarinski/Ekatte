const loadGeoNames = require("../loaders/geonames.loader");
const normalize = require("../utils/string.utils");

const geoNamesSettlements = loadGeoNames("BG");

function searchSettlement(settlement) {
    const transliteration = normalize(settlement.transliteration);
    const bgName = normalize(settlement.name);

    const populatedPlaces = geoNamesSettlements.filter(geoNamesSettlement =>
        geoNamesSettlement.featureClass === "P" &&
        (
            normalize(geoNamesSettlement.name) === transliteration ||
            geoNamesSettlement.alternateNames.some(
                alt => normalize(alt) === transliteration || normalize(alt) === bgName
            )
        )
    );

    if (populatedPlaces.length > 0) {
        return populatedPlaces;
    }

    return geoNamesSettlements.filter(geoNamesSettlement =>
        geoNamesSettlement.featureClass === "A" &&
        geoNamesSettlement.featureCode === "ADM3" &&
        (
            normalize(geoNamesSettlement.name) === transliteration ||
            geoNamesSettlement.alternateNames.some(
                alt => normalize(alt) === transliteration || normalize(alt) === bgName
            )
        )
    )
}

function findBestMatch(settlement, candidates) {
    return candidates.find(candidate =>
        candidate.adminCode2 === settlement.municipality_code &&
        (
            normalize(candidate.name) === normalize(settlement.transliteration) ||
            candidate.alternateNames.some(
                alt => normalize(alt) === normalize(settlement.name)
            )
        )
    );
}

module.exports = {
    searchSettlement,
    findBestMatch
};