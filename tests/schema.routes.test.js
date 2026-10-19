jest.mock("../src/http/controllers/schema.controller");
const schemaController = require("../src/http/controllers/schema.controller");
const routes = require("../src/http/routes/schema.routes");

test("create route handler delegates to controller", () => {
    const req = {}, res = {};
    routes[0].handler(req, res, { params: { resource: "regions" } });

    expect(schemaController.getCreateSchema).toHaveBeenCalledWith(req, res, { params: { resource: "regions" } });
});

test("update route handler delegates to controller", () => {
    const req = {}, res = {};
    routes[1].handler(req, res, { params: { resource: "regions" } });

    expect(schemaController.getUpdateSchema).toHaveBeenCalledWith(req, res, { params: { resource: "regions" } });
});