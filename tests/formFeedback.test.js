/**
 * @jest-environment jsdom
 */

import {
    showMessage,
    clearMessage,
    setFieldError,
    clearFieldErrors,
    setSubmitting,
    withLock
} from "../public/js/utils/formFeedback.js";

describe("formFeedback", () => {
    describe("showMessage / clearMessage", () => {
        test("does nothing when formMessage box is missing", () => {
            document.body.innerHTML = "";
            expect(() => showMessage("text", "error")).not.toThrow();
            expect(() => clearMessage()).not.toThrow();
        });

        test("sets text and type class on the message box", () => {
            document.body.innerHTML = `<div id="formMessage" class="hidden success"></div>`;

            showMessage("Грешка при запис", "error");

            const box = document.getElementById("formMessage");
            expect(box.textContent).toBe("Грешка при запис");
            expect(box.classList.contains("error")).toBe(true);
            expect(box.classList.contains("hidden")).toBe(false);
            expect(box.classList.contains("success")).toBe(false);
        });

        test("clearMessage hides the box and empties text", () => {
            document.body.innerHTML = `<div id="formMessage">нещо</div>`;

            clearMessage();

            const box = document.getElementById("formMessage");
            expect(box.classList.contains("hidden")).toBe(true);
            expect(box.textContent).toBe("");
        });
    });

    describe("setFieldError / clearFieldErrors", () => {
        test("does nothing when input or error element is missing", () => {
            document.body.innerHTML = `<input id="email" />`;
            expect(() => setFieldError("email", "emailError", "невалиден")).not.toThrow();
        });

        test("sets invalid class and error text when message is present", () => {
            document.body.innerHTML = `
                <input id="email" />
                <span id="emailError"></span>
            `;

            setFieldError("email", "emailError", "Невалиден имейл");

            expect(document.getElementById("email").classList.contains("invalid")).toBe(true);
            expect(document.getElementById("emailError").textContent).toBe("Невалиден имейл");
        });

        test("clears invalid class when message is empty", () => {
            document.body.innerHTML = `
                <input id="email" class="invalid" />
                <span id="emailError">стара грешка</span>
            `;

            setFieldError("email", "emailError", "");

            expect(document.getElementById("email").classList.contains("invalid")).toBe(false);
            expect(document.getElementById("emailError").textContent).toBe("");
        });

        test("clearFieldErrors clears multiple fields", () => {
            document.body.innerHTML = `
                <input id="email" class="invalid" /><span id="emailError">e</span>
                <input id="password" class="invalid" /><span id="passwordError">p</span>
            `;

            clearFieldErrors([
                { inputId: "email", errorId: "emailError" },
                { inputId: "password", errorId: "passwordError" }
            ]);

            expect(document.getElementById("email").classList.contains("invalid")).toBe(false);
            expect(document.getElementById("password").classList.contains("invalid")).toBe(false);
        });
    });

    describe("setSubmitting", () => {
        test("does nothing when button is missing", () => {
            expect(() => setSubmitting(null, true, "Запази")).not.toThrow();
        });

        test("disables button and shows loading text when submitting", () => {
            document.body.innerHTML = `<button id="btn">Запази</button>`;
            const button = document.getElementById("btn");

            setSubmitting(button, true, "Запази");

            expect(button.disabled).toBe(true);
            expect(button.textContent).toBe("Изчакай...");
        });

        test("re-enables button and restores idle text when not submitting", () => {
            document.body.innerHTML = `<button id="btn">Моля, изчакай...</button>`;
            const button = document.getElementById("btn");

            setSubmitting(button, false, "Запази");

            expect(button.disabled).toBe(false);
            expect(button.textContent).toBe("Запази");
        });
    });

    describe("withLock", () => {
        test("runs the wrapped function and unlocks the button afterwards", async () => {
            document.body.innerHTML = `<button id="btn"></button>`;
            const button = document.getElementById("btn");
            const fn = jest.fn().mockResolvedValue("done");

            const locked = withLock(button, fn);
            const result = await locked("arg1");

            expect(fn).toHaveBeenCalledWith("arg1");
            expect(result).toBe("done");
            expect(button.disabled).toBe(false);
        });

        test("skips the call when the button is already disabled", async () => {
            document.body.innerHTML = `<button id="btn" disabled></button>`;
            const button = document.getElementById("btn");
            const fn = jest.fn();

            await withLock(button, fn)();

            expect(fn).not.toHaveBeenCalled();
        });

        test("re-enables the button even when the wrapped function throws", async () => {
            document.body.innerHTML = `<button id="btn"></button>`;
            const button = document.getElementById("btn");
            const fn = jest.fn().mockRejectedValue(new Error("боум"));

            await expect(withLock(button, fn)()).rejects.toThrow("боум");
            expect(button.disabled).toBe(false);
        });
    });
});