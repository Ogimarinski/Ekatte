jest.mock("../src/services/country.service", () => ({
    getCountries: jest.fn()
}));

jest.mock("../src/http/utils/response", () => ({
    sendHttpResponse: jest.fn()
}));

jest.mock("../src/http/utils/errorHandler", () => ({
    handleError: jest.fn()
}));

const { getCountries } = require("../src/http/controllers/country.controller");
const { handleError } = require("../src/http/utils/errorHandler");
const { sendHttpResponse } = require("../src/http/utils/response");
const countryService = require("../src/services/country.service");

describe("countryCountroller", () => {
    test("getCountries returns 200 with countries", async () => {
        countryService.getCountries.mockResolvedValue(
            [
                { code: "BG", name: "Bulgaria" },
                { code: "CN", name: "China" }
            ]
        );

        const res = {};

        await getCountries({}, res);

        expect(sendHttpResponse).toHaveBeenCalled();
    });

    test("getCountries handles errors", async () => {
        countryService.getCountries.mockRejectedValue(new Error("error"));

        const res = {};

        await getCountries({}, res);

        expect(handleError).toHaveBeenCalledWith(res, new Error("error"));
    });
});