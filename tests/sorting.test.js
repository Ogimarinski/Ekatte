/**
 * @jest-environment jsdom
 */

import { initSorting } from "../public/js/sorting.js";
import * as urlUtils from "../public/js/url.js";

jest.mock("../public/js/url.js", () => ({
    parseUrlParams: jest.fn(),
    updateUrlParams: jest.fn()
}));

describe("sorting.js", () => {
    let loadDataMock;

    beforeEach(() => {
        jest.clearAllMocks();

        loadDataMock = jest.fn();

        document.body.innerHTML = `
            <button
                id="sortBtn"
                data-sort="name">
                Sort
            </button>
        `;

        jest.spyOn(window.history, "pushState")
            .mockImplementation(() => { });

        urlUtils.updateUrlParams.mockReturnValue(
            "/?page=1&sort=name:asc"
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("should add new sort with asc order", () => {
        urlUtils.parseUrlParams.mockReturnValue({
            page: 1,
            sort: []
        });

        initSorting(loadDataMock);

        document.getElementById("sortBtn").click();

        expect(urlUtils.updateUrlParams).toHaveBeenCalledWith({
            page: 1,
            sort: "name:asc"
        });

        expect(window.history.pushState).toHaveBeenCalled();

        expect(loadDataMock).toHaveBeenCalled();
    });

    test("should change asc to desc", () => {
        urlUtils.parseUrlParams.mockReturnValue({
            page: 1,
            sort: [
                {
                    key: "name",
                    order: "asc"
                }
            ]
        });

        initSorting(loadDataMock);

        document.getElementById("sortBtn").click();

        expect(urlUtils.updateUrlParams).toHaveBeenCalledWith({
            page: 1,
            sort: "name:desc"
        });

        expect(loadDataMock).toHaveBeenCalled();
    });

    test("should remove sort when already desc", () => {
        urlUtils.parseUrlParams.mockReturnValue({
            page: 1,
            sort: [
                {
                    key: "name",
                    order: "desc"
                }
            ]
        });

        initSorting(loadDataMock);

        document.getElementById("sortBtn").click();

        expect(urlUtils.updateUrlParams).toHaveBeenCalledWith({
            page: 1,
            sort: ""
        });

        expect(loadDataMock).toHaveBeenCalled();
    });

    test("should do nothing if clicked element has no data-sort", () => {
        document.body.innerHTML = `
            <button id="normalBtn">
                Normal
            </button>
        `;

        initSorting(loadDataMock);

        document.getElementById("normalBtn").click();

        expect(urlUtils.updateUrlParams).not.toHaveBeenCalled();

        expect(loadDataMock).not.toHaveBeenCalled();
    });
});