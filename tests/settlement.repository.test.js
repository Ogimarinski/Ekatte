const { Readable } = require("stream");
jest.mock("../db");

const db = require("../db");
const { ValidationError } = require("../src/errors/ValidationError");

const {
    streamSettlements,
    findSettlements,
    findSettlementById,
    createSettlement,
    updateSettlement,
    deleteSettlements,
    findMaxSettlementNumber,
    findAllForGeonames,
    updateCoordinates,
    findCoordinatesByMunicipality,
    findClimateBySettlementAndYear,
    findAllCoordinates,
    createSettlementsBulk,
    streamSettlementCoordinatesByCountry,
    createGridMappings,
    findSettlementGridMappingsByCountry,
    createSettlementClimate,
    findSettlementClimateYears
} = require("../src/repositories/settlement.repository");

describe("settlement.repository", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("findSettlements", () => {
        test("returns paginated settlements", async () => {
            db.query
                .mockResolvedValueOnce({
                    rows: [
                        {
                            id: 1,
                            name: "Sofia"
                        }
                    ]
                })
                .mockResolvedValueOnce({
                    rows: [
                        {
                            count: "1"
                        }
                    ]
                });

            const result = await findSettlements({});

            expect(db.query).toHaveBeenCalledTimes(2);

            expect(result).toEqual({
                results: [
                    {
                        id: 1,
                        name: "Sofia"
                    }
                ],
                count: 1,
                page: 1,
                limit: 20
            });
        });

        test("passes search filter to db query", async () => {
            db.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: "0" }] });

            await findSettlements({ query: "Sofia" });

            expect(db.query.mock.calls[0][1]).toEqual([
                "%Sofia%",
                20,
                0
            ]);
        });

        test("passes filters to db query", async () => {
            db.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: "0" }] });

            await findSettlements({
                region_id: 1,
                municipality_id: 2,
                mayorality_id: 3,
                updated_at_from: "2025-01-01",
                updated_at_to: "2025-01-10",
                country_code: "BG",
                avg_temperature_from: 10,
                avg_temperature_to: 11,
                min_temperature_from: 3,
                min_temperature_to: 4,
                max_temperature_from: 15,
                max_temperature_to: 17
            });

            expect(db.query.mock.calls[0][1]).toEqual(
                expect.arrayContaining([
                    1,
                    2,
                    3,
                    "2025-01-01",
                    "2025-01-10",
                    "BG",
                    10,
                    11,
                    3,
                    4,
                    15,
                    17
                ])
            );
        });

        test("passes sort to db query", async () => {
            db.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: "0" }] });

            await findSettlements({
                sort: "name:desc"
            });

            expect(db.query.mock.calls[0][0]).toContain(
                "ORDER BY s.name DESC"
            );
        });

        test("rejects invalid sort field without querying the db", async () => {
            await expect(findSettlements({
                sort: "invalid:desc"
            })).rejects.toThrow(ValidationError);

            expect(db.query).not.toHaveBeenCalled();
        });

        test("uses descending order", async () => {
            db.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: "0" }] });

            await findSettlements({
                sort: "name:desc"
            });

            expect(db.query.mock.calls[0][0]).toContain(
                "ORDER BY s.name DESC"
            );
        });

        test("uses ascending order", async () => {
            db.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: "0" }] });

            await findSettlements({
                sort: "name:asc"
            });

            expect(db.query.mock.calls[0][0]).toContain(
                "ORDER BY s.name ASC"
            );
        });
    });

    describe("streamSettlements", () => {

        test.each([
            ["the stream ends", (stream) => {
                stream.push(null);
                stream.resume();
            }],
            ["the download is aborted", (stream) => stream.destroy()],
            ["the query fails", (stream) => stream.destroy(new Error("boom"))]
        ])("releases the client once when %s", async (_, finish) => {
            const stream = new Readable({ objectMode: true, read() { } });
            const release = jest.fn();

            db.connect.mockResolvedValue({
                query: jest.fn(() => stream),
                release
            });

            const result = await streamSettlements({});

            expect(result).toBe(stream);

            finish(stream);
            await new Promise((resolve) => stream.on("close", resolve));

            expect(release).toHaveBeenCalledTimes(1);
        });

        test("streamSettlements release client and throws error", async () => {
            const release = jest.fn();
            const error = new Error("error");

            const client = {
                query: jest.fn(() => { throw error }),
                release
            };

            db.connect.mockResolvedValue(client);

            await expect(streamSettlements({})).rejects.toThrow("error");
            expect(release).toHaveBeenCalledTimes(1);
        });
    });

    describe("findSettlementById", () => {
        test("returns settlement by id", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        ekatte: "12345",
                        name: "Sofia",
                        municipality_id: 1,
                        mayorality_id: 2,
                        region_id: 3
                    }
                ]
            });

            const result = await findSettlementById(1);

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(result.name).toBe("Sofia");
            expect(result.ekatte).toBe("12345");
        });
    });

    describe("createSettlement", () => {
        test("creates settlement", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 5,
                        ekatte: "12345",
                        name: "New settlement"
                    }
                ]
            });

            const result = await createSettlement({
                ekatte: "12345",
                name: "New settlement",
                municipality_id: 1,
                mayorality_id: 2
            });

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(result.id).toBe(5);
            expect(result.name).toBe("New settlement");
        });
    });

    describe("updateSettlement", () => {
        test("updates settlement name", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        name: "Updated",
                        ekatte: "12345"
                    }
                ]
            });

            const result = await updateSettlement(1, {
                name: "Updated",
                ekatte: "12345"
            });

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(result.name).toBe("Updated");
            expect(result.ekatte).toBe("12345");
        });

        test("updates settlement only with municipality", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        municipality_id: 5,
                        mayorality_id: 2
                    }
                ]
            });

            const result = await updateSettlement(1, {
                municipality_id: 5
            });

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(db.query.mock.calls[0][1]).toContain(5);
            expect(result.municipality_id).toBe(5);
        });

        test("updates settlement only with mayorality", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        municipality_id: 1,
                        mayorality_id: 7
                    }
                ]
            });

            const result = await updateSettlement(1, {
                mayorality_id: 7
            });

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(db.query.mock.calls[0][1]).toContain(7);
            expect(result.mayorality_id).toBe(7);
        });
    });

    describe("deleteSettlements", () => {
        test("deletes settlements", async () => {
            db.query.mockResolvedValue({
                rows: [
                    { id: 1 },
                    { id: 2 }
                ]
            });

            const result = await deleteSettlements([1, 2]);

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(result).toEqual([
                { id: 1 },
                { id: 2 }
            ]);
        });
    });

    describe("findMaxSettlementNumber", () => {
        test("returns max settlement number", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        max: 9999
                    }
                ]
            });

            const result = await findMaxSettlementNumber();

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(result).toBe(9999);
        });
    });

    describe("findAllForGeonames", () => {
        test("returns all settlements for geonames", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        ekatte: "12345",
                        name: "Sofia",
                        municipality_id: 1,
                        municipality_code: "SOF01",
                        transliteration: "Sofia",
                        region_transliteration: "Sofia"
                    }
                ]
            });

            const result = await findAllForGeonames();

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(result).toEqual([
                {
                    id: 1,
                    ekatte: "12345",
                    name: "Sofia",
                    municipality_id: 1,
                    municipality_code: "SOF01",
                    transliteration: "Sofia",
                    region_transliteration: "Sofia"
                }
            ]);
        });
    });

    describe("updateCoordinates", () => {
        test("updates settlement coordinates", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        latitude: 42.6977,
                        longitude: 23.3219
                    }
                ]
            });

            const result = await updateCoordinates(
                1,
                42.6977,
                23.3219
            );

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(db.query.mock.calls[0][1]).toEqual([
                42.6977,
                23.3219,
                1
            ]);

            expect(result.latitude).toBe(42.6977);
            expect(result.longitude).toBe(23.3219);
        });
    });

    describe("findCoordinatesByMunicipality", () => {
        test("returns coordinates from municipality as numbers", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        latitude: "42.700000",
                        longitude: "23.300000"
                    }
                ]
            });

            const result = await findCoordinatesByMunicipality(5, 10);

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(db.query.mock.calls[0][1]).toEqual([5, 10]);

            expect(result).toEqual({
                latitude: 42.7,
                longitude: 23.3
            });
        });

        test("returns undefined when no settlement in the municipality has coordinates", async () => {
            db.query.mockResolvedValue({ rows: [] });

            const result = await findCoordinatesByMunicipality(5, 10);

            expect(result).toBeUndefined();
        });
    });

    describe("findClimateBySettlementAndYear", () => {
        test("returns climate data for settlement and year", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        month: 1,
                        avg_temperature: 2.5,
                        min_temperature: -5,
                        max_temperature: 8
                    }
                ]
            });

            const result = await findClimateBySettlementAndYear(1, 2025);

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(db.query.mock.calls[0][1]).toEqual([1, 2025]);

            expect(result).toEqual([
                {
                    month: 1,
                    avg_temperature: 2.5,
                    min_temperature: -5,
                    max_temperature: 8
                }
            ]);
        });
    });

    describe("findAllCoordinates", () => {
        test("returns all settlements with coordinates", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        latitude: 42.7,
                        longitude: 23.3
                    }
                ]
            });

            const result = await findAllCoordinates();

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(result).toEqual([
                {
                    id: 1,
                    latitude: 42.7,
                    longitude: 23.3
                }
            ]);
        });
    });

    describe("createSettlementBulk", () => {
        test("create settlement with bulk insert", async () => {
            db.query.mockResolvedValue({});

            const mockSettlements = [
                {
                    geonameId: 123,
                    name: "Име",
                    transliteration: "Name",
                    alternateNames: [],
                    latitude: 1,
                    longitude: 1,
                    featureClass: "P",
                    featureCode: "code",
                    countryCode: "BG",
                    adminCode2: "",
                    adminCode3: ""
                },
                {
                    geonameId: 1234,
                    name: "Име",
                    transliteration: "Name",
                    alternateNames: [],
                    latitude: 2,
                    longitude: 2,
                    featureClass: "P",
                    featureCode: "code",
                    countryCode: "BG",
                    adminCode2: "",
                    adminCode3: ""
                }
            ];

            await createSettlementsBulk(mockSettlements);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining("VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12)"),
                [123, "BG", "Име", "Name", 1, 1, 1234, "BG", "Име", "Name", 2, 2]
            );
        });

        test("does nothing for an empty batch", async () => {
            const result = await createSettlementsBulk([]);

            expect(result).toBeUndefined();
            expect(db.query).not.toHaveBeenCalled();
        });

        test("throws when batch exceeds the max parameter limit", async () => {
            const oversized = { length: 10923 };

            await expect(createSettlementsBulk(oversized))
                .rejects.toThrow("createSettlementsBulk received 10923 rows, max is 10922. Chunk before calling.");

            expect(db.query).not.toHaveBeenCalled();
        });
    });

    describe("streamSettlementCooridantesByCountry", () => {
        test.each([
            ["the stream ends", (stream) => {
                stream.push(null);
                stream.resume();
            }],
            ["the download is aborted", (stream) => stream.destroy()],
            ["the query fails", (stream) => stream.destroy(new Error("boom"))]
        ])("releases the client once when %s", async (_, finish) => {
            const stream = new Readable({ objectMode: true, read() { } });
            const release = jest.fn();

            db.connect.mockResolvedValue({
                query: jest.fn(() => stream),
                release
            });

            const result = await streamSettlementCoordinatesByCountry("BG");

            expect(result).toBe(stream);

            finish(stream);
            await new Promise((resolve) => stream.on("close", resolve));

            expect(release).toHaveBeenCalledTimes(1);
        });

        test("release client and throws error", async () => {
            const error = new Error("error");
            const release = jest.fn();

            const client = {
                query: jest.fn(() => { throw error }),
                release
            };

            db.connect.mockResolvedValue(client);

            await expect(streamSettlementCoordinatesByCountry("")).rejects.toThrow("error");
            expect(release).toHaveBeenCalledTimes(1);
        });
    });

    describe("createGridMappings", () => {
        test("creates grid mapping", async () => {
            const mockBatch = [
                {
                    settlementId: 1,
                    latIndex: 2,
                    lonIndex: 3
                }
            ];

            await createGridMappings(mockBatch);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining("VALUES ($1, $2, $3)"),
                [1, 2, 3]
            );
        });

        test("does nothing for an empty batch", async () => {
            const result = await createGridMappings([]);

            expect(result).toBeUndefined();
            expect(db.query).not.toHaveBeenCalled();
        });

        test("throws when batch exceeds the max parameter limit", async () => {
            const oversized = { length: 21846 };

            await expect(createGridMappings(oversized))
                .rejects.toThrow("createGridMappings received 21846 rows, max is 21845. Chunk before calling.");

            expect(db.query).not.toHaveBeenCalled();
        });
    });

    describe("findSettlementGridMappingsByCountry", () => {
        test("returns grid mappings for country", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        settlement_id: 1,
                        lat_index: 2,
                        lon_index: 3
                    }
                ]
            });

            const result = await findSettlementGridMappingsByCountry("CN");

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining("WHERE s.country_code = $1"),
                ["CN"]
            );

            expect(result).toEqual([
                {
                    settlement_id: 1,
                    lat_index: 2,
                    lon_index: 3
                }
            ]);
        });
    });

    describe("createSettlementClimate", () => {
        test("creates settlement climate with bulk upsert", async () => {
            const client = {
                query: jest.fn().mockResolvedValue({})
            };

            const mockBatch = [
                {
                    settlementId: 1,
                    year: 2021,
                    month: 1,
                    avgTemperature: 10.5,
                    minTemperature: 5.2,
                    maxTemperature: 15.8
                }
            ];

            await createSettlementClimate(mockBatch, client);

            expect(client.query).toHaveBeenCalledWith(
                expect.stringContaining("VALUES ($1, $2, $3, $4, $5, $6)"),
                [1, 2021, 1, 10.5, 5.2, 15.8]
            );
        });

        test("does nothing for an empty batch", async () => {
            const client = { query: jest.fn() };

            const result = await createSettlementClimate([], client);

            expect(result).toBeUndefined();
            expect(client.query).not.toHaveBeenCalled();
        });

        test("throws when batch exceeds the max parameter limit", async () => {
            const client = { query: jest.fn() };
            const oversized = { length: 10923 };

            await expect(createSettlementClimate(oversized, client))
                .rejects.toThrow("createSettlementClimate received 10923 rows, max is 10922. Chunk before calling.");

            expect(client.query).not.toHaveBeenCalled();
        });
    });

    describe("buildSettlementFilters via findSettlements", () => {
        test("searches by geoname_id when query is numeric", async () => {
            db.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: "0" }] });

            await findSettlements({ query: "12345", page: 1, limit: 20 });

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining("s.geoname_id = $"),
                expect.arrayContaining(["12345"])
            );
        });
    });

    describe("findSettlementClimateYears", () => {
        test("returns yearly climate rows filtered by temperature range", async () => {
            db.query.mockResolvedValue({
                rows: [{ settlement_id: 1, year: 2022, avg_temperature: 10 }]
            });

            const result = await findSettlementClimateYears(1, { avg_temperature_from: 5 });

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining("WHERE settlement_id = $1"),
                [1, 5]
            );
            expect(result).toEqual([{ settlement_id: 1, year: 2022, avg_temperature: 10 }]);
        });

        test("returns all years when no filters given", async () => {
            db.query.mockResolvedValue({ rows: [] });

            await findSettlementClimateYears(1);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining("WHERE settlement_id = $1"),
                [1]
            );
        });

        test("sorts by a single known column, descending", async () => {
            db.query.mockResolvedValue({ rows: [] });

            await findSettlementClimateYears(1, { sort: "avg_temperature:desc" });

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining("ORDER BY avg_temperature DESC"),
                [1]
            );
        });

        test("sorts by multiple known columns", async () => {
            db.query.mockResolvedValue({ rows: [] });

            await findSettlementClimateYears(1, { sort: "year:asc,max_temperature:desc" });

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining("ORDER BY year ASC, max_temperature DESC"),
                [1]
            );
        });

        test("rejects unknown sort column without querying the db", async () => {
            await expect(findSettlementClimateYears(1, { sort: "not_a_column:asc" }))
                .rejects.toThrow(ValidationError);

            expect(db.query).not.toHaveBeenCalled();
        });
    });
});
