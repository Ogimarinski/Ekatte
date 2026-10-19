function groupSettlements(settlements, gridSize = 0.25) {

    const groups = new Map();

    for (const settlement of settlements) {
        const latFixed = (
            Math.round(settlement.latitude / gridSize) * gridSize
        ).toFixed(2);

        const lonFixed = (
            Math.round(settlement.longitude / gridSize) * gridSize
        ).toFixed(2);

        const key = `${latFixed}_${lonFixed}`;

        if (!groups.has(key)) {
            groups.set(key, {
                latitude: Number(latFixed),
                longitude: Number(lonFixed),
                settlements: []
            });
        }

        groups.get(key).settlements.push(settlement);
    }

    return [...groups.values()];
}

module.exports = { groupSettlements };