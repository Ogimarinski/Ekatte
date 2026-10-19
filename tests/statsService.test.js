const db = require("../db");
const { getStatsData } = require("../src/services/stats.service");

jest.mock("../db");

test("should return stats from db", async () => {
    db.query.mockResolvedValue({
        rows: [{
            regions_count: 1,
            municipalities_count: 2,
            mayoralties_count: 3,
            settlements_count: 4
        }]
    });

    const result = await getStatsData();
    expect(db.query).toHaveBeenCalled();
    expect(result).toEqual({
        regions_count: 1,
        municipalities_count: 2,
        mayoralties_count: 3,
        settlements_count: 4
    });
});

test("should throw error if db fails", async () => {
    db.query.mockRejectedValue(new Error("Db failed"));

    await expect(getStatsData()).rejects.toThrow("Db failed");
});