const assert = require("node:assert/strict");
const { type } = require("node:os");
const { inspect } = require("node:util");

function assertPositiveInt(value, name) {
    assert.ok(
        Number.isSafeInteger(value) && value > 0,
        `${name} must be a positive integer, got: ${inspect(value)}`
    );
}

function assertOneOf(value, allowed, name) {
    assert.ok(
        allowed.includes(value),
        `${name} must be one of ${allowed.join(", ")}, got: ${inspect(value)}`
    );
}

function assertNonEmptyArray(value, name) {
    assert.ok(
        Array.isArray(value) && value.length > 0,
        `${name} must be a non-empty array, got: ${inspect(value)}`
    );
}

function assertPositiveIntArray(values, name) {
    assertNonEmptyArray(values, name);

    values.forEach((value, index) => assertPositiveInt(value, `${name}[${index}]`));
}

function assertNumberInRange(value, min, max, name) {
    assert.ok(
        Number.isFinite(value) && value >= min && value <= max,
        `${name} must be a finite number between ${min} and ${max}, got: ${inspect(value)}`
    );
}

function assertYear(year, name) {
    assert.ok(
        Number.isInteger(year) &&
        year >= 1 &&
        year <= 9999,
        `${name} must be an integer between 1 and 9999; got: ${year}`
    );
}

function assertMonth(month, name) {
    assert.ok(
        Number.isInteger(month) &&
        month >= 1 &&
        month <= 12,
        `${name} must be an integer between 1 and 12; got: ${month}`
    );
}

function assertYearRange(fromYear, toYear) {
    assertYear(fromYear, "fromYear");
    assertYear(toYear, "toYear");

    assert.ok(
        fromYear <= toYear,
        `fromYear must not be greater than toYear; got: ${fromYear} > ${toYear}`
    );
}

function assertCountryCode(countryCode) {
    assert.ok(
        typeof countryCode === "string" &&
        /^[A-Z]{2}$/.test(countryCode),
        `country_code must be a two-letter uppercase code; got: ${countryCode}`
    );
}

function assertObject(value, name) {
    assert.ok(
        value !== null && typeof value === 'object' && !Array.isArray(value),
        `${name} must be an object`
    );
}

function assertPeriod(fromYear, fromMonth, toYear, toMonth) {
    assertYearRange(fromYear, toYear);

    const hasFromMonth = fromMonth !== undefined;
    const hasToMonth = toMonth !== undefined;

    assert.ok(
        hasFromMonth === hasToMonth,
        `fromMonth and toMonth must either both be provided or be omitted`
    );

    if (!hasFromMonth) {
        return;
    }

    assertMonth(fromMonth, 'fromMonth');
    assertMonth(toMonth, 'toMonth');

    assert.ok(
        fromYear !== toYear || fromMonth <= toMonth,
        `Invalid period: ${fromYear}-${fromMonth} is after ${toYear}-${toMonth}`
    );
}

function assertValidDate(value, name) {
    assert.ok(
        (typeof value === 'string' || value instanceof Date) &&
        !Number.isNaN(new Date(value).getTime()),
        `${name} must be a valid name`
    );
}


module.exports = {
    assertPositiveInt,
    assertOneOf,
    assertNonEmptyArray,
    assertPositiveIntArray,
    assertNumberInRange,
    assertYear,
    assertMonth,
    assertYearRange,
    assertCountryCode,
    assertObject,
    assertPeriod,
    assertValidDate
};