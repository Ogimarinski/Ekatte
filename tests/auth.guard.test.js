/**
 * @jest-environment jsdom
 */

import { logout, redirectIfAuthenticated, redirectIfUnauthenticated } from "../public/js/auth/auth.guard";
import { isValidToken, removeAccessToken } from "../public/js/auth/auth.storage";

jest.mock("../public/js/auth/auth.storage.js", () => ({
    isValidToken: jest.fn(),
    removeAccessToken: jest.fn()
}));

describe("authGuard", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("redirectIfAuthenticated returns true", () => {
        isValidToken.mockReturnValue(true);

        expect(redirectIfAuthenticated()).toBe(true);
    });

    test("redirectIfAuthenticated returns false", () => {
        isValidToken.mockReturnValue(false);

        expect(redirectIfAuthenticated()).toBe(false);
    });

    test("redirectIfUnauthenticated return true", () => {
        isValidToken.mockReturnValue(false);

        expect(redirectIfUnauthenticated()).toBe(true);

    });

    test("redirectIfUnauthenticated return false", () => {
        isValidToken.mockReturnValue(true);

        expect(redirectIfUnauthenticated()).toBe(false);
    });

    test("logout", () => {
        logout();

        expect(removeAccessToken).toHaveBeenCalled();
    });

});
