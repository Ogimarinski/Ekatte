export function validateLoginBlockDuration(rawValue) {
    if (rawValue === "" || rawValue === null || rawValue === undefined) {
        return "Времетраенето на блокиране е задължително.";
    }

    const value = Number(rawValue);

    if (!Number.isInteger(value)) {
        return "Времетраенето на блокиране трябва да е цяло число.";
    }

    if (value < 1 || value > 1440) {
        return "Времетраенето на блокиране трябва да е между 1 и 1440 минути.";
    }

    return "";
}

export function validateResendInterval(rawValue) {
    if (rawValue === "" || rawValue === null || rawValue === undefined) {
        return "Интервалът за повторно изпращане е задължителен.";
    }

    const value = Number(rawValue);

    if (!Number.isInteger(value)) {
        return "Интервалът за повторно изпращане трябва да е цяло число.";
    }

    if (value < 1 || value > 60) {
        return "Интервалът за повторно изпращане трябва да е между 1 и 60 минути.";
    }

    return "";
}