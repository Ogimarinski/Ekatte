export function isValidDateFormat(value) {
    return !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

