import { isValidToken, removeAccessToken } from "./auth.storage.js";

const HOME_ROUTE = "/";
const LOGIN_ROUTE = "/login";

export function redirectIfAuthenticated() {
    if (isValidToken()) {
        window.location.href = HOME_ROUTE;
        return true;
    }

    return false;
}

export function redirectIfUnauthenticated() {
    if (!isValidToken()) {
        window.location.href = LOGIN_ROUTE;
        return true;
    }

    return false;
}

export function logout() {
    removeAccessToken();
    window.location.href = LOGIN_ROUTE;
}