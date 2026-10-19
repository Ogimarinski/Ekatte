/**
 * @jest-environment jsdom
 */

import { initPagination } from "../public/js/pagination.js";
import * as urlUtils from "../public/js/url.js";

jest.mock("../public/js/url.js", () => ({
    parseUrlParams: jest.fn(),
    updateUrlParams: jest.fn()
}));

describe("pagination.js", () => {
    let prevButton;
    let nextButton;
    let goButton;
    let pageInput;
    let loadData;
    let getCurrentPage;

    beforeEach(() => {
        document.body.innerHTML = `
            <button id="prevPage">Предишна</button>
            <input type="number" id="pageInput" min="1" value="5">
            <button id="goToPage">Отиди</button>
            <button id="nextPage">Следваща</button>
        `;

        prevButton = document.getElementById("prevPage");
        nextButton = document.getElementById("nextPage");
        goButton = document.getElementById("goToPage");
        pageInput = document.getElementById("pageInput");

        loadData = jest.fn();
        getCurrentPage = jest.fn();

        jest.clearAllMocks();

        window.history.pushState = jest.fn();

        urlUtils.parseUrlParams.mockReturnValue({
            query: "sofia",
            sort: [
                { key: "name", order: "asc" }
            ]
        });

        urlUtils.updateUrlParams.mockReturnValue(
            "/?page=2&q=sofia&sort=name:asc"
        );

        initPagination(loadData, getCurrentPage);
    });

    test("prev button should go to previous page when currentPage > 1", () => {
        getCurrentPage.mockReturnValue(3);

        prevButton.click();

        expect(urlUtils.updateUrlParams).toHaveBeenCalledWith({
            page: 2,
            query: "sofia",
            sort: "name:asc"
        });

        expect(window.history.pushState).toHaveBeenCalled();
        expect(loadData).toHaveBeenCalled();
    });

    test("prev button should do nothing when currentPage is 1", () => {
        getCurrentPage.mockReturnValue(1);

        prevButton.click();

        expect(urlUtils.updateUrlParams).not.toHaveBeenCalled();
        expect(window.history.pushState).not.toHaveBeenCalled();
        expect(loadData).not.toHaveBeenCalled();
    });

    test("next button should go to next page", () => {
        getCurrentPage.mockReturnValue(2);

        nextButton.click();

        expect(urlUtils.updateUrlParams).toHaveBeenCalledWith({
            page: 3,
            query: "sofia",
            sort: "name:asc"
        });

        expect(window.history.pushState).toHaveBeenCalled();
        expect(loadData).toHaveBeenCalled();
    });

    test("goTo button should go to typed page", () => {
        const newPage = Number(pageInput.value);

        goButton.click();

        expect(urlUtils.updateUrlParams).toHaveBeenCalledWith({
            page: newPage,
            query: "sofia",
            sort: "name:asc"
        });

        expect(window.history.pushState).toHaveBeenCalled();
        expect(loadData).toHaveBeenCalled();
    });

    test("goTo button should return if page is not integer or is smaller than 1", () => {
        pageInput.value = -1;
        goButton.click();

        expect(urlUtils.updateUrlParams).not.toHaveBeenCalled();
        expect(window.history.pushState).not.toHaveBeenCalled();
        expect(loadData).not.toHaveBeenCalled();
    });

    test("should trigger go button when Enter is pressed", () => {
        pageInput.value = "5";

        pageInput.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "Enter",
                bubbles: true
            })
        );

        expect(urlUtils.updateUrlParams).toHaveBeenCalledWith({
            page: 5,
            query: "sofia",
            sort: "name:asc"
        });

        expect(window.history.pushState).toHaveBeenCalled();
        expect(loadData).toHaveBeenCalled();
    });

    test("should trigger go button when Enter is pressed", () => {
        pageInput.value = "5";

        pageInput.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "Escape",
                bubbles: true
            })
        );

        expect(urlUtils.updateUrlParams).not.toHaveBeenCalledWith();

        expect(window.history.pushState).not.toHaveBeenCalled();
        expect(loadData).not.toHaveBeenCalled();
    });
});