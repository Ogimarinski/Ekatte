const { Readable } = require("stream");

jest.mock("../db");

const db = require("../db");
const { ValidationError } = require("../src/errors/ValidationError");

const {
    streamMayoralities,
    findMayoralities,
    findMayoralityById,
    createMayorality,
    updateMayorality,
    deleteMayoralties,
    findMaxMayoralityNumber,
    findMayoralityOptions
} = require("../src/repositories/mayorality.repository");

describe("mayorality.repository", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("findMayoralities", () => {
        test("returns paginated mayoralities", async () => {
            db.query
                .mockResolvedValueOnce({
                    rows: [
                        {
                            id: 1,
                            name: "Mayorality"
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

            const result = await findMayoralities({});

            expect(db.query).toHaveBeenCalledTimes(2);

            expect(result).toEqual({
                results: [
                    {
                        id: 1,
                        name: "Mayorality"
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

            await findMayoralities({
                query: "Test"
            });

            expect(db.query.mock.calls[0][1]).toEqual([
                "%Test%",
                20,
                0
            ]);
        });

        test("passes filters to db query", async () => {
            db.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: "0" }] });

            await findMayoralities({
                id: 1,
                municipality_id: 1,
                updated_at_from: "2025-01-01",
                updated_at_to: "2025-01-10"
            });

            expect(db.query.mock.calls[0][1]).toEqual(
                expect.arrayContaining([
                    1,
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

            await findMayoralities({
                sort: "name:desc"
            });

            expect(db.query.mock.calls[0][0]).toContain(
                "ORDER BY ma.name DESC"
            );
        });

        test("rejects invalid sort field without querying the db", async () => {
            await expect(findMayoralities({
                sort: "invalid:desc"
            })).rejects.toThrow(ValidationError);

            expect(db.query).not.toHaveBeenCalled();
        });

        test("uses ascending order", async () => {
            db.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: "0" }] });

            await findMayoralities({
                sort: "name:asc"
            });

            expect(db.query.mock.calls[0][0]).toContain(
                "ORDER BY ma.name ASC"
            );
        });
    });

    describe("streamMayoralities", () => {
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

            const result = await streamMayoralities({});

            expect(result).toBe(stream);

            finish(stream);
            await new Promise((resolve) => stream.on("close", resolve));

            expect(release).toHaveBeenCalledTimes(1);
        });
    });

    describe("findMayoralityById", () => {
        test("returns mayorality by id", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        code: "SOF01-01",
                        name: "Sofia",
                        municipality_id: 1,
                        region_id: 2
                    }
                ]
            });

            const result = await findMayoralityById(1);

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(result).toEqual({
                code: "SOF01-01",
                name: "Sofia",
                municipality_id: 1,
                region_id: 2
            });
        });
    });

    describe("createMayorality", () => {
        test("creates mayorality", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        code: "SOF01-01",
                        name: "Sofia"
                    }
                ]
            });

            const result = await createMayorality({
                name: "Sofia",
                code: "SOF01-01",
                municipality_id: 1
            });

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(result.id).toBe(1);
            expect(result.name).toBe("Sofia");
        });
    });

    describe("updateMayorality", () => {
        test("updates mayorality", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        code: "SOF01-01",
                        name: "Sovia"
                    }
                ]
            });

            const result = await updateMayorality(1, {
                name: "Sovia",
                code: "SOF01-01"
            });

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(result.name).toBe("Sovia");
            expect(result.code).toBe("SOF01-01");
        });

        test("updates mayorality only with name", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        code: "SOF01-01",
                        name: "New Name"
                    }
                ]
            });

            const result = await updateMayorality(1, {
                name: "New Name"
            });

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(db.query.mock.calls[0][1]).toContain("New Name");
            expect(result.name).toBe("New Name");
        });

        test("updates mayorality only with code", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        code: "SFO01-01",
                        name: "New Name"
                    }
                ]
            });

            const result = await updateMayorality(1, {
                code: "SFO01-01"
            });

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(db.query.mock.calls[0][1]).toContain("SFO01-01");
            expect(result.code).toBe("SFO01-01");
        });
    });

    describe("deleteMayoralties", () => {
        test("deletes mayoralities", async () => {
            db.query.mockResolvedValue({
                rows: [
                    { id: 1 },
                    { id: 2 }
                ]
            });

            const result = await deleteMayoralties([1, 2]);

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(result).toEqual([
                { id: 1 },
                { id: 2 }
            ]);
        });
    });

    describe("findMaxMayoralityNumber", () => {
        test("returns max mayorality number", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        max: 99
                    }
                ]
            });

            const result = await findMaxMayoralityNumber(1);

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(result).toBe(99);
        });
    });

    describe("findMayoralityOptions", () => {
        test("returns mayorality options filtered by municipality", async () => {
            db.query.mockResolvedValue({
                rows: [
                    { id: 1, name: "Кметство 1" },
                    { id: 2, name: "Кметство 2" }
                ]
            });

            const result = await findMayoralityOptions({
                municipality_id: 5
            });

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(db.query.mock.calls[0][0]).toContain(
                "WHERE m.municipality_id = $1"
            );

            expect(db.query.mock.calls[0][1]).toEqual([5]);

            expect(result).toEqual([
                { id: 1, name: "Кметство 1" },
                { id: 2, name: "Кметство 2" }
            ]);
        });

        test("returns all mayorality options when municipality filter is missing", async () => {
            db.query.mockResolvedValue({
                rows: [
                    { id: 1, name: "Кметство 1" }
                ]
            });

            const result = await findMayoralityOptions({});

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(db.query.mock.calls[0][0]).not.toContain("WHERE");

            expect(db.query.mock.calls[0][1]).toEqual([]);

            expect(result).toEqual([
                { id: 1, name: "Кметство 1" }
            ]);
        });
    });
});

