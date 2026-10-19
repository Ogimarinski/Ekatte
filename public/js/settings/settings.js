import { getSettings, updateSettings } from "./settings.api.js";
import { redirectIfUnauthenticated } from "../auth/auth.guard.js";
import { showMessage, clearMessage, setFieldError, clearFieldErrors, setSubmitting } from "../utils/formFeedback.js";
import { validateLoginBlockDuration, validateResendInterval } from "./settings.validation.js";

async function initSettingsForm() {
    const form = document.getElementById("settingsForm");
    if (!form) return;

    const submitBtn = document.getElementById("submitBtn");

    try {
        const current = await getSettings();
        form.loginBlockDurationMinutes.value = current.login_block_duration_minutes;
        form.resendEmailIntervalMinutes.value = current.resend_email_interval_minutes;
    } catch (err) {
        showMessage(err.message, "error");
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearMessage();


        const durationError = validateLoginBlockDuration(form.loginBlockDurationMinutes.value);
        const intervalError = validateResendInterval(form.resendEmailIntervalMinutes.value);

        clearFieldErrors([
            { inputId: "loginBlockDurationMinutes", errorId: "loginBlockDurationMinutesError" },
            { inputId: "resendEmailIntervalMinutes", errorId: "resendEmailIntervalMinutesError" }
        ]);

        setFieldError("loginBlockDurationMinutes", "loginBlockDurationMinutesError", durationError);
        setFieldError("resendEmailIntervalMinutes", "resendEmailIntervalMinutesError", intervalError);

        if (durationError || intervalError) return;

        const loginBlockDurationMinutes = Number(form.loginBlockDurationMinutes.value);
        const resendEmailIntervalMinutes = Number(form.resendEmailIntervalMinutes.value);

        setSubmitting(submitBtn, true, "Запази");

        try {
            await updateSettings(loginBlockDurationMinutes, resendEmailIntervalMinutes);
            showMessage("Успешна промяна", "success");
        } catch (err) {
            showMessage(err.message, "error");
        } finally {
            setSubmitting(submitBtn, false, "Запази");
        }
    });
}

if (!redirectIfUnauthenticated()) {
    initSettingsForm();
}