jest.mock("../src/http/controllers/climate.controller");
const climateController = require("../src/http/controllers/climate.controller");
const routes = require("../src/http/routes/climate.routes");

test("summary route delegates to controller", () => {
    const req = {}, res = {}, query = {};
    routes[0].handler(req, res, { query });

    expect(climateController.getSummary).toHaveBeenCalledWith(req, res, { query });
});

test("timeseries route delegates to controller", () => {
    const req = {}, res = {}, query = {};
    routes[1].handler(req, res, { query });

    expect(climateController.getTimeseries).toHaveBeenCalledWith(req, res, { query });
});

test("top-settlements route delegates to controller", () => {
    const req = {}, res = {}, query = {};
    routes[2].handler(req, res, { query });

    expect(climateController.getTopSettlements).toHaveBeenCalledWith(req, res, { query });
});

test("year-range route delegates to controller", () => {
    const req = {}, res = {};
    routes[3].handler(req, res, { query: {} });

    expect(climateController.getYearRange).toHaveBeenCalledWith(req, res, { query: {} });
});