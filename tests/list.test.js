/**
 * @jest-environment jsdom
 */

import {
    loadData,
    getCurrentPage,
    getSelectedIds,
    initList
} from "../public/js/list.js";

import * as apiUtils from "../public/js/api.js";
import * as uiUtils from "../public/js/ui.js";
import * as urlUtils from "../public/js/url.js";

jest.mock("../public/js/api.js", () => ({
    fetchData: jest.fn()
}));

jest.mock("../public/js/ui.js", () => ({
    renderTable: jest.fn(),
    updateDeleteButton: jest.fn(),
    updatePageText: jest.fn()
}));

jest.mock("../public/js/url.js", () => ({
    parseUrlParams: jest.fn()
}));

describe("list.js", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        document.body.innerHTML = `
            <input id="searchInput" />

            <button id="prevPage"></button>
            <button id="nextPage"></button>

            <span id="currentPage"></span>
            <span id="totalPages"></span>
            <span id="resultsCounter"></span>

            <table>
                <tbody id="tableBody"></tbody>
            </table>

            <button id="deleteSelectedBtn"></button>
        `;

        urlUtils.parseUrlParams.mockReturnValue({
            page: 2,
            query: "Sofia"
        });

        apiUtils.fetchData.mockResolvedValue({
            count: 25,
            limit: 10,
            results: [
                { id: 1, name: "Test" }
            ]
        });
    });

    describe("loadData", () => {
        test("should load data and update UI", async () => {
            await loadData();

            expect(uiUtils.updatePageText).toHaveBeenCalled();

            expect(document.getElementById("searchInput").value).toBe("Sofia");

            expect(apiUtils.fetchData).toHaveBeenCalled();

            expect(uiUtils.renderTable).toHaveBeenCalledWith(
                [{ id: 1, name: "Test" }],
                document.getElementById("tableBody")
            );

            expect(document.getElementById("currentPage").textContent).toBe("2");

            expect(document.getElementById("resultsCounter").textContent).toBe("Резултати: 25");

            expect(uiUtils.updateDeleteButton).toHaveBeenCalled();
        });

        test("should disable prev button on first page", async () => {
            urlUtils.parseUrlParams.mockReturnValue({
                page: 1,
                query: ""
            });

            await loadData();

            expect(document.getElementById("prevPage").disabled).toBe(true);
        });

        test("should disable next button on last page", async () => {
            urlUtils.parseUrlParams.mockReturnValue({
                page: 3,
                query: ""
            });

            await loadData();

            expect(document.getElementById("nextPage").disabled).toBe(true);
        });

        test("should handle fetchData error", async () => {
            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => { });

            apiUtils.fetchData.mockRejectedValue(
                new Error("Fetch failed")
            );

            await loadData();

            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe("getCurrentPage", () => {
        test("should return current page", async () => {
            await loadData();

            expect(getCurrentPage()).toBe(2);
        });
    });

    describe("getSelectedIds", () => {
        test("should return selectedIds set", () => {
            const result = getSelectedIds();

            expect(result).toBeInstanceOf(Set);
        });
    });

    describe("initList", () => {
        test("should add popstate listener", () => {
            const addEventListenerSpy = jest.spyOn(
                window,
                "addEventListener"
            );

            initList();

            expect(addEventListenerSpy).toHaveBeenCalledWith(
                "popstate",
                expect.any(Function)
            );
        });
        test("should call loadData on popstate", async () => {
            initList();

            window.dispatchEvent(
                new Event("popstate")
            );

            await Promise.resolve();

            expect(uiUtils.updatePageText).toHaveBeenCalled();
        });
    });
});