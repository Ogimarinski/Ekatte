const { ValidationError } = require("../src/errors/ValidationError");
const { ConflictError } = require("../src/errors/ConflictError");
const { NotFoundError } = require("../src/errors/NotFoundError");
const authRepository = require("../src/repositories/auth.repository");
const settingsService = require("../src/services/settings.service");
const { register, verify, login } = require("../src/services/auth.service");
const { sendVerificationEmail } = require("../src/services/email.service");
const { hashPassword, comparePassword } = require("../src/utils/password.utils");
const { generateVerificationToken, generateAccessToken } = require("../src/utils/token.utils");
const { resendVerification } = require("../src/services/auth.service");
const { TooManyRequestsError } = require("../src/errors/TooManyRequestsError");
const { UnauthorizedError } = require("../src/errors/UnauthorizedError");
const { LockedError } = require("../src/errors/LockedError");
const { ForbiddenError } = require("../src/errors/ForbiddenError");

jest.mock("../src/repositories/auth.repository");
jest.mock("../src/services/settings.service");
jest.mock("../src/utils/token.utils.js");
jest.mock("../src/utils/password.utils.js");
jest.mock("../src/services/email.service.js");

const NOW = new Date("2026-01-01T00:00:00.000Z");

describe("auth.service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(NOW);
        sendVerificationEmail.mockResolvedValue()
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe("register", () => {
        test("throws ConflictError if user already exists", async () => {
            authRepository.findUserByEmail.mockResolvedValue({ id: 1 });

            await expect(register("test@gmail.com", "12345678")).rejects.toThrow(ConflictError);

            expect(authRepository.createUserWithVerificationToken).not.toHaveBeenCalled();
        });

        test("creates the user with a hashed password and a token expiring per setting, and sends the email", async () => {
            authRepository.findUserByEmail.mockResolvedValue(null);
            hashPassword.mockResolvedValue("hashed-pwd");
            generateVerificationToken.mockReturnValue("verification-token");
            authRepository.getSetting.mockReturnValue("60");
            authRepository.createUserWithVerificationToken.mockResolvedValue({
                email: "test@gmail.com"
            });

            const result = await register("test@gmail.com", "12345678");

            expect(hashPassword).toHaveBeenCalledWith("12345678");
            expect(authRepository.getSetting).toHaveBeenCalledWith(
                "verification_token_expiration_minutes"
            );

            const [email, passwordHash, token, expiresAt] = authRepository.createUserWithVerificationToken.mock.calls[0];

            expect(email).toBe("test@gmail.com");
            expect(passwordHash).toBe("hashed-pwd");
            expect(token).toBe("verification-token");
            expect(expiresAt).toEqual(new Date("2026-01-01T01:00:00.000Z")); // NOW + 60 min

            expect(sendVerificationEmail).toHaveBeenCalledWith("test@gmail.com", "verification-token");
            expect(result).toEqual({ message: "Verification email sent." });
        });

        test("doesnt reject when sendVerificationFails (fire-and-forget)", async () => {
            authRepository.findUserByEmail.mockResolvedValue(null);
            hashPassword.mockResolvedValue("hashed-pwd");
            generateVerificationToken.mockReturnValue("verification-token");
            authRepository.getSetting.mockReturnValue("60");
            authRepository.createUserWithVerificationToken.mockResolvedValue({
                email: "test@gmail.com"
            });

            sendVerificationEmail.mockRejectedValue(new Error("error"));
            await expect(register("test@gmail.com", "12345678")).resolves.toEqual({
                message: "Verification email sent."
            });

        });
    });

    describe("verify", () => {
        test("throws NotFoundError when verification token is not found.", async () => {
            authRepository.findVerificationToken.mockResolvedValue(null);

            await expect(verify("token")).rejects.toThrow(NotFoundError);
        });

        test("throws ValidationError when token has expired", async () => {
            authRepository.findVerificationToken.mockResolvedValue({
                expires_at: new Date("2025-12-31T00:00:00.000Z"),
            });

            await expect(verify("token")).rejects.toThrow(ValidationError);
        });

        test("throws ConflictError if user is already verified.", async () => {
            authRepository.findVerificationToken.mockResolvedValue({
                is_verified: true
            });

            await expect(verify("token")).rejects.toThrow(ConflictError);
        });

        test("verifies the user and returns a success message", async () => {
            authRepository.findVerificationToken.mockResolvedValue({
                user_id: 1,
                expires_at: new Date("2026-06-01T00:00:00.000Z"),
                is_verified: false
            });

            const result = await verify("token");

            expect(authRepository.verifyUserWithToken).toHaveBeenCalledWith(1, "token");

            expect(result).toEqual({ message: "Email verified successfully" });

        });
    });

    describe("resendVerification", () => {
        test("throw NotFoundError when the user doesnt exist", async () => {
            authRepository.findUserByEmail.mockResolvedValue(null);

            await expect(resendVerification("test@gmail.com")).rejects.toThrow(NotFoundError);
        });

        test("throws ConflictError when user is already verified", async () => {
            authRepository.findUserByEmail.mockResolvedValue({
                is_verified: true
            });

            await expect(resendVerification("test@gmail.com")).rejects.toThrow(ConflictError);
        });

        test("throws NotFoundError when verification token is not found", async () => {
            authRepository.findUserByEmail.mockResolvedValue({
                id: 1,
                is_verified: false
            });

            authRepository.findVerificationTokenByUserId.mockResolvedValue(null);

            await expect(resendVerification("test@gmail.com")).rejects.toThrow(NotFoundError);
        });

        test("throws TooManyRequestErrors when the resend interval is not elapsed", async () => {
            authRepository.findUserByEmail.mockResolvedValue({
                id: 1,
                is_verified: false
            });

            authRepository.findVerificationTokenByUserId.mockResolvedValue({
                created_at: new Date("2025-12-31T23:50:00.000Z") // 10 минути преди NOW
            });

            settingsService.getSettings.mockResolvedValue({
                resend_email_interval_minutes: 15 // трябва 15 минути разлика
            });

            await expect(resendVerification("test@gmail.com")).rejects.toThrow(TooManyRequestsError);

        });
        test("issues a new token and sends the email once the interval has elapsed", async () => {
            authRepository.findUserByEmail.mockResolvedValue({
                id: 1,
                email: "test@gmail.com",
                is_verified: false
            });
            authRepository.findVerificationTokenByUserId.mockResolvedValue({
                created_at: new Date("2025-12-31T23:00:00.000Z") // 60 min before NOW
            });
            settingsService.getSettings.mockResolvedValue({
                resend_email_interval_minutes: 15
            });
            authRepository.getSetting.mockResolvedValue("60"); // verification_token_expiration_minutes
            generateVerificationToken.mockReturnValue("new-token");

            const result = await resendVerification("test@gmail.com");

            expect(authRepository.createVerificationToken).toHaveBeenCalledWith(
                1,
                "new-token",
                new Date("2026-01-01T01:00:00.000Z")
            );
            expect(sendVerificationEmail).toHaveBeenCalledWith("test@gmail.com", "new-token");
            expect(result).toEqual({ message: "Verification email sent" });
        });

        test("console error when failed to send verification email", async () => {
            jest.spyOn(console, "error").mockImplementation(() => { });

            authRepository.findUserByEmail.mockResolvedValue({
                id: 1,
                email: "test@gmail.com",
                is_verified: false
            });
            authRepository.findVerificationTokenByUserId.mockResolvedValue({
                created_at: new Date("2025-12-31T23:00:00.000Z") // 60 min before NOW
            });
            settingsService.getSettings.mockResolvedValue({
                resend_email_interval_minutes: 15
            });
            authRepository.getSetting.mockResolvedValue("60"); // verification_token_expiration_minutes
            generateVerificationToken.mockReturnValue("new-token");

            const error = new Error("error");
            sendVerificationEmail.mockRejectedValue(error);

            await resendVerification("test@gmail.com");

            expect(authRepository.createVerificationToken).toHaveBeenCalledWith(
                1,
                "new-token",
                new Date("2026-01-01T01:00:00.000Z")
            );

            // .catch() се закача върху sendVerificationEmail Promise-а ПРЕДИ resendVerification
            // да достигне своя return - значи неговият microtask job влиза в опашката преди
            // продължението на await-а тук, и FIFO гарантира, че вече е изпълнен на този ред.
            expect(console.error).toHaveBeenCalledWith(`Failed to send verification email to test@gmail.com:`, error);

            console.error.mockRestore();
        });
    });

    describe("login", () => {
        test("throws UnauthorizedError when invalid email or password", async () => {
            authRepository.findUserByEmail.mockResolvedValue(null);

            await expect(login("test@gmail.com", "12345678")).rejects.toThrow(UnauthorizedError);
        });

        test("throws LockedError if account is temporarily locked", async () => {
            authRepository.findUserByEmail.mockResolvedValue({
                blocked_until: new Date("2026-06-01T00:00:00.000Z")
            });

            await expect(login("test@gmail.com", "12345678")).rejects.toThrow(LockedError);
        });

        test("clears an expired block and continues", async () => {
            authRepository.findUserByEmail.mockResolvedValue({
                id: 1,
                blocked_until: new Date("2025-12-31T00:00:00.000Z"),
                is_verified: true,
                password_hash: "hashed-pwd"
            });

            comparePassword.mockResolvedValue(true);
            generateAccessToken.mockReturnValue("access-token");

            const result = await login("test@gmail.com", "12345678");

            expect(authRepository.resetFailedAttempts).toHaveBeenCalledWith(1);
            expect(result).toEqual({ accessToken: "access-token" });
        });

        test("throws UnauthorizedError on wrong password without blocking(below the max attempts)", async () => {
            authRepository.findUserByEmail.mockResolvedValue({
                id: 1,
                blocked_until: null
            });

            comparePassword.mockResolvedValue(false);
            authRepository.incrementFailedAttempts.mockResolvedValue({
                failed_attempts: 2
            });

            authRepository.getSetting.mockResolvedValue("5");

            await expect(login("test@gmail.com", "12345678")).rejects.toThrow(UnauthorizedError);

            expect(authRepository.setBlockedUntil).not.toHaveBeenCalled();
        });

        test("blocks the account once max failed attempts is reached", async () => {
            authRepository.findUserByEmail.mockResolvedValue({
                id: 1,
                blocked_until: null
            });

            comparePassword.mockResolvedValue(false);
            authRepository.incrementFailedAttempts.mockResolvedValue({
                failed_attempts: 5
            });

            authRepository.getSetting.mockResolvedValue("5"); // max_failed_login_attempts
            settingsService.getSettings.mockResolvedValue({
                login_block_duration_minutes: 30
            });

            await expect(login("test@gmail.com", "12345678")).rejects.toThrow(UnauthorizedError);

            expect(authRepository.setBlockedUntil).toHaveBeenCalledWith(
                1,
                new Date("2026-01-01T00:30:00.000Z")
            );
        });

        test("throws Forbidden error when password is correct but email is not verified", async () => {
            authRepository.findUserByEmail.mockResolvedValue({
                id: 1,
                blocked_until: null,
                is_verified: false,
                password_hash: "hashed-pwd"
            });

            comparePassword.mockResolvedValue(true);

            await expect(login("test@gmail.com", "12345678")).rejects.toThrow(ForbiddenError);
        });

        test("returns an access token on successful login", async () => {
            authRepository.findUserByEmail.mockResolvedValue({
                id: 1,
                blocked_until: null,
                is_verified: true,
                password_hash: "hashed-pwd"
            });

            comparePassword.mockResolvedValue(true);
            generateAccessToken.mockReturnValue("access-token");

            const result = await login("test@gmail.com", "12345678");

            expect(authRepository.resetFailedAttempts).toHaveBeenCalledWith(1);
            expect(generateAccessToken).toHaveBeenCalledWith(
                expect.objectContaining({ id: 1 })
            );
            expect(result).toEqual({ accessToken: "access-token" });
        });
    });
});