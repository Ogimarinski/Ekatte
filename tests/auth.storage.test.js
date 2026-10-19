/**
 * @jest-environment jsdom
 */
import {
    saveAccessToken,
    getAccessToken,
    removeAccessToken,
    isValidToken
} from "../public/js/auth/auth.storage.js";

function makeToken(payload) {
    const header = btoa(JSON.stringify({ alg: "none" }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.signature`;
}

describe("auth.storage", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe("saveAccessToken / getAccessToken / removeAccessToken", () => {
        test("getAccessToken returns null when nothing is stored", () => {
            expect(getAccessToken()).toBeNull();
        });

        test("saveAccessToken stores the token under the expected key", () => {
            saveAccessToken("abc123");

            expect(localStorage.getItem("accessToken")).toBe("abc123");
            expect(getAccessToken()).toBe("abc123");
        });

        test("removeAccessToken clears a previously saved token", () => {
            saveAccessToken("abc123");
            removeAccessToken();

            expect(getAccessToken()).toBeNull();
        });
    });

    describe("isValidToken", () => {
        test("returns false when there is no token", () => {
            expect(isValidToken()).toBe(false);
        });

        test("returns true for a token with a future exp", () => {
            const futureExp = Math.floor(Date.now() / 1000) + 3600;
            saveAccessToken(makeToken({ exp: futureExp }));

            expect(isValidToken()).toBe(true);
        });

        test("returns false for an expired token", () => {
            const pastExp = Math.floor(Date.now() / 1000) - 3600;
            saveAccessToken(makeToken({ exp: pastExp }));

            expect(isValidToken()).toBe(false);
        });

        test("returns false when the payload has no exp field", () => {
            saveAccessToken(makeToken({ sub: "user-1" }));

            expect(isValidToken()).toBe(false);
        });

        test("returns false and clears storage for a malformed token", () => {
            saveAccessToken("not-a-jwt");

            expect(isValidToken()).toBe(false);
            expect(getAccessToken()).toBeNull();
        });
    });
});