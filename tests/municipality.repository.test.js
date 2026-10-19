const { Readable } = require("stream");

jest.mock("../db");

const db = require("../db");
const { ValidationError } = require("../src/errors/ValidationError");

const {
    streamMunicipalities,
    findMunicipalities,
    findMunicipalityById,
    createMunicipality,
    updateMunicipality,
    deleteMunicipalities,
    findMaxMunicipalityNumber,
    findMunicipalityOptions
} = require("../src/repositories/municipality.repository");

describe("municipality.repository", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("findMunicipalities", () => {
        test("returns paginated municipalities", async () => {
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

            const result = await findMunicipalities({});

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

            await findMunicipalities({
                query: "Varna"
            });

            expect(db.query.mock.calls[0][1]).toEqual([
                "%Varna%",
                20,
                0
            ]);
        });

        test("passes filters to db query", async () => {
            db.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: "0" }] });

            await findMunicipalities({
                id: 1,
                region_id: 2,
                updated_at_from: "2025-01-01",
                updated_at_to: "2025-01-10"
            });

            expect(db.query.mock.calls[0][1]).toEqual(
                expect.arrayContaining([
                    1,
                    2,
                    "2025-01-01",
                    "2025-01-10"
                ])
            );
        });

        test("passes sort to db query", async () => {
            db.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: "0" }] });

            await findMunicipalities({
                sort: "name:desc"
            });

            expect(db.query.mock.calls[0][0]).toContain(
                "ORDER BY m.name DESC"
            );
        });

        test("rejects invalid sort field without querying the db", async () => {
            await expect(findMunicipalities({
                sort: "invalid:desc"
            })).rejects.toThrow(ValidationError);

            expect(db.query).not.toHaveBeenCalled();
        });

        test("uses ascending order", async () => {
            db.query
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: "0" }] });

            await findMunicipalities({
                sort: "name:asc"
            });

            expect(db.query.mock.calls[0][0]).toContain(
                "ORDER BY m.name ASC"
            );
        });
    });

    describe("streamMunicipalities", () => {
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

            const result = await streamMunicipalities({});

            expect(result).toBe(stream);

            finish(stream);
            await new Promise((resolve) => stream.on("close", resolve));

            expect(release).toHaveBeenCalledTimes(1);
        });
    });

    describe("findMunicipalityById", () => {
        test("returns municipality by id", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        code: "VAR01",
                        name: "Varna",
                        region_name: "Varna",
                        region_id: 3,
                        updated_at: "2025-01-01"
                    }
                ]
            });

            const result = await findMunicipalityById(1);

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(result.code).toBe("VAR01");
            expect(result.name).toBe("Varna");
        });
    });

    describe("createMunicipality", () => {
        test("creates municipality", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        code: "VAR01",
                        name: "Varna"
                    }
                ]
            });

            const result = await createMunicipality({
                name: "Varna",
                code: "VAR01",
                region_id: 3
            });

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(result.id).toBe(1);
            expect(result.code).toBe("VAR01");
        });
    });

    describe("updateMunicipality", () => {
        test("updates municipality", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        code: "VAR01",
                        name: "Updated"
                    }
                ]
            });

            const result = await updateMunicipality(1, {
                name: "Updated",
                code: "VAR01"
            });

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(result.name).toBe("Updated");
            expect(result.code).toBe("VAR01");
        });

        test("updates municipality only with name", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        name: "New Name",
                        code: "SOF01"
                    }
                ]
            });

            const result = await updateMunicipality(1, {
                name: "New Name"
            });

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(db.query.mock.calls[0][1]).toContain("New Name");
            expect(result.name).toBe("New Name");
        });

        test("updates municipality only with code", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        name: "Sofia",
                        code: "NEW01"
                    }
                ]
            });

            const result = await updateMunicipality(1, {
                code: "NEW01"
            });

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(db.query.mock.calls[0][1]).toContain("NEW01");
            expect(result.code).toBe("NEW01");
        });
    });

    describe("deleteMunicipalities", () => {
        test("deletes municipalities", async () => {
            db.query.mockResolvedValue({
                rows: [
                    { id: 1 },
                    { id: 2 }
                ]
            });

            const result = await deleteMunicipalities([1, 2]);

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(result).toEqual([
                { id: 1 },
                { id: 2 }
            ]);
        });
    });

    describe("findMaxMunicipalityNumber", () => {
        test("returns max municipality number", async () => {
            db.query.mockResolvedValue({
                rows: [
                    {
                        max: 54
                    }
                ]
            });

            const result = await findMaxMunicipalityNumber(3);

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(result).toBe(54);
        });
    });

    describe("findMunicipalityOptions", () => {
        test("returns municipality options filtered by region", async () => {
            db.query.mockResolvedValue({
                rows: [
                    { id: 1, name: "София" },
                    { id: 2, name: "Банкя" }
                ]
            });

            const result = await findMunicipalityOptions({
                region_id: 5
            });

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(db.query.mock.calls[0][0]).toContain(
                "WHERE m.region_id = $1"
            );

            expect(db.query.mock.calls[0][1]).toEqual([5]);

            expect(result).toEqual([
                { id: 1, name: "София" },
                { id: 2, name: "Банкя" }
            ]);
        });
        test("returns all municipality options when region filter is missing", async () => {
            db.query.mockResolvedValue({
                rows: [
                    { id: 1, name: "София" }
                ]
            });

            const result = await findMunicipalityOptions({});

            expect(db.query).toHaveBeenCalledTimes(1);

            expect(db.query.mock.calls[0][0]).not.toContain("WHERE");

            expect(db.query.mock.calls[0][1]).toEqual([]);

            expect(result).toEqual([
                { id: 1, name: "София" }
            ]);
        });

    });
});