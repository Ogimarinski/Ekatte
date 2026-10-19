const QueryStream = require("pg-query-stream");
const { finished } = require("stream");
const db = require("../../db");
const { escapeLike, buildOrderBy, buildPagination } = require("./helpers/queryBuilder");
const { assertPositiveInt, assertPositiveIntArray, assertNumberInRange } = require("../utils/assert.utils");
const POSTGRES_MAX_QUERY_PARAMETERS = 65535;
const assert = require("node:assert/strict");

function buildBulkInsertPlaceholders(rowCount, columnsPerRow) {
    const placeholders = [];

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        const offset = rowIndex * columnsPerRow;

        const rowPlaceholders = [];
        for (let col = 1; col <= columnsPerRow; col++) {
            rowPlaceholders.push(`$${offset + col}`);
        }

        placeholders.push(`(${rowPlaceholders.join(", ")})`);
    }

    return placeholders.join(", ");
}

function buildSettlementFilters(filters) {
    const {
        query,
        country_code,
        region_id,
        municipality_id,
        mayorality_id,
        updated_at_from,
        updated_at_to
    } = filters;

    const whereClauses = [];
    const values = [];

    if (query) {
        values.push(`%${escapeLike(query)}%`);
        const textParam = `$${values.length}`;

        const searchConditions = [
            `s.name ILIKE ${textParam}`,
            `s.ekatte ILIKE ${textParam}`
        ];

        //ако е само число -> е geoname_id
        if (/^\d+$/.test(query)) {
            values.push(query);
            searchConditions.push(`s.geoname_id = $${values.length}`);
        }

        whereClauses.push(`(${searchConditions.join(" OR ")})`);
    }

    if (region_id !== undefined) {
        assertPositiveInt(region_id, 'region_id');
        values.push(region_id);
        whereClauses.push(`m.region_id = $${values.length}`);
    }

    if (municipality_id !== undefined) {
        assertPositiveInt(municipality_id, 'municipality_id');
        values.push(municipality_id);
        whereClauses.push(`s.municipality_id = $${values.length}`);
    }

    if (mayorality_id !== undefined) {
        assertPositiveInt(mayorality_id, 'mayorality_id');
        values.push(mayorality_id);
        whereClauses.push(`s.mayorality_id = $${values.length}`);
    }

    if (updated_at_from) {
        values.push(updated_at_from);
        whereClauses.push(`s.updated_at >= $${values.length}`);
    }

    if (updated_at_to) {
        values.push(updated_at_to);
        whereClauses.push(`s.updated_at <= $${values.length}`);
    }

    if (country_code) {
        values.push(country_code);
        whereClauses.push(`s.country_code = $${values.length}`);
    }

    const climateFilters = buildClimateFilters(filters, values);

    //Провери дали съществува поне един климатичен запис за този settlement, който отговаря на филтрите.
    if (climateFilters.length > 0) {
        whereClauses.push(`
            EXISTS (
                SELECT 1
                FROM settlement_climate_yearly scy
                WHERE scy.settlement_id = s.id
                AND ${climateFilters.join(" AND ")}
            )
        `);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    return {
        values,
        whereSql
    };
}
function buildClimateFilters(filters, values) {
    const climateFilters = [];

    if (filters.avg_temperature_from !== undefined) {
        values.push(filters.avg_temperature_from);
        climateFilters.push(`avg_temperature >= $${values.length}`);
    }

    if (filters.avg_temperature_to !== undefined) {
        values.push(filters.avg_temperature_to);
        climateFilters.push(`avg_temperature <= $${values.length}`);
    }

    if (filters.min_temperature_from !== undefined) {
        values.push(filters.min_temperature_from);
        climateFilters.push(`min_temperature >= $${values.length}`);
    }

    if (filters.min_temperature_to !== undefined) {
        values.push(filters.min_temperature_to);
        climateFilters.push(`min_temperature <= $${values.length}`);
    }

    if (filters.max_temperature_from !== undefined) {
        values.push(filters.max_temperature_from);
        climateFilters.push(`max_temperature >= $${values.length}`);
    }

    if (filters.max_temperature_to !== undefined) {
        values.push(filters.max_temperature_to);
        climateFilters.push(`max_temperature <= $${values.length}`);
    }

    return climateFilters;
}

const SETTLEMENT_SORTABLE_COLUMNS = {
    id_display: "COALESCE(s.ekatte::bigint, s.geoname_id)",
    country_code: "s.country_code",
    name: "s.name",
    region_name: "r.name",
    municipality_name: "m.name",
    mayorality_name: "ma.name",
    updated_at: "s.updated_at"
};

const CLIMATE_YEARS_SORTABLE_COLUMNS = {
    year: "year",
    avg_temperature: "avg_temperature",
    min_temperature: "min_temperature",
    max_temperature: "max_temperature"
};

function buildSettlementOrder(sort) {
    return buildOrderBy(sort, SETTLEMENT_SORTABLE_COLUMNS, "s.name ASC");
}

function buildSettlementSelect() {
    return `
        SELECT
            s.id,
            COALESCE(s.ekatte, s.geoname_id::text) AS id_display,
            s.country_code,
            s.name,
            r.name AS region_name,
            m.name AS municipality_name,
            COALESCE(ma.name, m.name) AS mayorality_name,
            s.updated_at
    `;
}

function buildSettlementBaseQuery() {
    return `
        FROM settlements s
        LEFT JOIN municipalities m
            ON s.municipality_id = m.id
        LEFT JOIN mayoralties ma
            ON s.mayorality_id = ma.id
        LEFT JOIN regions r
            ON m.region_id = r.id
    `;
}

async function streamSettlements(filters) {
    const { values, whereSql } = buildSettlementFilters(filters);
    const orderBy = buildSettlementOrder(filters.sort);

    const select = buildSettlementSelect();
    const from = buildSettlementBaseQuery();

    const client = await db.connect();

    try {
        const stream = client.query(
            new QueryStream(
                `
            ${select}
            ${from}
            ${whereSql}
            ${orderBy}
            `,
                values
            )
        );

        finished(stream, () => client.release());
        return stream;

    } catch (err) {
        client.release();
        throw err;
    }
}
async function findSettlements(filters) {
    const { page, limit, offset } = buildPagination(filters);

    const orderBy = buildSettlementOrder(filters.sort);
    const select = buildSettlementSelect();
    const from = buildSettlementBaseQuery();

    const { values, whereSql } = buildSettlementFilters(filters);

    const dataQuery = `
        ${select}
        ${from}
        ${whereSql}
        ${orderBy}
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
    `;

    const countQuery = `
        SELECT COUNT(*)
        ${from}
        ${whereSql}
    `;

    const [dataResult, countResult] = await Promise.all([
        db.query(
            dataQuery,
            [...values, limit, offset]
        ),
        db.query(
            countQuery,
            values
        )
    ]);

    return {
        results: dataResult.rows,
        count: Number(countResult.rows[0].count),
        page,
        limit
    };
}

async function findSettlementById(id) {

    assertPositiveInt(id, 'id');

    const result = await db.query(
        `
        SELECT
            s.id,
            s.ekatte,
            s.geoname_id,
            s.country_code,
            s.name,
            s.transliteration,
            s.latitude,
            s.longitude,
            ma.id AS mayorality_id,
            m.id AS municipality_id,
            m.region_id
        FROM settlements s
        LEFT JOIN mayoralties ma
            ON s.mayorality_id = ma.id
        LEFT JOIN municipalities m
            ON s.municipality_id = m.id
        WHERE s.id = $1
        `,
        [id]
    );

    return result.rows[0];
}
async function createSettlement(data) {

    assertPositiveInt(data.municipality_id, "municipality_id");

    if (data.mayorality_id !== undefined && data.mayorality_id !== null) {
        assertPositiveInt(data.mayorality_id, 'mayorality_id');
    }

    const result = await db.query(
        `
        INSERT INTO settlements(
            ekatte, 
            name, 
            municipality_id, 
            mayorality_id
        )
        Values($1, $2, $3, $4)
        Returning *
        `,
        [data.ekatte, data.name, data.municipality_id, data.mayorality_id]
    );

    return result.rows[0];
}

async function updateSettlement(id, data) {

    assertPositiveInt(id, 'id');

    const updates = [];
    const values = [];

    if (data.name !== undefined) {
        values.push(data.name);
        updates.push(`name = $${values.length} `);
    }

    if (data.municipality_id !== undefined) {
        assertPositiveInt(data.municipality_id, 'municipality_id');
        values.push(data.municipality_id);
        updates.push(`municipality_id = $${values.length} `);
    }

    if (data.mayorality_id !== undefined) {
        if (data.mayorality_id !== null) {
            assertPositiveInt(data.mayorality_id, "mayorality_id");
        }
        values.push(data.mayorality_id);
        updates.push(`mayorality_id = $${values.length} `);
    }

    assert.ok(
        updates.length > 0,
        "updateSettlement needs at least one of name, municipality_id, mayorality_id"
    );

    updates.push("updated_at = CURRENT_TIMESTAMP");

    values.push(id);

    const query =
        `
        UPDATE settlements
            SET ${updates.join(", ")}
        WHERE id = $${values.length}
        RETURNING *
        `;

    const result = await db.query(query, values);

    return result.rows[0];
}

async function deleteSettlements(ids) {

    assertPositiveIntArray(ids, 'ids');

    const result = await db.query(
        `
        Delete From settlements
        Where id = ANY($1:: int[])
        Returning id
        `,
        [ids]
    );

    return result.rows;
}

async function findMaxSettlementNumber() {
    const result = await db.query(
        `
        Select MAX(CAST(SUBSTRING(ekatte, 1, 4) AS INT)) as max
        From settlements
        `);

    return result.rows[0].max;
}

async function findAllForGeonames() {
    const result = await db.query(
        `
    SELECT
        s.id,
        s.ekatte,
        s.name,
        s.municipality_id,
        m.code AS municipality_code,
        s.transliteration,
        r.transliteration AS region_transliteration
    FROM settlements s
    JOIN municipalities m
        ON s.municipality_id = m.id
    JOIN regions r
        ON m.region_id = r.id
    ORDER BY s.id
        `
    );

    return result.rows;
}

async function updateCoordinates(id, latitude, longitude) {

    assertPositiveInt(id, 'id');
    assertNumberInRange(latitude, -90, 90, 'latitude');
    assertNumberInRange(longitude, -180, 180, 'longitude');

    const result = await db.query(
        `
        UPDATE settlements
        SET
            latitude = $1,
            longitude = $2
            WHERE id = $3
        RETURNING *
        `,
        [latitude, longitude, id]
    );

    return result.rows[0];
}

async function findCoordinatesByMunicipality(municipalityId, settlementId) {

    assertPositiveInt(municipalityId, 'municipalityId');
    assertPositiveInt(settlementId, 'settlementId');

    const result = await db.query(
        `
    SELECT
    latitude,
        longitude
        FROM settlements
        WHERE municipality_id = $1
          AND id <> $2
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
        LIMIT 1
        `,
        [municipalityId, settlementId]
    );

    const row = result.rows[0];

    if (!row) {
        return undefined;
    }

    return {
        latitude: Number(row.latitude),
        longitude: Number(row.longitude)
    };
}

async function findSettlementClimateYears(id, filters = {}) {

    assertPositiveInt(id, 'id');

    const values = [id];

    const climateFilters = buildClimateFilters(filters, values);
    let whereSql = `WHERE settlement_id = $1`;

    if (climateFilters.length > 0) {
        whereSql += `
            AND ${climateFilters.join(" AND ")}
        `;
    }

    const orderBy = buildOrderBy(filters.sort, CLIMATE_YEARS_SORTABLE_COLUMNS, "year ASC");

    const result = await db.query(
        `
        SELECT
            settlement_id,
            year,
            avg_temperature,
            min_temperature,
            max_temperature
        FROM settlement_climate_yearly
        ${whereSql}
        ${orderBy}
        `,
        values
    );

    return result.rows;
}

async function findClimateBySettlementAndYear(id, year) {

    assertPositiveInt(id, 'id');
    assertPositiveInt(year, 'year');

    const result = await db.query(
        `
    SELECT
    month,
        avg_temperature,
        min_temperature,
        max_temperature
        FROM settlement_climate
        WHERE settlement_id = $1
          AND year = $2
        ORDER BY month
        `,
        [id, year]
    );

    return result.rows;
}

async function findAllCoordinates() {
    const result = await db.query(
        `
        SELECT
        id,
        latitude,
        longitude
        FROM settlements
        WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND country_code = 'BG'
        ORDER BY id
        `
    );

    return result.rows;
}

async function createSettlementsBulk(settlements) {
    const SETTLEMENT_BULK_INSERT_COLUMN_COUNT = 6;
    const MAX_BULK_INSERT_ROWS = Math.floor(
        POSTGRES_MAX_QUERY_PARAMETERS / SETTLEMENT_BULK_INSERT_COLUMN_COUNT
    );

    if (settlements.length === 0) {
        return;
    }

    if (settlements.length > MAX_BULK_INSERT_ROWS) {
        throw new Error(
            `createSettlementsBulk received ${settlements.length} rows, max is ${MAX_BULK_INSERT_ROWS}. Chunk before calling.`
        );
    }

    const placeholders = buildBulkInsertPlaceholders(settlements.length, SETTLEMENT_BULK_INSERT_COLUMN_COUNT);

    const values = [];

    settlements.forEach((settlement) => {
        values.push(
            settlement.geonameId,
            settlement.countryCode,
            settlement.name,
            settlement.transliteration,
            settlement.latitude,
            settlement.longitude
        );
    });

    assert.equal(values.length, settlements.length * SETTLEMENT_BULK_INSERT_COLUMN_COUNT, "bulk insert values do not match placeholders");

    await db.query(
        `
        INSERT INTO settlements (
            geoname_id,
            country_code,
            name,
            transliteration,
            latitude,
            longitude
        )
        VALUES ${placeholders}
        ON CONFLICT (geoname_id) DO NOTHING
        `,
        values
    );
}

async function streamSettlementCoordinatesByCountry(countryCode) {

    const client = await db.connect();

    try {
        const stream = client.query(
            new QueryStream(
                `
                SELECT
                    id,
                    latitude,
                    longitude
                FROM settlements
                WHERE country_code = $1
                AND latitude IS NOT NULL
                AND longitude IS NOT NULL
                ORDER BY id
                `,
                [countryCode])
        );

        finished(stream, () => client.release());

        return stream;
    } catch (err) {
        client.release();
        throw err;
    }
}

async function createGridMappings(batch) {
    const GRID_MAPPING_COLUMN_COUNT = 3;
    const MAX_GRID_MAPPING_ROWS = Math.floor(
        POSTGRES_MAX_QUERY_PARAMETERS / GRID_MAPPING_COLUMN_COUNT
    );

    if (batch.length === 0) {
        return;
    }

    if (batch.length > MAX_GRID_MAPPING_ROWS) {
        throw new Error(
            `createGridMappings received ${batch.length} rows, max is ${MAX_GRID_MAPPING_ROWS}. Chunk before calling.`
        );
    }

    const placeholders = buildBulkInsertPlaceholders(batch.length, GRID_MAPPING_COLUMN_COUNT);

    const values = [];
    batch.forEach((item) => {
        values.push(item.settlementId, item.latIndex, item.lonIndex);
    });

    assert.equal(values.length, batch.length * GRID_MAPPING_COLUMN_COUNT, "bulk insert values do not match placeholders");

    await db.query(
        `
        INSERT INTO settlement_grid_mapping(
            settlement_id,
            lat_index,
            lon_index
        )
        VALUES ${placeholders}
        ON CONFLICT (settlement_id)
        DO UPDATE SET
            lat_index = EXCLUDED.lat_index,
            lon_index = EXCLUDED.lon_index
        `,
        values
    );
}

async function findSettlementGridMappingsByCountry(countryCode) {
    const result = await db.query(
        `
        SELECT
            sgm.settlement_id,
            sgm.lat_index,
            sgm.lon_index
        FROM settlement_grid_mapping sgm
        JOIN settlements s
            ON s.id = sgm.settlement_id
        WHERE s.country_code = $1
        `,
        [countryCode]
    );

    return result.rows;
}

async function createSettlementClimate(batch, client) {
    const SETTLEMENT_CLIMATE_COLUMNS = 6;
    const MAX_SETTLEMENT_CLIMATE_ROWS = Math.floor(
        POSTGRES_MAX_QUERY_PARAMETERS / SETTLEMENT_CLIMATE_COLUMNS
    );

    if (batch.length === 0) {
        return;
    }

    if (batch.length > MAX_SETTLEMENT_CLIMATE_ROWS) {
        throw new Error(
            `createSettlementClimate received ${batch.length} rows, max is ${MAX_SETTLEMENT_CLIMATE_ROWS}. Chunk before calling.`
        )
    }

    const placeholders = buildBulkInsertPlaceholders(batch.length, SETTLEMENT_CLIMATE_COLUMNS);

    const values = [];
    batch.forEach((item) => {
        values.push(
            item.settlementId,
            item.year,
            item.month,
            item.avgTemperature,
            item.minTemperature,
            item.maxTemperature
        );
    });

    assert.equal(values.length, batch.length * SETTLEMENT_CLIMATE_COLUMNS, "bulk insert values do not match placeholders");

    await client.query(
        `
        INSERT INTO settlement_climate(
            settlement_id,
            year,
            month,
            avg_temperature,
            min_temperature,
            max_temperature
        )
        VALUES ${placeholders}
        `,
        values
    );

}

module.exports = {
    streamSettlements,
    findSettlements,
    findSettlementById,
    createSettlement,
    updateSettlement,
    deleteSettlements,
    findMaxSettlementNumber,
    findAllForGeonames,
    updateCoordinates,
    findCoordinatesByMunicipality,
    findSettlementClimateYears,
    findClimateBySettlementAndYear,
    findAllCoordinates,
    createSettlementsBulk,
    streamSettlementCoordinatesByCountry,
    createGridMappings,
    findSettlementGridMappingsByCountry,
    createSettlementClimate
}