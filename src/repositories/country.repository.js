const db = require("../../db");

async function findAll() {
    const result = await db.query(`SELECT code, name FROM countries ORDER BY name`);
    return result.rows;
}

module.exports = { findAll };