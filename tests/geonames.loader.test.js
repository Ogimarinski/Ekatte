jest.mock("fs", () => ({
    readFileSync: jest.fn()
}));

const fs = require("fs");
const loadGeoNames = require("../src/loaders/geonames.loader");


test("loadGeoNames for CN keeps only populated places", () => {
    fs.readFileSync.mockReturnValue(
        [
            "1\tCity\tCity\t\t0\t0\tP\tPPL\tCN\t\t11\t22\t",
            "2\tCounty\tCounty\t\t0\t0\tA\tADM3\tCN\t\t11\t22\t"
        ].join("\n")
    );

    const result = loadGeoNames("CN");

    expect(result).toHaveLength(1);
    expect(result[0].featureClass).toBe("P");
});

test("loadGeoNames for BG keeps P and ADM3", () => {
    fs.readFileSync.mockReturnValue(
        [
            "1\tSofia\tSofia\t\t0\t0\tP\tPPL\tBG\t\t11\t22\t",
            "2\tSofia Municipality\tSofia Municipality\t\t0\t0\tA\tADM3\tBG\t\t11\t22\t"
        ].join("\n")
    );

    const result = loadGeoNames("BG");

    expect(result).toHaveLength(2);
});

test("defaults to BG when no country code is given", () => {
    fs.readFileSync.mockReturnValue(
        "1\tSofia\tSofia\t\t0\t0\tP\tPPL\tBG\t\t11\t22\t"
    );

    const result = loadGeoNames();

    expect(result[0].countryCode).toBe("BG");
});