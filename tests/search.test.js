/**
 * @jest-environment jsdom
 */

import { initSearch } from "../public/js/search.js";
import * as urlUtils from "../public/js/url.js";

jest.mock("../public/js/url.js", () => ({
    parseUrlParams: jest.fn(),
    updateUrlParams: jest.fn()
}));

describe("search.js", () => {
    let searchInput;
    let loadData;

    beforeEach(() => {
        document.body.innerHTML = `
            <input id="searchInput" />
        `;

        searchInput = document.getElementById("searchInput");
        loadData = jest.fn();

        jest.clearAllMocks();

        jest.useFakeTimers();

        window.history.pushState = jest.fn();

        urlUtils.parseUrlParams.mockReturnValue({
            query: "",
            sort: [
                { key: "name", order: "asc" }
            ]
        });

        urlUtils.updateUrlParams.mockReturnValue(
            "/?page=1&q=sofia&sort=name:asc"
        );

        initSearch(loadData);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("should update URL and call loadData after debounce", () => {
        searchInput.value = " Sofia ";

        searchInput.dispatchEvent(
            new Event("input")
        );

        expect(urlUtils.updateUrlParams).not.toHaveBeenCalled();

        jest.advanceTimersByTime(500);

        expect(urlUtils.updateUrlParams).toHaveBeenCalledWith({
            page: 1,
            query: "Sofia",
            sort: "name:asc"
        });

        expect(window.history.pushState).toHaveBeenCalled();
        expect(loadData).toHaveBeenCalled();
    });

    test("should clear previous timeout and use latest input", () => {
        searchInput.value = "first";

        searchInput.dispatchEvent(
            new Event("input")
        );

        searchInput.value = "second";

        searchInput.dispatchEvent(
            new Event("input")
        );

        jest.advanceTimersByTime(500);

        expect(urlUtils.updateUrlParams).toHaveBeenCalledTimes(1);

        expect(urlUtils.updateUrlParams).toHaveBeenCalledWith({
            page: 1,
            query: "second",
            sort: "name:asc"
        });

        expect(loadData).toHaveBeenCalledTimes(1);
    });
});