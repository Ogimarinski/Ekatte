const mockHandler = jest.fn();
const mockProtectedHandler = jest.fn();

jest.mock("../src/http/routes/region.routes", () => []);
jest.mock("../src/http/routes/municipality.routes", () => []);
jest.mock("../src/http/routes/mayorality.routes", () => []);
jest.mock("../src/http/routes/stats.routes", () => []);

jest.mock("../src/http/routes/settlement.routes", () => [
    {
        method: "GET",
        pattern: {
            exec: jest.fn(({ pathname }) => {
                if (pathname === "/api/settlements") {
                    return {
                        pathname: {
                            groups: {}
                        }
                    };
                }

                return null;
            })
        },
        handler: mockHandler,
        requiresAuth: false
    },
    {
        method: "GET",
        pattern: {
            exec: jest.fn(({ pathname }) => {
                const match = pathname.match(
                    /^\/api\/settlements\/(?<id>\d+)$/
                );

                if (!match) {
                    return null;
                }

                return {
                    pathname: {
                        groups: match.groups
                    }
                };
            })
        },
        handler: mockHandler,
        requiresAuth: false
    },
    {
        method: "POST",
        pattern: {
            exec: jest.fn(({ pathname }) => {
                if (pathname === "/api/settlements") {
                    return {
                        pathname: {
                            groups: {}
                        }
                    };
                }

                return null;
            })
        },
        handler: jest.fn(),
        requiresAuth: false
    },
    {
        method: "GET",
        pattern: {
            exec: jest.fn(({ pathname }) => {
                if (pathname === "/api/settlements/protected") {
                    return {
                        pathname: {
                            groups: {}
                        }
                    };
                }

                return null;
            })
        },
        handler: mockProtectedHandler
        // без requiresAuth -> route-ът е защитен по подразбиране
    }
]);

jest.mock("../src/middleware/auth.middleware", () => ({
    authMiddleware: jest.fn()
}));

jest.mock("../src/http/utils/errorHandler", () => ({
    handleError: jest.fn()
}));

const { handleRequest } = require("../src/http/router");
const { authMiddleware } = require("../src/middleware/auth.middleware");
const { handleError } = require("../src/http/utils/errorHandler");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("handleRequest", () => {
    test("returns false when route is not found", async () => {
        const result = await handleRequest(
            { method: "GET" },
            {},
            {
                pathname: "/does-not-exist",
                searchParams: new Map()
            }
        );

        expect(result).toBe(false);
        expect(mockHandler).not.toHaveBeenCalled();
    });

    test("calls matching handler", async () => {
        const req = { method: "GET" };
        const res = {};

        const parsedUrl = {
            pathname: "/api/settlements",
            searchParams: new Map([
                ["page", "1"]
            ])
        };

        const result = await handleRequest(
            req,
            res,
            parsedUrl
        );

        expect(result).toBe(true);

        expect(mockHandler).toHaveBeenCalledWith(
            req,
            res,
            {
                query: { page: "1" },
                params: {}
            }
        );
    });

    test("passes route params to handler", async () => {
        const req = { method: "GET" };
        const res = {};

        const parsedUrl = {
            pathname: "/api/settlements/15",
            searchParams: new Map()
        };

        await handleRequest(
            req,
            res,
            parsedUrl
        );

        expect(mockHandler).toHaveBeenCalledWith(
            req,
            res,
            {
                query: {},
                params: {
                    id: "15"
                }
            }
        );
    });

    test("skips routes with different method", async () => {
        const req = {
            method: "GET"
        };

        const res = {};

        const parsedUrl = {
            pathname: "/api/settlements",
            searchParams: new Map()
        };

        const result = await handleRequest(req, res, parsedUrl);

        expect(result).toBe(true);

        // GET handler е извикан
        expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    test("skips authMiddleware when route sets requiresAuth: false", async () => {
        const req = { method: "GET" };
        const res = {};

        const parsedUrl = {
            pathname: "/api/settlements",
            searchParams: new Map()
        };

        const result = await handleRequest(req, res, parsedUrl);

        expect(result).toBe(true);
        expect(authMiddleware).not.toHaveBeenCalled();
        expect(mockHandler).toHaveBeenCalled();
    });

    test("calls authMiddleware when route does not set requiresAuth: false", async () => {
        const req = { method: "GET", headers: { authorization: "Bearer token123" } };
        const res = {};

        const parsedUrl = {
            pathname: "/api/settlements/protected",
            searchParams: new Map()
        };

        const result = await handleRequest(req, res, parsedUrl);

        expect(result).toBe(true);
        expect(authMiddleware).toHaveBeenCalledWith(req);
        expect(mockProtectedHandler).toHaveBeenCalled();
    });

    test("returns true and delegates to handleError when authMiddleware throws", async () => {
        const error = new Error("Unauthorized");
        authMiddleware.mockRejectedValueOnce(error);

        const req = { method: "GET" };
        const res = {};

        const parsedUrl = {
            pathname: "/api/settlements/protected",
            searchParams: new Map()
        };

        const result = await handleRequest(req, res, parsedUrl);

        expect(result).toBe(true);
        expect(handleError).toHaveBeenCalledWith(res, error);
        expect(mockProtectedHandler).not.toHaveBeenCalled();
    });

    test("returns true and delegates to handleError when the handler throws", async () => {
        const error = new Error("boom");
        mockHandler.mockRejectedValueOnce(error);

        const req = { method: "GET" };
        const res = {};

        const parsedUrl = {
            pathname: "/api/settlements",
            searchParams: new Map()
        };

        const result = await handleRequest(req, res, parsedUrl);

        expect(result).toBe(true);
        expect(handleError).toHaveBeenCalledWith(res, error);
    });

});
