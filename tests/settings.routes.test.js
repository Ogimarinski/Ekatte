jest.mock("../src/http/controllers/settings.controller");
const settingsController = require("../src/http/controllers/settings.controller");
const routes = require("../src/http/routes/settings.routes");

test("get settings route handler delegates to controller", () => {
    const req = {}, res = {};
    routes[0].handler(req, res);

    expect(settingsController.getSettings).toHaveBeenCalledWith(req, res);
});

test("update settings route handler delegates to controller", () => {
    const req = {}, res = {};
    routes[1].handler(req, res);

    expect(settingsController.updateSettings).toHaveBeenCalledWith(req, res);
});

test("both routes require auth", () => {
    expect(routes[0].requiresAuth).toBe(true);
    expect(routes[1].requiresAuth).toBe(true);
});
