export function showMessage(text, type) {
    const box = document.getElementById("formMessage");
    if (!box) return;

    box.textContent = text;
    box.classList.remove("hidden", "success", "error");
    box.classList.add(type);
}

export function clearMessage() {
    const box = document.getElementById("formMessage");
    if (!box) return;

    box.classList.add("hidden");
    box.textContent = "";
}

export function setFieldError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);

    if (!input || !error) {
        return;
    }

    input.classList.toggle("invalid", Boolean(message));
    error.textContent = message ?? "";
}

export function clearFieldErrors(fieldIds) {
    fieldIds.forEach(({ inputId, errorId }) => setFieldError(inputId, errorId, ""));
}

export function setSubmitting(button, isSubmitting, idleText) {
    if (!button) return;

    button.disabled = isSubmitting;
    button.textContent = isSubmitting ? "Изчакай..." : idleText;
}

export function withLock(button, fn) {
    return async (...args) => {
        if (button.disabled) return;

        button.disabled = true;

        try {
            return await fn(...args);
        } finally {
            button.disabled = false;
        }
    };
}