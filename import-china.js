require("dotenv").config();

const settlementService = require("./src/services/settlement.service");

async function run() {
    await settlementService.importChineseSettlements();

    console.log("Chinese settlements import completed.");
}

run().catch(console.error);