jest.mock("../src/repositories/climate.repository");

const climateRepository = require("../src/repositories/climate.repository");
const climateService = require("../src/services/climate.service");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("climate.service", () => {
    test("getSummary delegates to repository", async () => {
        climateRepository.findSummary.mockResolvedValue({ average: 10 });

        const result = await climateService.getSummary({ country_code: "BG" });

        expect(climateRepository.findSummary).toHaveBeenCalledWith({ country_code: "BG" });
        expect(result).toEqual({ average: 10 });
    });

    test("getTimeseries delegates to repository", async () => {
        climateRepository.findTimeseries.mockResolvedValue([{ year: 2020, value: 5 }]);

        const result = await climateService.getTimeseries({ country_code: "BG" });

        expect(climateRepository.findTimeseries).toHaveBeenCalledWith({ country_code: "BG" });
        expect(result).toEqual([{ year: 2020, value: 5 }]);
    });

    test("getTopSettlements delegates to repository", async () => {
        climateRepository.findTopSettlements.mockResolvedValue([{ name: "Sofia" }]);

        const result = await climateService.getTopSettlements({ limit: 10 });

        expect(climateRepository.findTopSettlements).toHaveBeenCalledWith({ limit: 10 });
        expect(result).toEqual([{ name: "Sofia" }]);
    });

    test("getYearRange delegates to repository", async () => {
        climateRepository.findYearRange.mockResolvedValue({ min_year: 2005, max_year: 2025 });

        const result = await climateService.getYearRange();

        expect(climateRepository.findYearRange).toHaveBeenCalled();
        expect(result).toEqual({ min_year: 2005, max_year: 2025 });
    });
});