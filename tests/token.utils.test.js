const jwt = require("jsonwebtoken");
const { generateAccessToken, verifyAccessToken, generateVerificationToken } = require("../src/utils/token.utils");

describe("generateVerificationToken", () => {
    test("produces a 64-character hex string", () => {
        const token = generateVerificationToken();

        expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    test("produces different tokens on each call", () => {
        const a = generateVerificationToken();
        const b = generateVerificationToken();

        expect(a).not.toBe(b);
    });
});

describe("generateAccessToken", () => {
    beforeEach(() => {
        process.env.JWT_SECRET = "test-secret";
        process.env.JWT_EXPIRES_IN = "1h";
    });

    test("produces a real, valid JWT with the correct structure", () => {
        const user = {
            id: 1,
            email: "test@example.com",
            password_hash: "$2b$12$secretHash"
        };

        const token = generateAccessToken(user);

        expect(token.split(".")).toHaveLength(3);

        const decoded = jwt.verify(token, "test-secret");

        expect(decoded.id).toBe(1);
        expect(decoded.email).toBe("test@example.com");
        expect(decoded).not.toHaveProperty("password_hash");

        expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    test("round-trips correctly through verifyAccessToken", () => {
        const token = generateAccessToken({ id: 5, email: "a@b.com" });

        const payload = verifyAccessToken(token);

        expect(payload.id).toBe(5);
        expect(payload.email).toBe("a@b.com");
    });
});