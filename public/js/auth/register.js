import { register, resendVerification } from "./auth.api.js";
import { validateConfirmPassword, validateEmail, validatePassword } from "./auth.validation.js";
import {
    showMessage,
    clearMessage,
    setFieldError,
    clearFieldErrors,
    setSubmitting
} from "../utils/formFeedback.js";
import { redirectIfAuthenticated } from "./auth.guard.js";

function initRegisterForm() {
    const form = document.getElementById("registerForm");
    if (!form) return;

    const submitBtn = document.getElementById("submitBtn");
    const resendSection = document.getElementById("resendSection");
    const resendBtn = document.getElementById("resendBtn");
    let registeredEmail = "";

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearMessage();

        const email = form.email.value.trim();
        const password = form.password.value;
        const confirmPassword = form.confirmPassword.value;

        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);
        const confirmPasswordError = validateConfirmPassword(password, confirmPassword);

        clearFieldErrors([
            { inputId: "email", errorId: "emailError" },
            { inputId: "password", errorId: "passwordError" },
            { inputId: "confirmPassword", errorId: "confirmPasswordError" }
        ]);

        setFieldError("email", "emailError", emailError);
        setFieldError("password", "passwordError", passwordError);
        setFieldError("confirmPassword", "confirmPasswordError", confirmPasswordError);

        if (emailError || passwordError || confirmPasswordError) return;

        setSubmitting(submitBtn, true, "Регистрирай се");

        try {
            const result = await register(email, password);

            registeredEmail = email;

            showMessage(
                result.message,
                "success"
            );

            form.reset();
            resendSection.classList.remove("hidden");

        } catch (err) {
            showMessage(err.message, "error");
        } finally {
            setSubmitting(submitBtn, false, "Регистрирай се");
        }
    });

    resendBtn?.addEventListener("click", async () => {
        if (!registeredEmail) return;

        resendBtn.disabled = true;

        try {
            const result = await resendVerification(registeredEmail);

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
    initRegisterForm();
}