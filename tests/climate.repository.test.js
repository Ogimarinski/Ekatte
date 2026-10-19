jest.mock("../db");

const db = require("../db");
const {
    findSummary,
    findTimeseries,
    findTopSettlements,
    findYearRange
} = require("../src/repositories/climate.repository");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("climate.repository", () => {
    describe("findYearRange", () => {
        test("returns min/max year", async () => {
            db.query.mockResolvedValue({ rows: [{ min_year: 2005, max_year: 2025 }] });

            const result = await findYearRange();

            expect(result).toEqual({ min_year: 2005, max_year: 2025 });
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining("MIN(year)"));
        });
    });

    describe("findSummary", () => {
        test("builds yearly WHERE clause and queries rollup table", async () => {
            db.query.mockResolvedValue({ rows: [{ average: 10, max: 20, min: 0, records: 5 }] });

            const result = await findSummary({
                country_code: "BG",
                granularity: "year",
                temp_type: "max",
                from_year: 2020,
                to_year: 2021
            });

            expect(result).toEqual({ average: 10, max: 20, min: 0, records: 5 });
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining("year BETWEEN $2 AND $3"),
                ["BG", 2020, 2021]
            );
        });

        test("builds monthly WHERE clause when granularity is month", async () => {
            db.query.mockResolvedValue({ rows: [{}] });

            await findSummary({
                country_code: "BG",
                granularity: "month",
                temp_type: "avg",
                from_year: 2020,
                from_month: 3,
                to_year: 2020,
                to_month: 6
            });

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining("(year, month) BETWEEN"),
                ["BG", 2020, 3, 2020, 6]
            );
        });
    });

    describe("findTimeseries", () => {
        test("groups by year when granularity is year", async () => {
            db.query.mockResolvedValue({ rows: [{ year: 2020, value: 15 }] });

            const result = await findTimeseries({
                country_code: "BG",
                granularity: "year",
                temp_type: "max",
                from_year: 2020,
                to_year: 2020
            });

            expect(result).toEqual([{ year: 2020, value: 15 }]);
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining("GROUP BY year"), expect.any(Array));
        });

        test("returns per-month rows when granularity is month", async () => {
            db.query.mockResolvedValue({ rows: [{ year: 2020, month: 3, value: 12 }] });

            const result = await findTimeseries({
                country_code: "BG",
                granularity: "month",
                temp_type: "min",
                from_year: 2020,
                from_month: 1,
                to_year: 2020,
                to_month: 12
            });

            expect(result).toEqual([{ year: 2020, month: 3, value: 12 }]);
        });
    });

    describe("findTopSettlements", () => {
        test("full-year period uses yearly segment only", async () => {
            db.query.mockResolvedValue({ rows: [{ settlement_id: 1, name: "Sofia", value: 30 }] });

            const result = await findTopSettlements({
                country_code: "BG",
                temp_type: "max",
                from_year: 2020,
                from_month: 1,
                to_year: 2021,
                to_month: 12,
                limit: 10
            });

            expect(result).toEqual([{ settlement_id: 1, name: "Sofia", value: 30 }]);
            const [sql, params] = db.query.mock.calls[0];
            expect(sql).toContain("settlement_climate_yearly");
            expect(sql).toContain("year BETWEEN $2 AND $3");
            expect(params).toEqual(["BG", 2020, 2021, 10]);
        });

        test("partial-year period mixes monthly and yearly segments", async () => {
            db.query.mockResolvedValue({ rows: [] });

            await findTopSettlements({
                country_code: "BG",
                temp_type: "avg",
                from_year: 2020,
                from_month: 6,
                to_year: 2022,
                to_month: 3,
                limit: 5
            });

            const [sql] = db.query.mock.calls[0];
            expect(sql).toContain("settlement_climate sc");
            expect(sql).toContain("settlement_climate_yearly");
        });

        test("full-year period with min/max does not shift range back a year", async () => {
            // Регресионен тест: fullYears блокът за min/max трябва да ползва
            // (fullYears.from, fullYears.to) директно, не (from - 1, to) -
            // последното е грешка, наследена от avg/cumulative клона.
            db.query.mockResolvedValue({ rows: [] });

            await findTopSettlements({
                country_code: "BG",
                temp_type: "min",
                from_year: 2020,
                from_month: 1,
                to_year: 2021,
                to_month: 12,
                limit: 10
            });

            const [sql, params] = db.query.mock.calls[0];
            expect(sql).toContain("year BETWEEN $2 AND $3");
            expect(params).toEqual(["BG", 2020, 2021, 10]);
        });

        test("single-year partial period produces one monthly segment, no yearly", async () => {
            db.query.mockResolvedValue({ rows: [] });

            await findTopSettlements({
                country_code: "BG",
                temp_type: "min",
                from_year: 2020,
                from_month: 3,
                to_year: 2020,
                to_month: 8,
                limit: 5
            });

            const [sql] = db.query.mock.calls[0];
            expect(sql).toContain("sc.month BETWEEN $3 AND $4");
            expect(sql).not.toContain("settlement_climate_yearly");
        });
    });
});