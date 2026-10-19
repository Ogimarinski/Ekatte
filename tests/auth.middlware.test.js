jest.mock("../src/utils/token.utils.js");

const { verifyAccessToken } = require("../src/utils/token.utils.js");
const { UnauthorizedError } = require("../src/errors/UnauthorizedError");
const { authMiddleware } = require("../src/middleware/auth.middleware");

describe("authMiddleware", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("throws when the Authorization header is missing", async () => {
        const req = { headers: {} };

        await expect(authMiddleware(req)).rejects.toThrow(UnauthorizedError);
        await expect(authMiddleware(req)).rejects.toThrow("Authorization header is required");
    });

    test("throws when the Authorization header does not start with 'Bearer '", async () => {
        const req = { headers: { authorization: "Basic abc123" } };

        await expect(authMiddleware(req)).rejects.toThrow("Invalid Authorization header");
    });

    test("throws with 401 statusCode when the token is invalid or expired", async () => {
        verifyAccessToken.mockImplementation(() => {
            throw new Error("jwt expired");
        });

        const req = { headers: { authorization: "Bearer badtoken" } };

        await expect(authMiddleware(req)).rejects.toMatchObject({
            message: "Invalid or expired access token",
            statusCode: 401
        });
    });

    test("attaches the decoded payload to req.user on a valid token", async () => {
        verifyAccessToken.mockReturnValue({ id: 1, email: "test@gmail.com" });

        const req = { headers: { authorization: "Bearer validtoken" } };

        await authMiddleware(req);

        expect(verifyAccessToken).toHaveBeenCalledWith("validtoken");
        expect(req.user).toEqual({ id: 1, email: "test@gmail.com" });
    });
});