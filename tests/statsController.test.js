const { getStats } = require("../src/http/controllers/stats.controller");
const statsService = require("../src/services/stats.service");

jest.mock("../src/services/stats.service");

function mockResponse() {
    return {
        writeHead: jest.fn(),
        end: jest.fn()
    };
}

test("should return stats", async () => {
    statsService.getStatsData.mockResolvedValue({
        regions_count: 1,
        municipalities_count: 2,
        mayoralties_count: 3,
        settlements_count: 4
    });

    const res = mockResponse();

    await getStats({}, res);

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
    expect(res.end).toHaveBeenCalledWith(
        JSON.stringify({
            regions_count: 1,
            municipalities_count: 2,
            mayoralties_count: 3,
            settlements_count: 4
        })
    );
});

test("should return 500 if db query fails", async () => {
    statsService.getStatsData.mockRejectedValue(
        new Error("Service failed")
    );

    const res = mockResponse();

    await getStats({}, res);

    expect(res.writeHead).toHaveBeenCalledWith(500, expect.any(Object));
    expect(res.end).toHaveBeenCalledWith(
        JSON.stringify({
            error: "Service failed"
        })
    );
});