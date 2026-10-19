/**
 * @jest-environment jsdom
 */

import {
    applyFilters,
    clearFilters,
    loadFilterOptions,
    initFilters
} from "../public/js/filter.js";

import * as urlUtils from "../public/js/url.js";
import * as dropdowns from "../public/js/dropdowns.js";
import * as dateValidation from "../public/js/utils/dateFormatValidation.js";


jest.mock("../public/js/url.js", () => ({
    parseUrlParams: jest.fn(),
    updateUrlParams: jest.fn()
}));

jest.mock("../public/js/config.js", () => ({
    dropdownPlaceholders: {
        municipalityFirst: "-- Първо избери област --",
        mayoralityFirst: "-- Първо избери община --",
        default: "-- Избери --"
    }
}));

jest.mock("../public/js/dropdowns.js", () => ({
    loadOptions: jest.fn(),
    handleRegionChange: jest.fn(),
    handleMunicipalityChange: jest.fn(),
    getDefaultOption: jest.fn((text) =>
        `<option value="">${text}</option>`
    )
}));


jest.mock("../public/js/utils/dateFormatValidation.js", () => ({
    isValidDateFormat: jest.fn()
}));

describe("filter.js", () => {
    let loadData;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="filtersContainer">
                <input id="name" value="Sofia" />
                <select id="mayorality_id">
                    <option value="municipality" selected>
                        municipality
                    </option>
                </select>
            </div>
        `;

        loadData = jest.fn();

        jest.clearAllMocks();

        window.history.pushState = jest.fn();

        urlUtils.parseUrlParams.mockReturnValue({
            query: "test",
            sort: [
                { key: "name", order: "asc" }
            ],
            view: "settlements"
        });

        urlUtils.updateUrlParams.mockReturnValue(
            "/?page=1&q=test"
        );
    });

    test("applyFilters should update params and call loadData", () => {
        applyFilters(loadData);

        expect(urlUtils.updateUrlParams).toHaveBeenCalledWith({
            page: 1,
            query: "test",
            sort: "name:asc",
            name: "Sofia",
            has_no_mayorality: "true"
        });

        expect(window.history.pushState)
            .toHaveBeenCalled();

        expect(loadData).toHaveBeenCalled();
    });

    test("applyFilters should show alert when date is invalid", () => {
        document.body.innerHTML = `
            <div id="filtersContainer">
                <input
                    id="updated_at_from"
                    type="date"
                    value="88888-08-08"
                />
            </div>
        `;

        window.alert = jest.fn();

        dateValidation.isValidDateFormat.mockReturnValue(false);

        applyFilters(loadData);

        expect(window.alert).toHaveBeenCalledWith(
            "Моля, изберете валидна дата."
        )
    });

    test("clearFilters should clear values and call loadData", () => {
        clearFilters(loadData);

        expect(urlUtils.updateUrlParams).toHaveBeenCalledWith({
            page: 1,
            query: "test",
            sort: "name:asc",
            name: "",
            has_no_mayorality: ""
        });

        expect(loadData).toHaveBeenCalled();
    });

    test("clearFilters should remove min and max from date filters", async () => {
        document.body.innerHTML = `
        <div id="filtersContainer">
            <input
                id="updated_at_from"
                type="date"
                min="2026-01-01"
                max="2026-12-31"
                value="2026-06-01"
            />
        </div>
    `;

        await clearFilters(loadData);

        const input = document.getElementById("updated_at_from");

        expect(input.hasAttribute("min")).toBe(false);
        expect(input.hasAttribute("max")).toBe(false);
    });

    test("loadFilterOptions should load all settlement filters", async () => {
        document.body.innerHTML = `
            <select id="region_id"></select>
            <select id="municipality_id"></select>
            <select id="mayorality_id"></select>
        `;

        urlUtils.parseUrlParams.mockReturnValue({
            view: "settlements"
        });

        await loadFilterOptions();

        expect(dropdowns.loadOptions).toHaveBeenNthCalledWith(
            1,
            "regions",
            document.getElementById("region_id")
        );

        expect(dropdowns.loadOptions).toHaveBeenNthCalledWith(
            2,
            "municipalities",
            document.getElementById("municipality_id")
        );

        expect(dropdowns.loadOptions).toHaveBeenNthCalledWith(
            3,
            "mayoralties",
            document.getElementById("mayorality_id")
        );
    });


    test("loadFilterOptions should load regions for municipalities", async () => {
        document.body.innerHTML = `
        <select id="region_id"></select>
    `;

        urlUtils.parseUrlParams.mockReturnValue({
            view: "municipalities"
        });

        await loadFilterOptions();

        expect(dropdowns.loadOptions).toHaveBeenCalledWith(
            "regions",
            document.getElementById("region_id")
        );
    });

    test("loadFilterOptions should load municipalities for mayoralties", async () => {
        document.body.innerHTML = `
            <select id="municipality_id"></select>
        `;

        urlUtils.parseUrlParams.mockReturnValue({
            view: "mayoralties"
        });

        await loadFilterOptions();

        expect(dropdowns.loadOptions).toHaveBeenCalledWith(
            "municipalities",
            document.getElementById("municipality_id")
        );
    });

    test("initFilters should call applyFilters on filter button click", () => {
        document.body.innerHTML = `
        <div id="filtersContainer">
            <input id="name" value="Sofia" />
        </div>
        <button id="filterBtn"></button>
        <button id="clearFiltersBtn"></button>
        `;

        initFilters(loadData);

        document.getElementById("filterBtn").click();

        expect(urlUtils.updateUrlParams).toHaveBeenCalled();
        expect(loadData).toHaveBeenCalled();
    });

    test("initFilters should call clearFilters on clear button click", () => {
        document.body.innerHTML = `
        <div id="filtersContainer">
            <input id="name" value="Sofia" />
        </div>
        <button id="filterBtn"></button>
        <button id="clearFiltersBtn"></button>
        `;

        initFilters(loadData);

        document.getElementById("clearFiltersBtn").click();

        expect(urlUtils.updateUrlParams).toHaveBeenCalled();
        expect(loadData).toHaveBeenCalled();
    });

    test("initFilters should enable _to date when _from changes", () => {
        document.body.innerHTML = `
        <input id="updated_at_from" type = "date" value="2026-05-01" />
        <input id="updated_at_to" type="date" />
        `;

        initFilters(loadData);

        const fromDate = document.getElementById("updated_at_from");
        const toDate = document.getElementById("updated_at_to");

        fromDate.dispatchEvent(
            new Event("change", { bubbles: true })
        );

        expect(toDate.min).toBe("2026-05-01");
    });

    test("initFilters should set max on _from when _to changes", () => {
        document.body.innerHTML = `
        <input id="updated_at_from" type="date"/>
        <input id="updated_at_to" type="date" value="2026-05-10" />
        `;

        initFilters(loadData);

        const toDate = document.getElementById("updated_at_to");
        const fromDate = document.getElementById("updated_at_from");

        toDate.dispatchEvent(
            new Event("change", { bubbles: true })
        );

        expect(fromDate.max).toBe("2026-05-10");
    });

    test("initFilters should clear _to date if it is earlier than _from", () => {
        document.body.innerHTML = `
        <input id="updated_at_from" type="date" value="2026-05-10" />
        <input id="updated_at_to" type="date" value="2026-05-05" />
        `;

        initFilters(loadData);

        const fromDate = document.getElementById("updated_at_from");
        const toDate = document.getElementById("updated_at_to");

        fromDate.dispatchEvent(
            new Event("change", { bubbles: true })
        );

        expect(toDate.value).toBe("");
    });

    test("initFilters should remove min from _to when _from is cleared", () => {
        document.body.innerHTML = `
        <input id="updated_at_from" type="date"/>
        <input id="updated_at_to" type="date" value="2026-05-05" />
        `;

        initFilters(loadData);

        const fromDate = document.getElementById("updated_at_from");
        const toDate = document.getElementById("updated_at_to");

        fromDate.dispatchEvent(
            new Event("change", { bubbles: true })
        );

        expect(toDate.hasAttribute("min")).toBe(false);
    });

    test("initFilters should remove max from _from when _to is cleared", () => {
        document.body.innerHTML = `
        <input id="updated_at_from" type="date" max="2026-05-01" value="" />
        <input id="updated_at_to" type="date" />
        `;

        initFilters(loadData);

        const fromDate = document.getElementById("updated_at_from");
        const toDate = document.getElementById("updated_at_to");

        toDate.dispatchEvent(
            new Event("change", { bubbles: true })
        );

        expect(fromDate.hasAttribute("max")).toBe(false);
    });

    test("initFilters should call handleRegionChange", async () => {
        document.body.innerHTML = `
        <select id="region_id"></select>
        <select id="municipality_id"></select>
        <select id="mayorality_id"></select>
        `;

        initFilters(loadData);

        document.getElementById("region_id").dispatchEvent(
            new Event("change", { bubbles: true })
        );

        await Promise.resolve();

        expect(dropdowns.handleRegionChange)
            .toHaveBeenCalled();
    });

    test("initFilters should call handleMunicipalityChange", async () => {
        document.body.innerHTML = `
        <select id="municipality_id"></select>
        <select id="mayorality_id"></select>
        `;

        initFilters(loadData);

        document.getElementById("municipality_id").dispatchEvent(
            new Event("change", { bubbles: true })
        );

        await Promise.resolve();

        expect(dropdowns.handleMunicipalityChange)
            .toHaveBeenCalled();
    });

    test("should not fail when _to date input does not exist", () => {
        document.body.innerHTML = `
            <input id="updated_at_from" />
        `;

        const loadData = jest.fn();

        initFilters(loadData);

        const input = document.getElementById("updated_at_from");

        expect(() => {
            input.dispatchEvent(
                new Event("change", { bubbles: true })
            );
        }).not.toThrow();
    });

    test("should not fail when _from date input does not exist", () => {
        document.body.innerHTML = `
            <input id="updated_at_to" />
        `;

        const loadData = jest.fn();

        initFilters(loadData);

        const input = document.getElementById("updated_at_to");

        expect(() => {
            input.dispatchEvent(
                new Event("change", { bubbles: true })
            );
        }).not.toThrow();
    });

    test("should not call dropdown handlers when view is not settlements", async () => {
        document.body.innerHTML = `
            <select id="region_id"></select>
            <select id="municipality_id"></select>
            <select id="mayorality_id"></select>
        `;

        urlUtils.parseUrlParams.mockReturnValue({
            view: "regions"
        });

        initFilters(loadData);

        document.getElementById("region_id").dispatchEvent(
            new Event("change", { bubbles: true })
        );

        await Promise.resolve();

        expect(dropdowns.handleRegionChange)
            .not.toHaveBeenCalled();

        expect(dropdowns.handleMunicipalityChange)
            .not.toHaveBeenCalled();
    });

    test("applyFilters should skip empty filter values", () => {
        document.body.innerHTML = `
            <div id="filtersContainer">
                <input id="name" value="" />
                <input id="code" value="   " />
                <select id="mayorality_id">
                    <option value="" selected></option>
                </select>
            </div>
        `;

        applyFilters(loadData);

        expect(urlUtils.updateUrlParams).toHaveBeenCalledWith({
            page: 1,
            query: "test",
            sort: "name:asc"
        });

        expect(loadData).toHaveBeenCalled();
    });

    test("should clear number _to when from becomes greater", () => {
        document.body.innerHTML = `
        <input id="avg_temperature_from" type="number" value="15" />
        <input id="avg_temperature_to" type="number" value="10" />
        `;

        initFilters(loadData);

        document.getElementById("avg_temperature_from").dispatchEvent(new Event("change", { bubbles: true }));

        expect(document.getElementById("avg_temperature_to").value).toBe("");
    });

    test("should clear number _from when to becomes smaller", () => {
        document.body.innerHTML = `
        <input id="avg_temperature_from" type="number" value="20" />
        <input id="avg_temperature_to" type="number" value="10" />
        `;

        initFilters(loadData);

        document.getElementById("avg_temperature_from").dispatchEvent(new Event("change", { bubbles: true }));

        expect(document.getElementById("avg_temperature_to").value).toBe("");
    });
});