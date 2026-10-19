const { parseRequestBody } = require("../src/http/utils/request");
const { validateSchema } = require("../src/validators/validator");

const authService = require("../src/services/auth.service");
const { register, verify, resendVerification, login } = require("../src/http/controllers/auth.controller");
const { sendHttpResponse } = require("../src/http/utils/response");
const { handleError } = require("../src/http/utils/errorHandler");

jest.mock("../src/http/utils/request");

jest.mock("../src/validators/validator");

jest.mock("../src/services/auth.service");
jest.mock("../src/http/utils/response");
jest.mock("../src/http/utils/errorHandler");


describe("authController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("register should return 201", async () => {
        parseRequestBody.mockResolvedValue({
            email: "test@gmail.com",
            password: "12345678"

        });

        validateSchema.mockReturnValue({
            email: "test@gmail.com",
            password: "12345678"

        });

        authService.register.mockResolvedValue({ message: "Verification email sent." });

        const res = {};

        await register({}, res);

        expect(validateSchema).toHaveBeenCalledWith(
            "auth",
            "register",
            {
                email: "test@gmail.com",
                password: "12345678"
            }
        )

        expect(authService.register).toHaveBeenCalledWith("test@gmail.com", "12345678");

        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            201,
            JSON.stringify({ message: "Verification email sent." }),
            "application/json"
        );
    });

    test("verify should return 200", async () => {

        validateSchema.mockReturnValue({
            token: "token"
        });

        authService.verify.mockResolvedValue({ message: "Email verified successfully" });

        const res = {};
        const query = { token: "token" }

        await verify({}, res, { query });

        expect(validateSchema).toHaveBeenCalledWith("auth", "verify", { token: "token" });
        expect(authService.verify).toHaveBeenCalledWith("token");
        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            200,
            JSON.stringify({ message: "Email verified successfully" }),
            "application/json"
        );
    });

    test("verify should handle errors", async () => {
        const error = new Error("error");

        validateSchema.mockImplementation(() => {
            throw error;
        });

        const res = {};

        await verify({}, res, { query: {} });

        expect(handleError).toHaveBeenCalledWith(res, error);
    });

    test("resendVerification returns 200", async () => {
        parseRequestBody.mockResolvedValue({
            email: "test@gmail.com"
        });

        validateSchema.mockReturnValue({
            email: "test@gmail.com"
        });

        authService.resendVerification.mockResolvedValue({ message: "Verification email sent" });

        const res = {};

        await resendVerification({}, res);

        expect(validateSchema).toHaveBeenCalledWith(
            "auth",
            "resend",
            {
                email: "test@gmail.com"
            }
        );

        expect(authService.resendVerification).toHaveBeenCalledWith("test@gmail.com");
        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            200,
            JSON.stringify({ message: "Verification email sent" }),
            "application/json"
        );
    });

    test("login returns 200", async () => {

        parseRequestBody.mockResolvedValue({
            email: "test@gmail.com",
            password: "12345678"
        });

        validateSchema.mockReturnValue({
            email: "test@gmail.com",
            password: "12345678"
        });

        authService.login.mockResolvedValue({ accessToken: "accessToken" });

        const res = {};

        await login({}, res);

        expect(validateSchema).toHaveBeenCalledWith(
            "auth",
            "login",
            {
                email: "test@gmail.com",
                password: "12345678"
            }
        );

        expect(authService.login).toHaveBeenCalledWith("test@gmail.com", "12345678");

        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            200,
            JSON.stringify({ accessToken: "accessToken" }),
            "application/json"
        );
    });

    describe("error handling", () => {
        test.each([
            ["register", register],
            ["resendVerification", resendVerification],
            ["login", login]
        ])("%s handles errors", async (name, handler) => {
            const error = new Error("error");
            parseRequestBody.mockRejectedValue(error);

            const res = {};

            await handler({}, res);

            expect(handleError).toHaveBeenCalledWith(res, error);
        });
    });
});