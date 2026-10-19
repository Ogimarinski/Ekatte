require("dotenv").config();

const settlementService = require("./src/services/settlement.service");

async function run() {
    await settlementService.enrichSettlementsWithCoordinates();

    console.log("GeoNames import completed.");
}

run().catch(console.error);