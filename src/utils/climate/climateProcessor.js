function extractDailyRecords(daily) {
    return daily.time.map((date, index) => ({
        date,
        mean: daily.temperature_2m_mean[index],
        min: daily.temperature_2m_min[index],
        max: daily.temperature_2m_max[index]
    }));
}

function groupByYearMonth(records) {
    const groups = new Map();

    for (const record of records) {
        const date = new Date(record.date);

        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        const key = `${year}-${month}`;

        if (!groups.has(key))
            groups.set(key, []);

        groups.get(key).push(record);
    }

    return groups;
}

function calculateMonthlyStats(group) {
    const result = [];

    for (const [key, records] of group) {
        const [year, month] = key.split("-").map(Number);

        const avgTemperature = records.reduce((sum, r) => sum + r.mean, 0) / records.length;

        const minTemperature = Math.min(...records.map(r => r.min));

        const maxTemperature = Math.max(...records.map(r => r.max));

        result.push({
            year,
            month,
            avg_temperature: Number(avgTemperature.toFixed(2)),
            min_temperature: minTemperature,
            max_temperature: maxTemperature
        });
    }

    return result;
}


function processClimateData(daily) {
    const records = extractDailyRecords(daily);

    const groups = groupByYearMonth(records);

    return calculateMonthlyStats(groups);
}

module.exports = { processClimateData };