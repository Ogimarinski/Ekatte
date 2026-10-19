const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

function loadGeoNames(countryCode = "BG") {

    assert.ok(
        typeof countryCode === 'string' && COUNTRY_CODE_PATTERN.test(countryCode),
        `loadGeoNames expects a 2-letter uppercase country, got ${countryCode}`
    );

    const file = fs.readFileSync(
        path.join(__dirname, `../../data/${countryCode}.txt`),
        "utf8"
    );

    const coordinates = [];

    const lines = file.split("\n").filter(Boolean);

    for (const line of lines) {
        const cols = line.split("\t");

        if (countryCode === "CN") {
            if (cols[6] !== "P") {
                continue;
            }
        } else {
            if (cols[6] !== "P" && !(cols[6] === "A" && cols[7] === "ADM3")) {
                continue;
            }
        }

        coordinates.push({
            geonameId: Number(cols[0]),
            name: cols[1],
            transliteration: cols[2],
            alternateNames: cols[3] ? cols[3].split(",") : [],
            latitude: Number(cols[4]),
            longitude: Number(cols[5]),
            featureClass: cols[6],
            featureCode: cols[7],
            countryCode: cols[8],
            adminCode2: cols[11],
            adminCode3: cols[12]
        });
    }

    return coordinates;
}


module.exports = loadGeoNames;