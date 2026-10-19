const db = require("../../db");
const assert = require("node:assert/strict");
const { assertObject, assertCountryCode, assertYear, assertYearRange, assertMonth, assertPeriod, assertPositiveInt } = require("../utils/assert.utils");

const TEMP_TYPES = ["min", "max", "avg"];
const GRANULARITIES = ["year", "month"];

function assertTempType(tempType) {
    assert.ok(
        TEMP_TYPES.includes(tempType),
        `temp_type must be one of ${TEMP_TYPES.join(", ")}, got: ${tempType}`
    );
}

function assertGranularity(granularity) {
    assert.ok(
        GRANULARITIES.includes(granularity),
        `granularity must be one of ${GRANULARITIES.join(", ")}, got: ${granularity}`
    );
}

function assertClimateFilters(filters, { requireTempType = true, requireGranularity = true } = {}) {
    assertObject(filters, 'filters');

    assertCountryCode(filters.country_code);

    if (requireTempType) {
        assertTempType(filters.temp_type);
    }

    if (requireGranularity) {
        assertGranularity(filters.granularity);
    }

    const {
        granularity,
        from_year,
        from_month,
        to_year,
        to_month
    } = filters;

    assertPeriod(from_year, from_month, to_year, to_month);

    if (granularity === 'month') {
        assert.ok(
            from_month !== undefined && to_month !== undefined,
            "from_month and to_month are required for monthly granularity"
        )
    }
}


function buildPeriodWhere(filters) {
    const {
        country_code,
        granularity,
        from_year,
        from_month,
        to_year,
        to_month
    } = filters;

    assertGranularity(granularity);

    if (granularity === "year") {
        return {
            sql: `country_code = $1 AND year BETWEEN $2 AND $3`,
            params: [country_code, from_year, to_year]
        };
    }

    return {
        sql: `
            country_code = $1
            AND(year, month) BETWEEN($2, $3) AND($4, $5)
        `,
        params: [
            country_code,
            from_year,
            from_month,
            to_year,
            to_month
        ]
    };
}


async function findSummary(filters) {
    assertClimateFilters(filters);

    const { temp_type } = filters;

    const { sql, params } = buildPeriodWhere(filters);

    const result = await db.query(
        `
        SELECT
            SUM(${temp_type}_sum) / NULLIF(SUM(${temp_type}_count), 0) AS average,
            MAX(${temp_type}_max) AS max,
            MIN(${temp_type}_min) AS min,
            SUM(${temp_type}_count) AS records
        FROM climate_country_month_rollup
        WHERE ${sql}
        `, params);

    return result.rows[0];
}


async function findTimeseries(filters) {
    assertClimateFilters(filters);

    const { temp_type, granularity } = filters;

    const { sql, params } = buildPeriodWhere(filters);

    if (granularity === "year") {
        const result = await db.query(`
            SELECT
                year,
                SUM(${temp_type}_sum) / NULLIF(SUM(${temp_type}_count), 0) AS value
            FROM climate_country_month_rollup
            WHERE ${sql}
            GROUP BY year
            ORDER BY year
        `, params);

        return result.rows;
    }

    const result = await db.query(`
        SELECT
            year, month, ${temp_type}_sum / NULLIF(${temp_type}_count, 0) AS value
        FROM climate_country_month_rollup
        WHERE ${sql}
        ORDER BY year, month
    `, params);

    return result.rows;
}

function splitPeriod(fromYear, fromMonth, toYear, toMonth) {
    assertPeriod(fromYear, fromMonth, toYear, toMonth);

    if (fromMonth === undefined || toMonth === undefined || (fromMonth === 1 && toMonth === 12)) {
        return {
            monthlySegments: [],
            fullYears: {
                from: fromYear,
                to: toYear
            }
        };
    }

    if (fromYear === toYear) {
        return {
            monthlySegments: [
                {
                    year: fromYear,
                    fromMonth,
                    toMonth
                }
            ],
            fullYears: null
        };
    }

    const monthlySegments = [];

    if (fromMonth > 1) {
        monthlySegments.push({
            year: fromYear,
            fromMonth,
            toMonth: 12
        });
    }

    if (toMonth < 12) {
        monthlySegments.push({
            year: toYear,
            fromMonth: 1,
            toMonth
        });
    }

    const fullFrom = fromMonth > 1
        ? fromYear + 1
        : fromYear;

    const fullTo = toMonth < 12
        ? toYear - 1
        : toYear;

    return {
        monthlySegments,
        fullYears: fullFrom <= fullTo
            ? { from: fullFrom, to: fullTo }
            : null
    };
}


async function findTopSettlements(filters) {

    assertObject(filters);
    assertCountryCode(filters.country_code);
    assertTempType(filters.temp_type);
    assertPeriod(
        filters.from_year,
        filters.from_month,
        filters.to_year,
        filters.to_month
    );
    assertPositiveInt(filters.limit, 'limit');

    const {
        country_code,
        temp_type,
        from_year,
        from_month,
        to_year,
        to_month,
        limit
    } = filters;

    const { monthlySegments, fullYears } = splitPeriod(
        from_year,
        from_month,
        to_year,
        to_month
    );

    const parts = [];
    const params = [country_code];


    // Частични години
    for (const segment of monthlySegments) {
        const base = params.length;

        params.push(
            segment.year,
            segment.fromMonth,
            segment.toMonth
        );

        if (temp_type === "avg") {
            parts.push(`
                SELECT
                    sc.settlement_id,
                    SUM(sc.avg_temperature) AS sum_value,
                    COUNT(*) AS count_value,
                    NULL::real AS extreme_value
                FROM settlement_climate sc
                WHERE sc.year = $${base + 1}
                AND sc.month BETWEEN $${base + 2} AND $${base + 3}
                GROUP BY sc.settlement_id
            `);
        } else {
            const column =
                temp_type === "max"
                    ? "max_temperature"
                    : "min_temperature";

            const aggregate =
                temp_type === "max"
                    ? "MAX"
                    : "MIN";

            parts.push(`
                SELECT
                    sc.settlement_id,
                    NULL::real AS sum_value,
                    NULL::int AS count_value,
                    ${aggregate} (sc.${column}) AS extreme_value
                FROM settlement_climate sc
                WHERE sc.year = $${base + 1}
                AND sc.month BETWEEN $${base + 2} AND $${base + 3}
                GROUP BY sc.settlement_id
            `);
        }
    }

    // Пълни години
    if (fullYears) {
        if (temp_type === "avg") {
            const base = params.length;

            params.push(
                fullYears.to,
                fullYears.from - 1
            );

            parts.push(`
                SELECT
                    settlement_id,
                    cum_sum - COALESCE(previous_sum, 0) AS sum_value,
                    cum_count - COALESCE(previous_count, 0) AS count_value,
                    NULL::real AS extreme_value
                FROM(
                    SELECT
                        current.settlement_id,
                        current.cum_sum,
                        current.cum_count,
                        previous.cum_sum AS previous_sum,
                        previous.cum_count AS previous_count
                    FROM settlement_climate_yearly_cumulative current
                    LEFT JOIN settlement_climate_yearly_cumulative previous
                        ON previous.settlement_id = current.settlement_id
                        AND previous.year = $${base + 2}
                    WHERE current.year = $${base + 1}
                ) x
            `);
        } else {
            const base = params.length;

            params.push(
                fullYears.from,
                fullYears.to
            );

            const column =
                temp_type === "max"
                    ? "max_temperature"
                    : "min_temperature";

            const aggregate =
                temp_type === "max"
                    ? "MAX"
                    : "MIN";

            parts.push(`
                SELECT
                    settlement_id,
                    NULL::real AS sum_value,
                    NULL::int AS count_value,
                    ${aggregate} (${column}) AS extreme_value
                FROM settlement_climate_yearly
                WHERE year BETWEEN $${base + 1} AND $${base + 2}
                GROUP BY settlement_id
            `);
        }
    }

    const value =
        temp_type === "avg"
            ? `SUM(x.sum_value) / NULLIF(SUM(x.count_value), 0)`
            : temp_type === "min"
                ? `MIN(x.extreme_value)`
                : `MAX(x.extreme_value)`;

    const order =
        temp_type === "min"
            ? "ASC"
            : "DESC";


    params.push(limit);

    const result = await db.query(`
        SELECT
            x.settlement_id,
            s.name,
            ${value} AS value

        FROM(
            ${parts.join("\nUNION ALL\n")}
        ) x
        JOIN settlements s ON s.id = x.settlement_id
        WHERE s.country_code = $1
        GROUP BY x.settlement_id, s.name
        ORDER BY value ${order}
        LIMIT $${params.length}
    `, params);

    return result.rows;
}


async function findYearRange() {
    const result = await db.query(`
        SELECT
            MIN(year) AS min_year,
            MAX(year) AS max_year
        FROM settlement_climate_yearly
    `);

    return result.rows[0];
}


module.exports = {
    findSummary,
    findTimeseries,
    findTopSettlements,
    findYearRange
};
