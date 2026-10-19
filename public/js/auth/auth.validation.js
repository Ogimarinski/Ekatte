const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
    if (!email) {
        return "Имейлът е задължителен.";
    }

    if (!EMAIL_REGEX.test(email)) {
        return "Въведи валиден имейл адрес.";
    }

    return "";
}

export function validatePassword(password) {
    if (!password) {
        return "Паролата е задължителна.";
    }

    if (password.length < 8) {
        return "Паролата трябва да е поне 8 символа.";
    }

    if (password.length > 100) {
        return "Паролата е твърде дълга.";
    }

    return "";
}

export function validateConfirmPassword(password, confirmPassword) {
    if (password !== confirmPassword) {
        return "Паролите не съвпадат.";
    }

    return "";
}