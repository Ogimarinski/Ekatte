import { logout } from "./auth.guard.js";
import { getAccessToken } from "./auth.storage.js";
import { handleResponse } from "../utils/http.js";

export async function login(email, password) {
    const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify({
            email,
            password
        })
    });

    return handleResponse(res);
}

export async function register(email, password) {
    const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify({
            email,
            password
        })
    });

    return handleResponse(res);
}

export async function verify(token) {
    const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`);

    return handleResponse(res);
}

export async function resendVerification(email) {
    const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify({
            email
        })
    });

    return handleResponse(res);
}

export async function authFetch(url, options = {}) {
    const token = getAccessToken();

    const headers = {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
        logout();
        throw new Error("Unauthorized");
    }

    return res;
}