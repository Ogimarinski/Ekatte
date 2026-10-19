const db = require("../../db");

async function insertClimateData(settlementId, climateData) {

    if (climateData.length === 0) {
        return;
    }

    const values = [];
    const placeholders = [];


    for (const climate of climateData) {
        const index = values.length;

        placeholders.push(
            `($${index + 1}, $${index + 2}, $${index + 3}, $${index + 4}, $${index + 5}, $${index + 6})`
        );

        values.push(
            settlementId,
            climate.year,
            climate.month,
            climate.avg_temperature,
            climate.min_temperature,
            climate.max_temperature
        );
    }

    const query = `
        INSERT INTO settlement_climate (
            settlement_id,
            year,
            month,
            avg_temperature,
            min_temperature,
            max_temperature
        )
        VALUES ${placeholders.join(",")}
        ON CONFLICT (settlement_id, year, month)
        DO UPDATE SET
            avg_temperature = EXCLUDED.avg_temperature,
            min_temperature = EXCLUDED.min_temperature,
            max_temperature = EXCLUDED.max_temperature
    `;

    await db.query(query, values);
}

module.exports = {
    insertClimateData
};