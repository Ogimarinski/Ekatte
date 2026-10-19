// Създава мапинг между селищата и най-близката климатична клетка.

const settlementRepository = require("./src/repositories/settlement.repository");

function findClosestIndex(values, target) {
    let closestIndex = 0;
    let smallestDiference = Infinity;

    for (let index = 0; index < values.length; index++) {
        const difference = Math.abs(values[index] - target);

        if (difference < smallestDiference) {
            smallestDiference = difference;
            closestIndex = index;
        }
    }

    return closestIndex;
}

function findNearestValidCell(data, shape, latIndex, lonIndex, maxRadius = 5) {
    // shape e [брой дни, брой latitude клетки, брой longitude клетки]
    const [, latCount, lonCount] = shape;

    for (let radius = 0; radius <= maxRadius; radius++) {
        for (let dLat = -radius; dLat <= radius; dLat++) {
            for (let dLon = -radius; dLon <= radius; dLon++) {

                const lat = latIndex + dLat;
                const lon = lonIndex + dLon;

                if (lat < 0 || lat >= latCount || lon < 0 || lon >= lonCount) {
                    continue;
                }

                const index =
                    lat * lonCount +
                    lon;

                if (!Number.isNaN(data[index])) {
                    return {
                        latIndex: lat,
                        lonIndex: lon
                    };
                }
            }
        }
    }

    return {
        latIndex,
        lonIndex
    };
}

const BATCH_SIZE = 1000;

async function run() {
    const h5wasm = await import("h5wasm/node");
    await h5wasm.ready;

    const f = new h5wasm.File(
        "./data/china/2021/01-mean.nc",
        "r"
    );
    const temperatures = f.get("t2m");
    const temperaturesValue = temperatures.value;
    const temperaturesShape = temperatures.shape;

    const lat = f.get("latitude");
    const lon = f.get("longitude");


    const settlements = await settlementRepository.streamSettlementCoordinatesByCountry("CN");

    let count = 0;

    const batch = [];

    for await (const settlement of settlements) {
        let latIndex = findClosestIndex(
            lat.value,
            Number(settlement.latitude)
        );

        let lonIndex = findClosestIndex(
            lon.value,
            Number(settlement.longitude)
        );

        const validCell = findNearestValidCell(
            temperaturesValue,
            temperaturesShape,
            latIndex,
            lonIndex
        );

        latIndex = validCell.latIndex;
        lonIndex = validCell.lonIndex;


        batch.push({
            settlementId: settlement.id,
            latIndex,
            lonIndex
        });


        if (batch.length === BATCH_SIZE) {
            await settlementRepository.createGridMappings(batch);
            batch.length = 0;
        }

        count++;

        if (count % 10000 === 0) {
            console.log("Processed:", count);
        }

    }

    if (batch.length > 0) {
        await settlementRepository.createGridMappings(batch);
    }

    console.log("Total processed:", count);

    f.close();
}

run().catch(console.error);