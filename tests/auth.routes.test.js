jest.mock("../src/http/controllers/auth.controller");

const authController = require("../src/http/controllers/auth.controller");
const authRoutes = require("../src/http/routes/auth.routes");

function findRoute(method, pathname) {
    return authRoutes.find(
        route => route.method === method && route.pattern.exec({ pathname })
    );
}

describe("auth.routes", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("exposes exactly the four expected auth routes", () => {
        expect(authRoutes).toHaveLength(4);
    });

    describe("POST /api/auth/register", () => {
        test("matches the pattern, is public, and forwards to authController.register", () => {
            const route = findRoute("POST", "/api/auth/register");

            expect(route).toBeDefined();
            expect(route.requiresAuth).toBe(false);

            const req = {};
            const res = {};

            route.handler(req, res);

            expect(authController.register).toHaveBeenCalledWith(req, res);
        });
    });

    describe("GET /api/auth/verify", () => {
        test("matches the pattern, is public, and forwards the query to authController.verify", () => {
            const route = findRoute("GET", "/api/auth/verify");

            expect(route).toBeDefined();
            expect(route.requiresAuth).toBe(false);

            const req = {};
            const res = {};
            const urlData = { query: { token: "abc" } };

            route.handler(req, res, urlData);

            expect(authController.verify).toHaveBeenCalledWith(req, res, urlData);
        });
    });

    describe("POST /api/auth/resend", () => {
        test("matches the pattern, is public, and forwards to authController.resendVerification", () => {
            const route = findRoute("POST", "/api/auth/resend");

            expect(route).toBeDefined();
            expect(route.requiresAuth).toBe(false);

            const req = {};
            const res = {};

            route.handler(req, res);

            expect(authController.resendVerification).toHaveBeenCalledWith(req, res);
        });
    });

    describe("POST /api/auth/login", () => {
        test("matches the pattern, is public, and forwards to authController.login", () => {
            const route = findRoute("POST", "/api/auth/login");

            expect(route).toBeDefined();
            expect(route.requiresAuth).toBe(false);

            const req = {};
            const res = {};

            route.handler(req, res);

            expect(authController.login).toHaveBeenCalledWith(req, res);
        });
    });

    test("no unrelated method/path combination matches an auth route", () => {
        expect(findRoute("GET", "/api/auth/register")).toBeUndefined();
        expect(findRoute("DELETE", "/api/auth/login")).toBeUndefined();
        expect(findRoute("POST", "/api/auth/unknown")).toBeUndefined();
    });
});
