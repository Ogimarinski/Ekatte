jest.mock("../src/http/utils/response");
jest.mock("../src/validators/validator");
jest.mock("../src/services/climate.service");
jest.mock("../src/http/utils/errorHandler");

const { getSummary, getTimeseries, getTopSettlements, getYearRange } = require("../src/http/controllers/climate.controller");
const { sendHttpResponse } = require("../src/http/utils/response");
const climateService = require("../src/services/climate.service");
const { validateSchema } = require("../src/validators/validator");
const { handleError } = require("../src/http/utils/errorHandler");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("climateController", () => {
    describe("getSummary", () => {
        test("getSummary return result", async () => {
            const mockFilters = {
                country_code: "BG",
                granulatiry: "year",
                temp_type: "max",
                from_year: 1990,
                to_year: 1991
            };

            validateSchema.mockReturnValue(mockFilters);

            climateService.getSummary.mockReturnValue({
                average: 10,
                max: 15,
                min: 3,
                records: 23
            });

            const res = {};

            await getSummary(
                {},
                res,
                {
                    query: {
                        country_code: "BG",
                        granulatiry: "year",
                        temp_type: "max",
                        from_year: "1990",
                        to_year: "1991"
                    }
                }
            );

            expect(validateSchema).toHaveBeenCalledWith(
                "climate",
                "summary",
                {
                    country_code: "BG",
                    granulatiry: "year",
                    temp_type: "max",
                    from_year: "1990",
                    to_year: "1991"
                }
            );

            expect(climateService.getSummary).toHaveBeenCalledWith(mockFilters);

            expect(sendHttpResponse).toHaveBeenCalled();
        });

        test("handles error", async () => {
            const error = new Error("boom");

            validateSchema.mockReturnValue({});

            climateService.getSummary.mockRejectedValue(error);

            const res = {};

            await getSummary({}, res, { query: {} });

            expect(handleError).toHaveBeenCalledWith(res, new Error("boom"));
        });
    });

    describe("getTimeseries", () => {
        test("returns timeseries result", async () => {
            const mockFilters = {
                country_code: "BG",
                from_year: 1990,
                to_year: 1991
            };

            validateSchema.mockReturnValue(mockFilters);

            const timeseries = [
                { year: 1990, average_temperature: "10.2" },
                { year: 1991, average_temperature: "11.1" }
            ];

            climateService.getTimeseries.mockResolvedValue(timeseries);

            const res = {};

            await getTimeseries(
                {},
                res,
                {
                    query: {
                        country_code: "BG",
                        from_year: "1990",
                        to_year: "1991"
                    }
                }
            );

            expect(validateSchema).toHaveBeenCalledWith(
                "climate",
                "timeseries",
                {
                    country_code: "BG",
                    from_year: "1990",
                    to_year: "1991"
                }
            );

            expect(climateService.getTimeseries).toHaveBeenCalledWith(mockFilters);

            expect(sendHttpResponse).toHaveBeenCalled();
        });

        test("handles error", async () => {
            const error = new Error("boom");

            validateSchema.mockReturnValue({});

            climateService.getTimeseries.mockRejectedValue(error);

            const res = {};

            await getTimeseries({}, res, { query: {} });

            expect(handleError).toHaveBeenCalledWith(res, new Error("boom"));
        });
    });

    describe("getTopSettlements", () => {
        test("returns top settlements result", async () => {
            const mockFilters = {
                country_code: "BG",
                limit: 5
            };

            validateSchema.mockReturnValue(mockFilters);

            const topSettlements = [
                { id: 1, name: "Sofia", average_temperature: "12.4" }
            ];

            climateService.getTopSettlements.mockResolvedValue(topSettlements);

            const res = {};

            await getTopSettlements(
                {},
                res,
                {
                    query: {
                        country_code: "BG",
                        limit: "5"
                    }
                }
            );

            expect(validateSchema).toHaveBeenCalledWith(
                "climate",
                "topsettlements",
                {
                    country_code: "BG",
                    limit: "5"
                }
            );

            expect(climateService.getTopSettlements).toHaveBeenCalledWith(mockFilters);

            expect(sendHttpResponse).toHaveBeenCalled();
        });

        test("handles error", async () => {
            const error = new Error("boom");

            validateSchema.mockReturnValue({});

            climateService.getTopSettlements.mockRejectedValue(error);

            const res = {};

            await getTopSettlements({}, res, { query: {} });

            expect(handleError).toHaveBeenCalledWith(res, new Error("boom"));
        });
    });

    describe("getYearRange", () => {
        test("getYearRange returns result", async () => {
            climateService.getYearRange.mockResolvedValue({ min_year: 2005, max_year: 2025 });

            const res = {};

            await getYearRange({}, res);

            expect(climateService.getYearRange).toHaveBeenCalled();
            expect(sendHttpResponse).toHaveBeenCalledWith(
                res,
                200,
                JSON.stringify({ min_year: 2005, max_year: 2025 }),
                "application/json"
            );
        });
    });
});
