const { Readable } = require("stream");
jest.mock("../db");

const db = require("../db");
const { ValidationError } = require("../src/errors/ValidationError");

const {
    streamRegions,
    findRegions,
    findRegionById,
    createRegion,
    updateRegion,
    deleteRegions,
    findRegionOptions
} = require("../src/repositories/region.repository");

describe("region.repository", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("findRegions", () => {
        test("returns paginated regions", async () => {
            db.query
                .mockResolvedValueOnce({
                    rows: [
                        {
                            id: 1,
                            name: "Varna"
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

            const result = await findRegions({});

            expect(db.query).toHaveBeenCalledTimes(2);

            expect(result).toEqual({
                results: [
                    {
                        id: 1,
                        name: "Varna"
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

            await findRegions({
                query: "Varna"
            });

            expect(db.query.mock.calls[0][1]).toEqual([
                "%Varna%",
                20,
                0
            ]);
        });

        test("escapes LIKE wildcards in search query", async () => {
            db.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: "0" }] });

            await findRegions({
                query: "50%_"
            });

            expect(db.query.mock.calls[0][1][0]).toBe("%50\\%\\_%");
        });

        test("passes filters to db query", async () => {
            db.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: "0" }] });

            await findRegions({
                id: 1,
                updated_at_from: "2025-01-01",
                updated_at_to: "2025-01-10"
            });

            expect(db.query.mock.calls[0][1]).toEqual(
                expect.arrayContaining([
                    1,
                    "2025-01-01",
                    "2025-01-10"
                ])
            );
        });

        test("passes sort to db query", async () => {
            db.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: "0" }] });

            await findRegions({
                sort: "name:desc"
            });

            expect(db.query.mock.calls[0][0]).toContain(
                "ORDER BY r.name DESC"
            );
        });

        test("rejects invalid sort field without querying the db", async () => {
            await expect(findRegions({
                sort: "invalid:desc"
            })).rejects.toThrow(ValidationError);

            expect(db.query).not.toHaveBeenCalled();
        });

        test("uses ascending order", async () => {
            db.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: "0" }] });

            await findRegions({
                sort: "name:asc"
            });

            expect(db.query.mock.calls[0][0]).toContain(
                "ORDER BY r.name ASC"
            );
        });
    });

    describe("streamRegions", () => {
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

            const result = await streamRegions({});

            expect(result).toBe(stream);

            finish(stream);
            await new Promise((resolve) => stream.on("close", resolve));

            expect(release).toHaveBeenCalledTimes(1);
        });
    });

    describe("findRegionById", () => {
        test("returns region by id", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        code: "VAR",
                        name: "Varna",
                        updated_at: "2025-01-01"
                    }
                ]
            });

            const result = await findRegionById(1);

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(result.code).toBe("VAR");
            expect(result.name).toBe("Varna");
        });
    });

    describe("createRegion", () => {
        test("creates region", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        code: "VAR",
                        name: "Varna"
                    }
                ]
            });

            const result = await createRegion({
                name: "Varna",
                code: "VAR"
            });

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(result.id).toBe(1);
            expect(result.code).toBe("VAR");
        });
    });

    describe("updateRegion", () => {
        test("updates region", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        code: "VAR",
                        name: "Updated"
                    }
                ]
            });

            const result = await updateRegion(1, {
                name: "Updated",
                code: "VAR"
            });

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(result.name).toBe("Updated");
            expect(result.code).toBe("VAR");
        });

        test("updates region only with name", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        code: "SOF",
                        name: "New Region"
                    }
                ]
            });

            const result = await updateRegion(1, {
                name: "New Region"
            });

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(db.query.mock.calls[0][1]).toContain("New Region");
            expect(result.name).toBe("New Region");
        });

        test("updates region only with code", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        code: "NEW",
                        name: "Sofia"
                    }
                ]
            });

            const result = await updateRegion(1, {
                code: "NEW"
            });

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(db.query.mock.calls[0][1]).toContain("NEW");
            expect(result.code).toBe("NEW");
        });
    });

    describe("deleteRegions", () => {
        test("deletes regions", async () => {
            db.query.mockResolvedValue({
                rows: [
                    { id: 1 },
                    { id: 2 }
                ]
            });

            const result = await deleteRegions([1, 2]);

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(result).toEqual([
                { id: 1 },
                { id: 2 }
            ]);
        });
    });

    describe("findRegionOptions", () => {
        test("returns region options", async () => {
            db.query.mockResolvedValue({
                rows: [
                    { id: 1, name: "София" },
                    { id: 2, name: "Пловдив" }
                ]
            });

            const result = await findRegionOptions();

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(db.query.mock.calls[0][0]).toContain(
                "FROM regions r"
            );

            expect(result).toEqual([
                { id: 1, name: "София" },
                { id: 2, name: "Пловдив" }
            ]);
        });
    });
});
