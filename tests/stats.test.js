/**
 * @jest-environment jsdom
 */

import { loadStats } from "../public/js/stats.js";
import * as api from "../public/js/api.js";

jest.mock("../public/js/api.js", () => ({
    fetchStats: jest.fn()
}));

describe("stats.js", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="stats-regions"></div>
            <div id="stats-municipalities"></div>
            <div id="stats-mayoralties"></div>
            <div id="stats-settlements"></div>
        `;

        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => { });
    });

    test("loadStats should render fetched statistics", async () => {
        api.fetchStats.mockResolvedValue({
            regions_count: 28,
            municipalities_count: 265,
            mayoralties_count: 3000,
            settlements_count: 5000
        });

        await loadStats();

        expect(api.fetchStats).toHaveBeenCalled();

        expect(document.getElementById("stats-regions").textContent).toBe("28");

        expect(document.getElementById("stats-municipalities").textContent).toBe("265");

        expect(document.getElementById("stats-mayoralties").textContent).toBe("3000");

        expect(document.getElementById("stats-settlements").textContent).toBe("5000");
    });

    test("loadStats should handle fetch error", async () => {
        api.fetchStats.mockRejectedValue(
            new Error("API failed")
        );

        await loadStats();

        expect(console.error).toHaveBeenCalledWith(
            "Грешка при зареждането на статистиката",
            expect.any(Error)
        );
    });
});