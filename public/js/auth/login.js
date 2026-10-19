import { login, resendVerification } from "./auth.api.js";
import { saveAccessToken } from "./auth.storage.js";
import { validateEmail, validatePassword } from "./auth.validation.js";
import {
    showMessage,
    clearMessage,
    setFieldError,
    clearFieldErrors,
    setSubmitting
} from "../utils/formFeedback.js";
import { redirectIfAuthenticated } from "./auth.guard.js";

function initLoginForm() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    const submitBtn = document.getElementById("submitBtn");
    const resendSection = document.getElementById("resendSection");
    const resendBtn = document.getElementById("resendBtn");
    let unverifiedEmail = "";

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearMessage();

        const email = form.email.value.trim();
        const password = form.password.value;

        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);

        clearFieldErrors([
            { inputId: "email", errorId: "emailError" },
            { inputId: "password", errorId: "passwordError" }
        ]);

        setFieldError("email", "emailError", emailError);
        setFieldError("password", "passwordError", passwordError);

        if (emailError || passwordError) return;

        setSubmitting(submitBtn, true, "Влез");

        try {
            const result = await login(email, password);

            saveAccessToken(result.accessToken);

            showMessage("Успешен вход! Пренасочване...", "success");

            setTimeout(() => {
                window.location.href = "/";
            }, 800);

        } catch (err) {
            showMessage(err.message, "error");

            if (err.status === 403) {
                unverifiedEmail = email;
                resendSection.classList.remove("hidden");
            } else {
                resendSection.classList.add("hidden");
            }
        } finally {
            setSubmitting(submitBtn, false, "Влез");
        }
    });

    resendBtn?.addEventListener("click", async () => {
        if (!unverifiedEmail) return;

        resendBtn.disabled = true;

        try {
            const result = await resendVerification(unverifiedEmail);

            showMessage(
                result.message,
                "success"
            );

        } catch (err) {
            showMessage(err.message, "error");
        } finally {
            resendBtn.disabled = false;
        }
    });
}

if (!redirectIfAuthenticated()) {
    initLoginForm();
}