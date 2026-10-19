jest.mock("../src/repositories/country.repository");

const countryRepository = require("../src/repositories/country.repository");
const { getCountries } = require("../src/services/country.service");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("getCountries", () => {
    test("delegates to repository", async () => {
        const countries = [{ code: "BG", name: "Bulgaria" }];

        countryRepository.findAll.mockResolvedValue(countries);

        const result = await getCountries();

        expect(countryRepository.findAll).toHaveBeenCalled();
        expect(result).toBe(countries);
    });
});
