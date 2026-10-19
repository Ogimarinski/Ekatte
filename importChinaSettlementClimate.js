const db = require("./db");
const settlementRepository = require("./src/repositories/settlement.repository");

function getDailyValues(data, shape, latIndex, lonIndex) {
    // shape = [брой дни, брой latitude клетки, брой longitude клетки]
    const [days, latitudeCount, longitudeCount] = shape;

    const values = [];

    for (let day = 0; day < days; day++) {
        // Преобразуваме 3D индекса [day][latitude][longitude]
        // в индекс на едномерния масив data[]
        const index =
            day * latitudeCount * longitudeCount +
            latIndex * longitudeCount +
            lonIndex;

        values.push(data[index]);
    }

    return values;
}

const BATCH_SIZE = 10000;

async function processMonth(year, month, mappings, h5wasm) {
    const monthFormatted = String(month).padStart(2, "0");
    const monthStart = Date.now();


    //"r" е read, тоест режим за четене

    const meanFile = new h5wasm.File(
        `./data/china/${year}/${monthFormatted}-mean.nc`,
        "r"
    );

    const minFile = new h5wasm.File(
        `./data/china/${year}/${monthFormatted}-min.nc`,
        "r"
    );

    const maxFile = new h5wasm.File(
        `./data/china/${year}/${monthFormatted}-max.nc`,
        "r"
    );

    const client = await db.connect();

    try {
        const fileLoadStart = Date.now();

        const meanDataset = meanFile.get("t2m");
        const minDataset = minFile.get("t2m");
        const maxDataset = maxFile.get("t2m");

        const meanData = meanDataset.value;
        const minData = minDataset.value;
        const maxData = maxDataset.value;

        const meanShape = meanDataset.shape;
        const minShape = minDataset.shape;
        const maxShape = maxDataset.shape;

        console.log(`  File load: ${Date.now() - fileLoadStart} ms`);

        const batch = [];
        let count = 0;
        let insertTime = 0;

        await client.query("BEGIN");

        for await (const mapping of mappings) {
            //const settlementStart = Date.now();

            const meanValues = getDailyValues(
                meanData,
                meanShape,
                mapping.lat_index,
                mapping.lon_index
            );

            const minValues = getDailyValues(
                minData,
                minShape,
                mapping.lat_index,
                mapping.lon_index
            );

            const maxValues = getDailyValues(
                maxData,
                maxShape,
                mapping.lat_index,
                mapping.lon_index
            );

            const avgTemperature = meanValues.reduce((sum, value) => sum + value, 0) / meanValues.length;

            const minTemperature = Math.min(...minValues);

            const maxTemperature = Math.max(...maxValues);

            const avgTemperatureC = Number((avgTemperature - 273.15).toFixed(2));

            const minTemperatureC = Number((minTemperature - 273.15).toFixed(2));

            const maxTemperatureC = Number((maxTemperature - 273.15).toFixed(2));

            batch.push({
                settlementId: mapping.settlement_id,
                year: year,
                month: month,
                avgTemperature: avgTemperatureC,
                minTemperature: minTemperatureC,
                maxTemperature: maxTemperatureC
            });

            count++;

            if (count % 10000 === 0) {
                console.log("Processed:", count);
            }

            if (batch.length === BATCH_SIZE) {
                const insertStart = Date.now();
                await settlementRepository.createSettlementClimate(batch, client);
                insertTime += Date.now() - insertStart;
                batch.length = 0;
            }
            /*console.log(
                `Settlement ${mapping.settlement_id}: ${Date.now() - settlementStart} ms`
            );*/
        }
        if (batch.length > 0) {
            const insertStart = Date.now();
            await settlementRepository.createSettlementClimate(batch, client);
            insertTime += Date.now() - insertStart;
        }

        await client.query("COMMIT");

        console.log(`  Insert total: ${insertTime} ms`);
        console.log(`  Month total: ${Date.now() - monthStart} ms`);

    } catch (err) {
        await client.query("ROLLBACK");

        console.error(err);
        throw err;
    } finally {
        meanFile.close();
        minFile.close();
        maxFile.close();
        client.release();
    }
}

async function run() {
    const h5wasm = await import("h5wasm/node");
    await h5wasm.ready;

    const mappings = await settlementRepository.findSettlementGridMappingsByCountry("CN");

    console.log(`Loaded ${mappings.length} mappings`);

    for (let year = 2021; year <= 2025; year++) {
        for (let month = 1; month <= 12; month++) {
            console.log(`Processing ${year}-${month}`);

            await processMonth(year, month, mappings, h5wasm);
        }
    }
}

run().catch(console.error);