/**
 * @jest-environment jsdom
 */

import { login, register, verify, resendVerification, authFetch } from "../public/js/auth/auth.api.js";
import { logout } from "../public/js/auth/auth.guard.js";
import { getAccessToken } from "../public/js/auth/auth.storage.js";

jest.mock("../public/js/auth/auth.guard.js");
jest.mock("../public/js/auth/auth.storage.js");

global.fetch = jest.fn();

describe("auth.api", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockFetchSuccess = (data) => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue(data)
        });
    };

    const mockFetchError = (status, data) => {
        fetch.mockResolvedValueOnce({
            ok: false,
            status,
            json: jest.fn().mockResolvedValue(data)
        });
    };

    describe("login", () => {
        test("posts credentials and returns the parsed response", async () => {
            mockFetchSuccess({ accessToken: "abc" });

            const result = await login("test@gmail.com", "12345678");

            expect(fetch).toHaveBeenCalledWith("/api/auth/login", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email: "test@gmail.com", password: "12345678" })
            });

            expect(result).toEqual({ accessToken: "abc" });
        });

        test("throws the server error message and attaches the status", async () => {
            mockFetchError(401, { error: "Invalid credentials" });

            await expect(login("test@gmail.com", "wrong")).rejects.toMatchObject({
                message: "Invalid credentials",
                status: 401
            });
        });
    });

    describe("register", () => {
        test("posts the new account and returns the parsed response", async () => {
            mockFetchSuccess({ message: "Verification email sent." });

            const result = await register("test@gmail.com", "12345678");

            expect(fetch).toHaveBeenCalledWith("/api/auth/register", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email: "test@gmail.com", password: "12345678" })
            });

            expect(result).toEqual({ message: "Verification email sent." });
        });
    });

    describe("verify", () => {
        test("GETs the verify endpoint with an encoded token", async () => {
            mockFetchSuccess({ message: "Email verified successfully" });

            const result = await verify("a b+c");

            expect(fetch).toHaveBeenCalledWith(`/api/auth/verify?token=${encodeURIComponent("a b+c")}`);
            expect(result).toEqual({ message: "Email verified successfully" });
        });
    });

    describe("resendVerification", () => {
        test("posts the email and returns the parsed response", async () => {
            mockFetchSuccess({ message: "Verification email sent" });

            const result = await resendVerification("test@gmail.com");

            expect(fetch).toHaveBeenCalledWith("/api/auth/resend", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email: "test@gmail.com" })
            });

            expect(result).toEqual({ message: "Verification email sent" });
        });
    });

    describe("error handling shared by all endpoints (via login)", () => {
        test("falls back to a default message when the error body is not JSON", async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: jest.fn().mockRejectedValue(new Error("not json"))
            });

            await expect(login("test@gmail.com", "12345678")).rejects.toMatchObject({
                message: "Request failed",
                status: 500
            });
        });

        test("falls back to a default message when the error body has no error field", async () => {
            mockFetchError(400, {});

            await expect(login("test@gmail.com", "12345678")).rejects.toMatchObject({
                message: "Request failed",
                status: 400
            });
        });

        test("throws when the successful response body is not valid JSON", async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockRejectedValue(new Error("not json"))
            });

            await expect(login("test@gmail.com", "12345678")).rejects.toThrow("Invalid JSON response");
        });
    });

    describe("authFetch", () => {
        test("adds an Authorization header when a token is present", async () => {
            getAccessToken.mockReturnValue("token123");
            fetch.mockResolvedValueOnce({ ok: true, status: 200 });

            await authFetch("/api/regions");

            expect(fetch).toHaveBeenCalledWith("/api/regions", {
                headers: { Authorization: "Bearer token123" }
            });
        });

        test("omits the Authorization header when there is no token", async () => {
            getAccessToken.mockReturnValue(null);
            fetch.mockResolvedValueOnce({ ok: true, status: 200 });

            await authFetch("/api/regions");

            expect(fetch).toHaveBeenCalledWith("/api/regions", {
                headers: {}
            });
        });

        test("merges caller-provided headers with the Authorization header", async () => {
            getAccessToken.mockReturnValue("token123");
            fetch.mockResolvedValueOnce({ ok: true, status: 200 });

            await authFetch("/api/regions", {
                method: "POST",
                headers: { "content-type": "application/json" }
            });

            expect(fetch).toHaveBeenCalledWith("/api/regions", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    Authorization: "Bearer token123"
                }
            });
        });

        test("logs out and throws on a 401 response", async () => {
            getAccessToken.mockReturnValue("expired-token");
            fetch.mockResolvedValueOnce({ ok: false, status: 401 });

            await expect(authFetch("/api/regions")).rejects.toThrow("Unauthorized");

            expect(logout).toHaveBeenCalledTimes(1);
        });

        test("returns the raw response on success without touching the body", async () => {
            getAccessToken.mockReturnValue("token123");
            const fakeRes = { ok: true, status: 200 };
            fetch.mockResolvedValueOnce(fakeRes);

            const result = await authFetch("/api/regions");

            expect(result).toBe(fakeRes);
            expect(logout).not.toHaveBeenCalled();
        });
    });
});
