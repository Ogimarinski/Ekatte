const assert = require("node:assert/strict");

const EKATTE_BASE_PATTERN = /^\d{4}$/;

function generateEkatteFrom4(code) {
    assert.ok(
        typeof code === 'string' && EKATTE_BASE_PATTERN.test(code),
        `generateEkatteFrom4 expects a string of exactly 4 digits, got: ${code}`
    );

    const weights = [9, 7, 3, 1];
    let sum = 0;

    for (let i = 0; i < 4; i++) {
        sum += Number(code[i]) * weights[i];
    }

    const remainder = sum % 11;
    const checkDigit = remainder === 10 ? 0 : remainder;

    return code + checkDigit;
}

module.exports = {
    generateEkatteFrom4,
};  