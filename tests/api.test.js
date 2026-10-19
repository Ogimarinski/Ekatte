/**
 * @jest-environment jsdom
 */


//Изпълни този тест така, сякаш работи в браузър.

import {
    fetchData,
    fetchStats,
    deleteItems,
    createItem,
    updateItem,
    fetchOptions,
    fetchOne,
    fetchSettlementClimateMonths,
    fetchSettlementClimateYears,
    fetchCountries,
    fetchClimateSummary,
    fetchClimateTimeseries,
    fetchTopSettlements,
    fetchYearRange
} from "../public/js/api.js";

import { parseUrlParams } from "../public/js/url.js";
import { authFetch } from "../public/js/auth/auth.api.js";

jest.mock("../public/js/url.js");
jest.mock("../public/js/auth/auth.api.js", () => ({
    authFetch: jest.fn()
}));

describe("API module", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        parseUrlParams.mockReturnValue({
            view: "settlements",
            page: 1,
            query: "",
            sort: []
        });
    });

    const mockFetchSuccess = (data) => {
        authFetch.mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue(data)
        });
    };

    const mockFetchError = (status, data) => {
        authFetch.mockResolvedValueOnce({
            ok: false,
            status,
            json: jest.fn().mockResolvedValue(data)
        });
    };

    describe("handleResponse", () => {
        test("should throw error message from JSON", async () => {
            mockFetchError(400, { error: "Error" });
            await expect(fetchStats()).rejects.toThrow("Error");
        });

        test("should use default error message", async () => {
            mockFetchError(500, {});
            await expect(fetchStats()).rejects.toThrow("Request failed");
        });

        test("should throw when success JSON parsing fails", async () => {
            authFetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockRejectedValue(new Error("Invalid JSON"))
            });

            await expect(fetchStats()).rejects.toThrow("Invalid JSON response");
        });
    })

    describe("Api functions", () => {
        test("fetchData builds correct url with encoded params", async () => {
            mockFetchSuccess([]);

            await fetchData();

            const url = new URL(authFetch.mock.calls[0][0], "http://localhost");

            const page = Number(url.searchParams.get("page"));
            const limit = Number(url.searchParams.get("limit"));
            expect(url.pathname).toBe("/api/settlements");
            expect(page).toBeGreaterThan(0);

            expect(limit).toBeGreaterThan(0);
            expect(limit).toBeLessThanOrEqual(100);

            expect(url.searchParams.has("query")).toBe(true);
        });

        test("fectData builds correct url and adds sort params", async () => {
            parseUrlParams.mockReturnValue({
                view: "settlements",
                page: 1,
                query: "",
                sort: [{ key: "name", order: "asc" }]
            });

            mockFetchSuccess([]);

            await fetchData();

            const url = new URL(authFetch.mock.calls[0][0], "http://localhost");

            expect(url.searchParams.get("sort")).toBe("name:asc");
        });

        test("fetchStats calls correct endpoint", async () => {
            mockFetchSuccess({ count: 10 });
            const res = await fetchStats();
            expect(authFetch).toHaveBeenCalledWith("/api/stats");
            expect(res).toEqual({ count: 10 });
        });

        test("deleteItems sends DELETE request with body", async () => {
            mockFetchSuccess({ success: true });
            const ids = [1, 2];
            const res = await deleteItems("regions", ids);

            expect(authFetch).toHaveBeenCalledWith(
                "/api/regions",
                expect.objectContaining({
                    method: "DELETE",
                    body: JSON.stringify({ ids })
                })
            );

            expect(res).toEqual({ success: true });
        });

        test("createItem sends POST with payload", async () => {
            mockFetchSuccess({ id: 5 });
            const payload = { name: "Sofia" };
            const res = await createItem("regions", payload);

            expect(authFetch).toHaveBeenCalledWith("/api/regions", expect.objectContaining({
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload)
            }));

            expect(res).toEqual({ id: 5 });
        });

        test("updateItem sends PUT to specific ID", async () => {
            mockFetchSuccess({ id: 1 });
            const payload = { name: "Vratsa" };
            const res = await updateItem("regions", 1, payload);

            expect(authFetch).toHaveBeenCalledWith("/api/regions/1", expect.objectContaining({
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload)
            }));

            expect(res).toEqual({ id: 1 });
        });

        test("fetchOptions handles Url without parent param", async () => {
            mockFetchSuccess([]);

            const res = await fetchOptions("regions");
            const url = new URL(authFetch.mock.calls[0][0], "http://localhost");

            expect(url.pathname).toBe("/api/regions/options");

            expect(res).toEqual([]);
        });

        test("fetchOptions handles Url with parent param", async () => {
            mockFetchSuccess([]);

            const res = await fetchOptions(
                "municipalities",
                "123",
                "region_id"
            );
            const url = new URL(authFetch.mock.calls[0][0], "http://localhost");

            expect(url.pathname).toBe("/api/municipalities/options");

            expect(url.searchParams.has("region_id")).toBe(true);
            expect(url.searchParams.get("region_id")).toBe("123");

            expect(res).toEqual([]);
        });

        test("fetchOne calls specific resource ID", async () => {
            mockFetchSuccess({ id: 2 });
            const res = await fetchOne("settlements", 2);
            expect(authFetch).toHaveBeenCalledWith("/api/settlements/2");
            expect(res).toEqual({ id: 2 });
        });

        test("fetchSettlementClimateMonths", async () => {
            const climate = [
                {
                    month: 1,
                    avg_temperature: "4.73",
                    min_temperature: "-3.60",
                    max_temperature: "18.40"
                }
            ];

            mockFetchSuccess(climate);

            const res = await fetchSettlementClimateMonths(10553, 2025);

            expect(authFetch).toHaveBeenCalledWith("/api/settlements/10553/climate/2025");

            expect(res).toEqual(climate);
        });

        test("fetchSettlementClimateYears", async () => {
            parseUrlParams.mockReturnValue({
                avg_temperature_from: 5,
                avg_temperature_to: 7
            });

            const years = [
                {
                    year: 2025,
                    average_temperature: "12.4"
                }
            ];

            mockFetchSuccess(years);

            const res = await fetchSettlementClimateYears(10553);

            const url = new URL(authFetch.mock.calls[0][0], "http://localhost");

            expect(url.pathname).toBe(
                "/api/settlements/10553/climate-years"
            );

            expect(url.searchParams.get("avg_temperature_from")).toBe("5");
            expect(url.searchParams.get("avg_temperature_to")).toBe("7");

            expect(res).toEqual(years);
        });

        test("fetchCountries calls correct endpoint", async () => {
            const countries = [{ id: 1, name: "Bulgaria" }];

            mockFetchSuccess(countries);

            const res = await fetchCountries();

            expect(authFetch).toHaveBeenCalledWith("/api/countries");
            expect(res).toEqual(countries);
        });

        test("fetchClimateSummary builds correct url with params", async () => {
            const summary = { avg_temperature: "12.4" };

            mockFetchSuccess(summary);

            const res = await fetchClimateSummary({ year: 2025, month: 1 });

            const url = new URL(authFetch.mock.calls[0][0], "http://localhost");

            expect(url.pathname).toBe("/api/climate/summary");
            expect(url.searchParams.get("year")).toBe("2025");
            expect(url.searchParams.get("month")).toBe("1");

            expect(res).toEqual(summary);
        });

        test("fetchClimateTimeseries builds correct url with params", async () => {
            const timeseries = [{ year: 2025, average_temperature: "12.4" }];

            mockFetchSuccess(timeseries);

            const res = await fetchClimateTimeseries({ settlementId: 10553 });

            const url = new URL(authFetch.mock.calls[0][0], "http://localhost");

            expect(url.pathname).toBe("/api/climate/timeseries");
            expect(url.searchParams.get("settlementId")).toBe("10553");

            expect(res).toEqual(timeseries);
        });

        test("fetchTopSettlements builds correct url with params", async () => {
            const topSettlements = [{ id: 1, name: "Sofia" }];

            mockFetchSuccess(topSettlements);

            const res = await fetchTopSettlements({ limit: 5 });

            const url = new URL(authFetch.mock.calls[0][0], "http://localhost");

            expect(url.pathname).toBe("/api/climate/top-settlements");
            expect(url.searchParams.get("limit")).toBe("5");

            expect(res).toEqual(topSettlements);
        });

        test("fetchYearRange requests correct url", async () => {
            const range = { min_year: 2005, max_year: 2025 };

            mockFetchSuccess(range);

            const res = await fetchYearRange();

            const url = new URL(authFetch.mock.calls[0][0], "http://localhost");

            expect(url.pathname).toBe("/api/climate/year-range");
            expect(res).toEqual(range);
        });

    });

});
