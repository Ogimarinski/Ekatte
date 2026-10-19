import { verify } from "./auth.api.js";
import { showMessage } from "../utils/formFeedback.js";

function getTokenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
}

function showContinueButton() {
    const continueBtn = document.getElementById("continueBtn");
    if (!continueBtn) return;

    continueBtn.classList.remove("hidden");
    continueBtn.addEventListener("click", () => {
        window.location.href = "/login";
    });
}

function initVerifyPage() {
    const token = getTokenFromUrl();
    const confirmBtn = document.getElementById("confirmBtn");

    if (!token) {
        showMessage("Липсва токен за потвърждение.", "error");
        confirmBtn?.classList.add("hidden");
        return;
    }

    confirmBtn?.addEventListener("click", async () => {
        confirmBtn.disabled = true;

        try {
            await verify(token);

            showMessage("Имейлът е потвърден успешно!", "success");
            confirmBtn.classList.add("hidden");
            showContinueButton();
        } catch (err) {
            showMessage(err.message, "error");
            confirmBtn.disabled = false;
        }
    });
}

initVerifyPage();
