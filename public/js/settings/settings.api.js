import { authFetch } from "../auth/auth.api.js";
import { handleResponse } from "../utils/http.js";

export async function getSettings() {
    const res = await authFetch("/api/settings");
    return handleResponse(res);
}

export async function updateSettings(loginBlockDurationMinutes, resendEmailIntervalMinutes) {
    const res = await authFetch("/api/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ loginBlockDurationMinutes, resendEmailIntervalMinutes })
    });
    return handleResponse(res);
}