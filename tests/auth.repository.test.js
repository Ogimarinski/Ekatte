jest.mock("../db");

const db = require('../db');
const {
    createUser,
    findUserByEmail,
    markUserAsVerified,
    createVerificationToken,
    findVerificationToken,
    findVerificationTokenByUserId,
    deleteVerificationToken,
    getSetting,
    incrementFailedAttempts,
    resetFailedAttempts,
    setBlockedUntil,
    createUserWithVerificationToken,
    verifyUserWithToken
} = require('../src/repositories/auth.repository');

describe("auth.repository", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("createUser", async () => {
        db.query.mockResolvedValue({
            rows: [{ id: 1, email: "test@gmail.com", password_hash: "hashPassword" }]
        });

        const user = await createUser("test@gmail.com", "hashPassword");

        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO users"),
            ["test@gmail.com", "hashPassword"]
        );

        expect(user).toEqual({ id: 1, email: "test@gmail.com", password_hash: "hashPassword" });
    });

    test("findUserByEmail", async () => {
        db.query.mockResolvedValue({
            rows: [{ id: 1, email: "test@gmail.com" }]
        });

        const user = await findUserByEmail("test@gmail.com");

        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining("SELECT *"),
            ["test@gmail.com"]
        );

        expect(user).toEqual({ id: 1, email: "test@gmail.com" });
    });

    test("findUserByEmail returns undefined when no user matches", async () => {
        db.query.mockResolvedValue({ rows: [] });

        const user = await findUserByEmail("missing@gmail.com");

        expect(user).toBeUndefined();
    });

    test("markUserAsVerified", async () => {
        db.query.mockResolvedValue({
            rows: [{ id: 1, is_verified: true }]
        });

        const user = await markUserAsVerified(1);

        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining("SET is_verified = true"),
            [1]
        );

        expect(user).toEqual({ id: 1, is_verified: true });
    });

    test("createVerificationToken", async () => {
        db.query.mockResolvedValue({
            rows: [{ user_id: 1, token: "tok", expires_at: "2026-01-01" }]
        });

        const result = await createVerificationToken(1, "tok", "2026-01-01");

        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO verification_tokens"),
            [1, "tok", "2026-01-01"]
        );

        expect(result).toEqual({ user_id: 1, token: "tok", expires_at: "2026-01-01" });
    });

    test("findVerificationToken", async () => {
        db.query.mockResolvedValue({
            rows: [{ user_id: 1, email: "test@gmail.com", is_verified: false, token: "tok" }]
        });

        const result = await findVerificationToken("tok");

        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining("FROM verification_tokens"),
            ["tok"]
        );

        expect(result.token).toBe("tok");
    });

    test("findVerificationTokenByUserId", async () => {
        db.query.mockResolvedValue({
            rows: [{ token: "tok", expires_at: "2026-01-01", created_at: "2025-12-01" }]
        });

        const result = await findVerificationTokenByUserId(1);

        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining("WHERE vt.user_id = $1"),
            [1]
        );

        expect(result.token).toBe("tok");
    });

    test("deleteVerificationToken", async () => {
        db.query.mockResolvedValue({});

        await deleteVerificationToken("tok");

        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining("DELETE"),
            ["tok"]
        );
    });

    test("getSetting", async () => {
        db.query.mockResolvedValue({
            rows: [{ value: "5" }]
        });

        const value = await getSetting("max_failed_attempts");

        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining("FROM settings"),
            ["max_failed_attempts"]
        );

        expect(value).toBe("5");
    });

    test("getSetting returns undefined when the key does not exist", async () => {
        db.query.mockResolvedValue({ rows: [] });

        const value = await getSetting("missing_key");

        expect(value).toBeUndefined();
    });

    test("incrementFailedAttempts", async () => {
        db.query.mockResolvedValue({
            rows: [{ failed_attempts: 3 }]
        });

        const result = await incrementFailedAttempts(1);

        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining("failed_attempts = failed_attempts + 1"),
            [1]
        );

        expect(result).toEqual({ failed_attempts: 3 });
    });

    test("resetFailedAttempts", async () => {
        db.query.mockResolvedValue({});

        await resetFailedAttempts(1);

        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining("failed_attempts = 0"),
            [1]
        );
    });

    test("setBlockedUntil", async () => {
        db.query.mockResolvedValue({});

        await setBlockedUntil(1, "2026-01-01T00:00:00Z");

        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining("blocked_until = $1"),
            ["2026-01-01T00:00:00Z", 1]
        );
    });

    describe("createUserWithVerificationToken", () => {
        test("commits and returns the created user", async () => {
            const client = {
                query: jest.fn().mockResolvedValue({
                    rows: [{ id: 1, email: "test@gmail.com" }]
                }),
                release: jest.fn()
            };

            db.connect.mockResolvedValue(client);

            const user = await createUserWithVerificationToken(
                "test@gmail.com",
                "hashPassword",
                "tok",
                "2026-01-01"
            );

            expect(client.query.mock.calls[0][0]).toBe("BEGIN");
            expect(client.query).toHaveBeenCalledWith("COMMIT");
            expect(client.release).toHaveBeenCalledTimes(1);
            expect(user).toEqual({ id: 1, email: "test@gmail.com" });
        });

        test("rolls back and rethrows on failure", async () => {
            const error = new Error("insert failed");

            const client = {
                query: jest.fn()
                    .mockResolvedValueOnce() // BEGIN
                    .mockRejectedValueOnce(error), // createUser's INSERT
                release: jest.fn()
            };

            db.connect.mockResolvedValue(client);

            await expect(
                createUserWithVerificationToken("test@gmail.com", "hashPassword", "tok", "2026-01-01")
            ).rejects.toThrow("insert failed");

            expect(client.query).toHaveBeenCalledWith("ROLLBACK");
            expect(client.release).toHaveBeenCalledTimes(1);
        });
    });

    describe("verifyUserWithToken", () => {
        test("commits and returns the verified user", async () => {
            const client = {
                query: jest.fn()
                    .mockResolvedValueOnce() // BEGIN
                    .mockResolvedValueOnce({ rows: [{ id: 1, is_verified: true }] }) // markUserAsVerified
                    .mockResolvedValueOnce() // deleteVerificationToken
                    .mockResolvedValueOnce(), // COMMIT
                release: jest.fn()
            };

            db.connect.mockResolvedValue(client);

            const user = await verifyUserWithToken(1, "tok");

            expect(client.query.mock.calls[0][0]).toBe("BEGIN");
            expect(client.query).toHaveBeenCalledWith("COMMIT");
            expect(client.release).toHaveBeenCalledTimes(1);
            expect(user).toEqual({ id: 1, is_verified: true });
        });

        test("rolls back and rethrows on failure", async () => {
            const error = new Error("update failed");

            const client = {
                query: jest.fn()
                    .mockResolvedValueOnce() // BEGIN
                    .mockRejectedValueOnce(error), // markUserAsVerified
                release: jest.fn()
            };

            db.connect.mockResolvedValue(client);

            await expect(verifyUserWithToken(1, "tok")).rejects.toThrow("update failed");

            expect(client.query).toHaveBeenCalledWith("ROLLBACK");
            expect(client.release).toHaveBeenCalledTimes(1);
        });
    });
});
