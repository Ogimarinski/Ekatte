jest.mock("../src/http/controllers/country.controller");
const countryController = require("../src/http/controllers/country.controller");
const routes = require("../src/http/routes/country.routes");

test("countries route delegates to controller", () => {
    const req = {}, res = {};
    routes[0].handler(req, res);

    expect(countryController.getCountries).toHaveBeenCalledWith(req, res);
});
