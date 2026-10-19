jest.mock("../src/loaders/geonames.loader", () =>
    jest.fn(() => [
        {
            name: "Sofia",
            featureClass: "P",
            featureCode: "PPL",
            adminCode2: "68134",
            alternateNames: ["София"],
        },
        {
            name: "Sofia Municipality",
            featureClass: "A",
            featureCode: "ADM3",
            adminCode2: "68134",
            alternateNames: ["Столична община"],
        }
    ])
);

const {
    searchSettlement,
    findBestMatch
} = require("../src/services/geonames.service");

describe("search settlements", () => {
    test("searchSettlement returns populated place", () => {
        const result = searchSettlement({
            name: "София",
            transliteration: "Sofia"
        });

        expect(result).toHaveLength(1);
        expect(result[0].featureClass).toBe("P");
    });

    test("searchSettlement falls back to ADM3", () => {
        const result = searchSettlement({
            name: "Столична община",
            transliteration: "Sofia Municipality"
        });

        expect(result).toHaveLength(1);
        expect(result[0].featureCode).toBe("ADM3");
    });

    test("searchSettlement returns empty array", () => {
        const result = searchSettlement({
            name: "Unknown",
            transliteration: "Unknown"
        });

        expect(result).toEqual([]);
    });

});

describe("findBestMatch", () => {
    test("findBestMatch returns matching settlement", () => {
        const candidates = [
            {
                name: "Sofia",
                adminCode2: "68134",
                alternateNames: ["София"]
            },
            {
                name: "Plovdiv",
                adminCode2: "12345",
                alternateNames: ["Пловдив"]
            }
        ];

        const result = findBestMatch(
            {
                municipality_code: "68134",
                name: "София",
                transliteration: "Sofia"
            },
            candidates
        );

        expect(result).toEqual(candidates[0]);
    });

    test("findBestMatch returns undefined when no match exists", () => {
        const candidates = [
            {
                name: "Plovdiv",
                adminCode2: "12345",
                alternateNames: ["Пловдив"]
            }
        ];

        const result = findBestMatch(
            {
                municipality_code: "68134",
                name: "София",
                transliteration: "Sofia"
            },
            candidates
        );

        expect(result).toBeUndefined();
    });

    test("findBestMatch matches by alternate name", () => {
        const candidates = [
            {
                name: "CompletelyDifferentName",
                adminCode2: "12345",
                alternateNames: ["София"]
            }
        ];

        const result = findBestMatch(
            {
                municipality_code: "12345",
                name: "София",
                transliteration: "Sofia"
            },
            candidates
        );

        expect(result).toEqual(candidates[0]);
    });
});