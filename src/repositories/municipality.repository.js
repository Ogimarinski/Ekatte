const QueryStream = require("pg-query-stream");
const { finished } = require("stream");
const db = require("../../db");
const { escapeLike, buildOrderBy, buildPagination } = require("./helpers/queryBuilder");
const { assertPositiveInt, assertPositiveIntArray } = require("../utils/assert.utils");

function buildMunicipalitiesFilters(filters) {
    const { query, id, region_id, updated_at_from, updated_at_to } = filters;

    const whereClauses = [];
    const values = [];

    if (query) {
        values.push(`%${escapeLike(query)}%`);
        whereClauses.push(`(m.name ILIKE $${values.length} OR m.code ILIKE $${values.length})`);
    }

    if (id !== undefined) {
        values.push(id);
        whereClauses.push(`m.id = $${values.length}`);
    }

    if (region_id !== undefined) {
        values.push(region_id);
        whereClauses.push(`m.region_id = $${values.length}`);
    }

    if (updated_at_from) {
        values.push(updated_at_from);
        whereClauses.push(`m.updated_at >= $${values.length}`);
    }

    if (updated_at_to) {
        values.push(updated_at_to);
        whereClauses.push(`m.updated_at <= $${values.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    return {
        values,
        whereSql
    };

}

const MUNICIPALITY_SORTABLE_COLUMNS = Object.freeze({
    id: "m.id",
    code: "m.code",
    name: "m.name",
    region_id: "m.region_id",
    region_name: "r.name",
    updated_at: "m.updated_at"
});

function buildMunicipalitiesOrder(sort) {
    return buildOrderBy(sort, MUNICIPALITY_SORTABLE_COLUMNS, "m.name ASC");
}

function buildMunicipalitySelect() {
    return `
        SELECT
            m.id,
            m.code,
            m.name,
            r.name AS region_name,
            m.updated_at
    `;
}

function buildMunicipalityBaseQuery() {
    return `
        FROM municipalities m
        Join regions r ON r.id = m.region_id
    `;
}

async function streamMunicipalities(filters) {
    const { values, whereSql } = buildMunicipalitiesFilters(filters);
    const orderBy = buildMunicipalitiesOrder(filters.sort);
    const select = buildMunicipalitySelect();
    const from = buildMunicipalityBaseQuery();

    const client = await db.connect();

    const stream = client.query(
        new QueryStream(
            `
            ${select}
            ${from}
            ${whereSql}
            ${orderBy}
            `, values
        )
    );

    finished(stream, () => client.release());

    return stream;
}

async function findMunicipalities(filters) {

    const { page, limit, offset } = buildPagination(filters);

    const { values, whereSql } = buildMunicipalitiesFilters(filters);
    const orderBy = buildMunicipalitiesOrder(filters.sort);
    const select = buildMunicipalitySelect();
    const from = buildMunicipalityBaseQuery();

    const dataQuery = `
        ${select}
        ${from}
        ${whereSql}
        ${orderBy}
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
    `;

    const countQuery = `
        SELECT COUNT(m.id) AS count
        ${from}
        ${whereSql}
    `;

    const [dataResult, countResult] = await Promise.all([
        db.query(dataQuery, [...values, limit, offset]),
        db.query(countQuery, values)
    ]);

    return {
        results: dataResult.rows,
        count: Number(countResult.rows[0].count),
        page,
        limit
    };
}

async function findMunicipalityById(id) {

    assertPositiveInt(id, 'id');

    const result = await db.query(
        `
        SELECT m.id, m.code, m.name, r.name AS region_name, m.region_id, m.updated_at
        From municipalities m
        Join regions r ON r.id = m.region_id
        Where m.id = $1
        `, [id]
    );

    return result.rows[0];
}

async function createMunicipality(data) {
    const result = await db.query(
        `
        Insert INTO municipalities(name, code, region_id)
        Values ($1, $2, $3)
        Returning *
        `, [data.name, data.code, data.region_id]
    );

    return result.rows[0];
}

async function updateMunicipality(id, data) {

    assertPositiveInt(id, 'id');

    const updates = [];
    const values = [];

    if (data.name !== undefined) {
        values.push(data.name);
        updates.push(`name = $${values.length}`);
    }

    if (data.code !== undefined) {
        values.push(data.code);
        updates.push(`code = $${values.length}`);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");

    values.push(id);

    const query = `
        UPDATE municipalities
        SET ${updates.join(", ")}
        WHERE id = $${values.length}
        RETURNING *
    `;

    const result = await db.query(query, values);

    return result.rows[0];

}

async function deleteMunicipalities(ids) {

    assertPositiveIntArray(ids, 'ids');

    const result = await db.query(
        `
        Delete From municipalities
        Where id = ANY($1::int[])
        Returning id
        `, [ids]
    );

    return result.rows;
}

async function findMaxMunicipalityNumber(regionId) {

    assertPositiveInt(regionId, 'regionId');

    const result = await db.query(
        `
        SELECT MAX(CAST(SUBSTRING(code, 4, 2) AS INT)) AS max
        FROM municipalities
        WHERE region_id = $1
        `, [regionId]
    );

    return result.rows[0].max;
}

function buildMunicipalityOptionsFilter(filters) {
    const { region_id } = filters;

    const values = [];
    let whereSql = "";

    if (region_id) {
        values.push(region_id);
        whereSql = 'WHERE m.region_id = $1';
    }

    return { values, whereSql };
}

async function findMunicipalityOptions(filters) {
    const { values, whereSql } = buildMunicipalityOptionsFilter(filters);

    const result = await db.query(
        `
        SELECT 
            m.id,
            m.name
        FROM municipalities m
        ${whereSql}
        ORDER BY m.name
        `, values
    );

    return result.rows;
}

module.exports = {
    streamMunicipalities,
    findMunicipalities,
    findMunicipalityById,
    createMunicipality,
    updateMunicipality,
    deleteMunicipalities,
    findMaxMunicipalityNumber,
    findMunicipalityOptions
};