export function isValidName(name) {
    return /^[А-Яа-я]+([ -][А-Яа-я]+)*$/.test(name);
}