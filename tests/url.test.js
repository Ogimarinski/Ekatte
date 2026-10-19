/**
 * @jest-environment jsdom
 */
import { parseQueryString, parseUrlParams, updateUrlParams } from "../public/js/url.js";

describe("parseUrlParams", () => {
    beforeEach(() => {
        window.history.pushState({}, "", "/");
    });

    test("parseUrlParams should return default values if no params exists", () => {
        window.history.pushState({}, 'Test Page', '/');

        const params = parseUrlParams();
        expect(params.view).toBe('regions');
        expect(params.page).toBe(1);
        expect(params.query).toBe("");
    });

    test("parseUrlParams should parse query and page correctly", () => {
        window.history.pushState({}, 'Test Page', '/regions?page=5&query=test');

        const params = parseUrlParams();
        expect(params.view).toBe('regions');
        expect(params.page).toBe(5);
        expect(params.query).toBe('test');
    });

    test("should update params correctly", () => {
        window.history.pushState({}, "", "/settlements?page=1&query=test");
        const result = updateUrlParams({ page: 5, query: "" });

        expect(result).toContain("page=5");
        expect(result).not.toContain("query=");
    });

    test("parseUrlParams should parse sort correctly", () => {
        window.history.pushState({}, "", "/settlements?sort=name:asc,id:desc");

        const params = parseUrlParams();

        expect(params.sort).toEqual([
            { key: "name", order: "asc" },
            { key: "id", order: "desc" }
        ]);
    });

    test("parseUrlParams should ignore empty value of repeated page param", () => {
        window.history.pushState({}, "", "/settlements?page=2&page=");

        const params = parseUrlParams();

        expect(params.page).toBe(2);
    });

    test("parseUrlParams should treat whitespace-only query as missing", () => {
        window.history.pushState({}, "", "/settlements?query=%20%20");

        const params = parseUrlParams();

        expect(params.query).toBe("");
    });
});

describe("parseQueryString", () => {
    test("skips empty and whitespace-only values", () => {
        const params = parseQueryString("?page=&query=%20%20&name=Sofia");

        expect(params).toEqual({ name: "Sofia" });
    });

    test("trims values", () => {
        const params = parseQueryString("?name=%20Sofia%20");

        expect(params).toEqual({ name: "Sofia" });
    });

    test("keeps the last non-empty value for repeated params", () => {
        expect(parseQueryString("?page=2&page=5")).toEqual({ page: "5" });
        expect(parseQueryString("?page=2&page=")).toEqual({ page: "2" });
    });
});