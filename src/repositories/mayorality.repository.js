const QueryStream = require("pg-query-stream");
const { finished } = require("stream");
const db = require("../../db");
const { escapeLike, buildOrderBy, buildPagination } = require("./helpers/queryBuilder");
const { assertPositiveInt, assertPositiveIntArray, assertObject, assertValidDate } = require("../utils/assert.utils");

function assertMayoralityFilters(filters) {
    assertObject(filters, 'filters');

    const {
        id,
        municipality_id,
        updated_at_from,
        updated_at_to
    } = filters;

    if (id !== undefined) {
        assertPositiveInt(id, 'id');
    }

    if (municipality_id !== undefined) {
        assertPositiveInt(municipality_id, 'municipality_id');
    }

    if (updated_at_from !== undefined) {
        assertValidDate(updated_at_from, 'updated_at_from');
    }

    if (updated_at_to !== undefined) {
        assertValidDate(updated_at_to, 'updated_at_to');
    }

}

function assertCreateMayoralityData(data) {
    assertObject(data, "data");

    assert.ok(
        data.name !== undefined,
        "data.name is required"
    );

    assert.ok(
        data.code !== undefined,
        "data.code is required"
    );

    assertPositiveInt(
        data.municipality_id,
        "data.municipality_id"
    );
}

function assertUpdateMayoralityData(data) {
    assertObject(data, "data");

    assert.ok(
        data.name !== undefined || data.code !== undefined,
        "At least one field must be provided for update"
    );
}

function buildMayoralityFitlers(filters) {

    assertMayoralityFilters(filters);

    const { query, id, municipality_id, updated_at_from, updated_at_to } = filters;

    const whereClauses = [];
    const values = [];

    if (query) {
        values.push(`%${escapeLike(query)}%`);
        whereClauses.push(`(ma.name ILIKE $${values.length} OR ma.code ILIKE $${values.length})`);
    }

    if (id !== undefined) {
        values.push(id);
        whereClauses.push(`ma.id = $${values.length}`);
    }

    if (municipality_id !== undefined) {
        assertPositiveInt(municipality_id, 'municipality_id');
        values.push(municipality_id);
        whereClauses.push(`ma.municipality_id=$${values.length}`);
    }

    if (updated_at_from) {
        values.push(updated_at_from);
        whereClauses.push(`ma.updated_at >= $${values.length}`);
    }

    if (updated_at_to) {
        values.push(updated_at_to);
        whereClauses.push(`ma.updated_at <= $${values.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    return {
        values,
        whereSql
    };
}

const MAYORALITY_SORTABLE_COLUMNS = {
    id: "ma.id",
    code: "ma.code",
    name: "ma.name",
    municipality_name: "m.name",
    updated_at: "ma.updated_at"
};

function buildMayoralitiesOrder(sort) {
    return buildOrderBy(sort, MAYORALITY_SORTABLE_COLUMNS, "ma.name ASC");
}

function buildMayoralitySelect() {
    return `
        SELECT
            ma.id,
            ma.code,
            ma.name,
            m.name AS municipality_name,
            ma.updated_at
    `;
}

function buildMayoralityBaseQuery() {
    return `
        FROM mayoralties ma 
        Join municipalities m ON ma.municipality_id = m.id
    `;
}

async function streamMayoralities(filters) {
    assertMayoralityFilters(filters);
    const { values, whereSql } = buildMayoralityFitlers(filters);
    const orderBy = buildMayoralitiesOrder(filters.sort);

    const select = buildMayoralitySelect();
    const from = buildMayoralityBaseQuery();

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

async function findMayoralities(filters) {
    assertMayoralityFilters(filters);
    const { page, limit, offset } = buildPagination(filters);

    const { values, whereSql } = buildMayoralityFitlers(filters);
    const orderBy = buildMayoralitiesOrder(filters.sort);
    const select = buildMayoralitySelect();
    const from = buildMayoralityBaseQuery();

    const dataQuery = `
        ${select}
        ${from}
        ${whereSql}
        ${orderBy}
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
    `;


    const countQuery = `
        SELECT COUNT(ma.id) AS count
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

async function findMayoralityById(id) {

    assertPositiveInt(id, 'id');

    const result = await db.query(
        `
        Select ma.code, ma.name, ma.municipality_id, m.region_id
        From mayoralties ma
        Join municipalities m ON ma.municipality_id = m.id
        Where ma.id = $1
        `, [id]
    );

    return result.rows[0];
}

async function createMayorality(data) {
    assertCreateMayoralityData(data);
    const result = await db.query(
        `
        Insert INTO mayoralties(name, code, municipality_id)
        Values ($1, $2, $3)
        Returning *
        `, [data.name, data.code, data.municipality_id]
    );

    return result.rows[0];
}

async function updateMayorality(id, data) {

    assertPositiveInt(id, 'id');
    assertUpdateMayoralityData(data);

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
        Update mayoralties
        Set ${updates.join(", ")}
        Where id = $${values.length}
        Returning *
        `;

    const result = await db.query(query, values);

    return result.rows[0];
}

async function deleteMayoralties(ids) {

    assertPositiveIntArray(ids, 'ids');

    const result = await db.query(
        `
        Delete from mayoralties
        Where id = ANY($1::int[])
        Returning id
        `, [ids]
    );

    return result.rows;
}

async function findMaxMayoralityNumber(munId) {

    assertPositiveInt(munId, 'munId');

    const result = await db.query(
        `
        Select MAX(CAST(SUBSTRING(code, 7, 2) AS INT)) AS max
        From mayoralties
        Where municipality_id = $1
        `, [munId]
    );

    return result.rows[0].max;
}

function buildMayoralityOptionsFilter(filters) {
    assertMayoralityFilters(filters);
    const { municipality_id } = filters;

    const values = [];
    let whereSql = "";

    if (municipality_id) {
        values.push(municipality_id);
        whereSql = "WHERE m.municipality_id = $1";
    }

    return { values, whereSql };
}

async function findMayoralityOptions(filters) {
    assertMayoralityFilters(filters);
    const { values, whereSql } = buildMayoralityOptionsFilter(filters);

    const result = await db.query(
        `
        SELECT
            m.id,
            m.name
        FROM mayoralties m
        ${whereSql}
        ORDER BY m.name
        `,
        values
    );

    return result.rows;
}

module.exports = {
    streamMayoralities,
    findMayoralities,
    findMayoralityById,
    createMayorality,
    updateMayorality,
    deleteMayoralties,
    findMaxMayoralityNumber,
    findMayoralityOptions
}