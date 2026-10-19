const db = require('../../db');

async function findStats() {
    const result = await db.query(`
            SELECT
                (SELECT COUNT(*) FROM regions) as regions_count,
                (SELECT COUNT(*) FROM municipalities) as municipalities_count,
                (SELECT COUNT(*) FROM mayoralties) as mayoralties_count,
                (SELECT COUNT(*) FROM settlements) as settlements_count
        `);

    return result.rows[0];
}

module.exports = { findStats };