/**
 * @jest-environment jsdom
 */
import { buildExportUrl } from "../public/js/export.js";

describe("buildExportUrl", () => {
    beforeEach(() => {
        window.history.pushState({}, "", "/");
    });

    test("builds export url for the current view", () => {
        window.history.pushState({}, "", "/settlements");

        expect(buildExportUrl("csv")).toBe("http://localhost/api/settlements/export/csv");
    });

    test("does not pass page, limit and view to the export", () => {
        window.history.pushState({}, "", "/settlements?page=3&limit=20&view=regions&query=Sofia");

        const url = new URL(buildExportUrl("excel"));

        expect(url.pathname).toBe("/api/settlements/export/excel");
        expect(url.searchParams.has("page")).toBe(false);
        expect(url.searchParams.has("limit")).toBe(false);
        expect(url.searchParams.has("view")).toBe(false);
        expect(url.searchParams.get("query")).toBe("Sofia");
    });

    test("keeps sort as a string", () => {
        window.history.pushState({}, "", "/settlements?sort=name:asc,id:desc");

        const url = new URL(buildExportUrl("csv"));

        expect(url.searchParams.get("sort")).toBe("name:asc,id:desc");
    });

    test("uses the last non-empty value for repeated params", () => {
        window.history.pushState({}, "", "/settlements?name=Sofia&name=");

        const url = new URL(buildExportUrl("csv"));

        expect(url.searchParams.get("name")).toBe("Sofia");
    });

    test("uses the last value when a parameter is repeated", () => {
        window.history.pushState({}, "", "/settlements?name=Sofia&name=Plovdiv");

        const url = new URL(buildExportUrl("csv"));

        expect(url.searchParams.get("name")).toBe("Plovdiv");
    });
});