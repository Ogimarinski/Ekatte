const QueryStream = require("pg-query-stream");
const { finished } = require("stream");
const db = require("../../db");
const { escapeLike, buildOrderBy, buildPagination } = require("./helpers/queryBuilder");
const { assertPositiveInt, assertPositiveIntArray } = require("../utils/assert.utils");

function buildRegionsFilters(filters) {
    const { query, id, updated_at_from, updated_at_to } = filters;

    const whereClauses = [];
    const values = [];

    if (query) {
        values.push(`%${escapeLike(query)}%`);
        whereClauses.push(`(r.name ILIKE $${values.length} OR r.code ILIKE $${values.length})`);
    }

    if (id !== undefined) {
        values.push(id);
        whereClauses.push(`r.id = $${values.length}`);
    }

    if (updated_at_from) {
        values.push(updated_at_from);
        whereClauses.push(`r.updated_at >= $${values.length}`);
    }

    if (updated_at_to) {
        values.push(updated_at_to);
        whereClauses.push(`r.updated_at <= $${values.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    return {
        values,
        whereSql
    };
}

const REGION_SORTABLE_COLUMNS = Object.freeze({
    id: "r.id",
    code: "r.code",
    name: "r.name",
    updated_at: "r.updated_at"
});

function buildRegionsOrder(sort) {
    return buildOrderBy(sort, REGION_SORTABLE_COLUMNS, "r.name ASC");
}

function buildRegionSelect() {
    return `
        SELECT
            r.id,
            r.code,
            r.name,
            r.updated_at
    `;
}

function buildRegionBaseQuery() {
    return `
        From regions r
    `;
}

async function streamRegions(filters) {
    const { values, whereSql } = buildRegionsFilters(filters);
    const orderBy = buildRegionsOrder(filters.sort);
    const select = buildRegionSelect();
    const from = buildRegionBaseQuery();

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

async function findRegions(filters) {
    const { page, limit, offset } = buildPagination(filters);
    const { values, whereSql } = buildRegionsFilters(filters);

    const orderBy = buildRegionsOrder(filters.sort);
    const select = buildRegionSelect();
    const from = buildRegionBaseQuery();

    const dataQuery = `
        ${select}
        ${from}
        ${whereSql}
        ${orderBy}
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
    `;

    const countQuery = `
        SELECT COUNT(*) AS count
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

async function findRegionById(id) {

    assertPositiveInt(id, 'id');

    const result = await db.query(
        `
        SELECT id, code, name, updated_at
        From regions
        Where id = $1
        `, [id]
    );

    return result.rows[0];
}

async function createRegion(data) {
    const result = await db.query(
        `
        Insert INTO regions(name, code)
        Values ($1, $2)
        Returning *
        `, [data.name, data.code]
    );

    return result.rows[0];
}

async function updateRegion(id, data) {

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
        UPDATE regions
        SET ${updates.join(", ")}
        WHERE id = $${values.length}
        RETURNING *
    `;

    const result = await db.query(query, values);

    return result.rows[0];
}

async function deleteRegions(ids) {

    assertPositiveIntArray(ids, 'ids');

    const result = await db.query(
        `
        Delete From regions
        Where id = Any($1::int[])
        Returning id
        `, [ids]
    );

    return result.rows;
}

async function findRegionOptions() {
    const result = await db.query(
        `
        SELECT
            r.id,
            r.name
        FROM regions r
        `
    );

    return result.rows;
}


module.exports = {
    streamRegions,
    findRegions,
    findRegionById,
    createRegion,
    updateRegion,
    deleteRegions,
    findRegionOptions
}