const settlementRepository = require("./src/repositories/settlement.repository");
const settlementClimateRepository = require("./src/repositories/settlementClimate.repository");
const openMeteoService = require("./src/services/openmeteo.service");
const { processClimateData } = require("./src/utils/climate/climateProcessor");
const { sleep } = require("./src/utils/sleep");
const { groupSettlements } = require("./src/utils/climate/climateGroup");

async function run() {
    const settlements = await settlementRepository.findAllCoordinates();
    const groups = groupSettlements(settlements, 0.25);

    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const groupIndex = i + 1;
        const groupSize = group.settlements.length;

        console.log(
            `[${groupIndex}/${groups.length}] Извличане на данни за група #${groupIndex} (${groupSize} населени места)...`
        );

        try {
            const daily = await openMeteoService.fetchClimate(group);

            const monthlyClimate = processClimateData(daily);

            for (const settlement of group.settlements) {
                await settlementClimateRepository.insertClimateData(
                    settlement.id,
                    monthlyClimate
                );
            }

            await sleep(2500);
        } catch (error) {
            console.error(
                ` Грешка при обработка на група #${groupIndex}:`,
                error.message || error
            );
        }
    }
}

run().catch((err) => {
    console.error("Фатална грешка в импорт скрипта:", err);
});