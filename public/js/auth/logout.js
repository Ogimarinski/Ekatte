import { logout } from "./auth.guard.js";

function initLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", logout);
}

initLogout();
