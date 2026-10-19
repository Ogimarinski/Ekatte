/**
 * @jest-environment jsdom
 */

import {
    loadOptions,
    handleRegionChange,
    handleMunicipalityChange,
    initDropdownHandlers,
} from "../public/js/dropdowns.js";

import * as api from "../public/js/api.js";
import * as ui from "../public/js/ui.js";

jest.mock("../public/js/api.js", () => ({
    fetchOptions: jest.fn()
}));

jest.mock("../public/js/ui.js", () => ({
    populateSelect: jest.fn()
}));

describe("dropdowns.js", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        document.body.innerHTML = `
            <select id="region">
                <option
                    value="5"
                    data-code="SOF"
                    selected>
                    Sofia
                </option>
            </select>

            <select id="municipality">
                <option
                    value="7"
                    data-code="SOF01"
                    selected>
                    Sofia Municipality
                </option>
            </select>

            <select id="mayorality"></select>

            <input id="codeInput" />
        `;

        jest
            .spyOn(console, "error")
            .mockImplementation(() => { });
    });


    test("loadOptions should fetchOptions and call populateSelect", async () => {
        api.fetchOptions.mockResolvedValue([
            { id: 1, name: "Sofia" }
        ]);


        await loadOptions("regions", "region");

        expect(api.fetchOptions).toHaveBeenCalledWith("regions", null, "");
        expect(ui.populateSelect).toHaveBeenCalledWith(
            "region",
            [{ id: 1, name: "Sofia" }]
        );
    });
    test("loadOptions should prepend municipality as option for mayoralties", async () => {
        api.fetchOptions.mockResolvedValue([
            { id: 1, name: "Sofia" }
        ]);

        await loadOptions("mayoralties", "add-mayoralty", 5, "municipality_id", { name: "Sofia", code: "SOF01" });

        const results = ui.populateSelect.mock.calls[0][1];

        expect(results[0]).toEqual({
            id: "municipality",
            name: "Sofia",
            code: "SOF01-00"
        });
    });

    test("loadOptions should handle errors", async () => {
        const consoleSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => { });

        api.fetchOptions.mockRejectedValue(
            new Error("Fetch failed")
        );

        await loadOptions("regions", "add-region");

        expect(api.fetchOptions).toHaveBeenCalledWith(
            "regions",
            null,
            ""
        );

        expect(ui.populateSelect).not.toHaveBeenCalled();

        expect(consoleSpy).toHaveBeenCalledWith(
            "Грешка при зареждане на regions:",
            expect.any(Error)
        );

        consoleSpy.mockRestore();
    });

    describe("handleRegionChange", () => {
        test("should reset dropdowns and load municipalities", async () => {
            const regionSelect = document.getElementById("region");
            const municipalitySelect = document.getElementById("municipality");
            const mayoralitySelect = document.getElementById("mayorality");

            api.fetchOptions.mockResolvedValue([]);

            await handleRegionChange(
                regionSelect,
                municipalitySelect,
                mayoralitySelect
            );

            expect(municipalitySelect.innerHTML).toContain(
                "-- Първо избери област --"
            );

            expect(mayoralitySelect.innerHTML).toContain(
                "-- Първо избери община --"
            );

            expect(api.fetchOptions).toHaveBeenCalled();
        });

        test("should not load municipalities when region is empty", async () => {
            const regionSelect = document.getElementById("region");
            const municipalitySelect = document.getElementById("municipality");
            const mayoralitySelect = document.getElementById("mayorality");

            regionSelect.value = "";

            await handleRegionChange(
                regionSelect,
                municipalitySelect,
                mayoralitySelect
            );

            expect(api.fetchOptions).not.toHaveBeenCalled();
        });
    });

    describe("handleMunicipalityChange", () => {
        test("should reset mayorality and load options", async () => {

            const municipalitySelect = document.getElementById("municipality");
            const mayoralitySelect = document.getElementById("mayorality");

            api.fetchOptions.mockRejectedValue({
                results: []
            });

            await handleMunicipalityChange(
                municipalitySelect,
                mayoralitySelect
            );

            expect(mayoralitySelect.innerHTML).toContain("-- Избери кметство --");

            expect(api.fetchOptions).toHaveBeenCalled();
        });

        test("should not load mayoralties when municipality is empty", async () => {
            const municipalitySelect = document.getElementById("municipality");
            const mayoralitySelect = document.getElementById("mayorality");

            municipalitySelect.value = "";

            await handleMunicipalityChange(
                municipalitySelect,
                mayoralitySelect
            );

            expect(api.fetchOptions).not.toHaveBeenCalled();
        });
    });

    describe("initDropdownHandlers", () => {
        test("should call region change flow", async () => {
            const regionSelect = document.getElementById("region");
            const municipalitySelect = document.getElementById("municipality");
            const mayoralitySelect = document.getElementById("mayorality");
            const codeInput = document.getElementById("codeInput");

            api.fetchOptions.mockResolvedValue([]);

            initDropdownHandlers(
                regionSelect,
                municipalitySelect,
                mayoralitySelect,
                codeInput
            );

            regionSelect.dispatchEvent(
                new Event("change", { bubbles: true })
            );

            await Promise.resolve();
            await Promise.resolve();

            expect(api.fetchOptions).toHaveBeenCalled();
        });

        test("should call municipality change flow", async () => {
            const municipalitySelect = document.getElementById("municipality");
            const mayoralitySelect = document.getElementById("mayorality");
            const codeInput = document.getElementById("codeInput");

            api.fetchOptions.mockResolvedValue([]);

            initDropdownHandlers(
                document.getElementById("region"),
                municipalitySelect,
                mayoralitySelect,
                codeInput
            );

            municipalitySelect.dispatchEvent(
                new Event("change", { bubbles: true })
            );

            await Promise.resolve();
            await Promise.resolve();

            expect(api.fetchOptions).toHaveBeenCalled();
        });
    });

    test("should not call fetchOptions on mayorality change", () => {
        const mayoralitySelect = document.getElementById("mayorality");
        const codeInput = document.getElementById("codeInput");

        initDropdownHandlers(
            document.getElementById("region"),
            document.getElementById("municipality"),
            mayoralitySelect,
            codeInput
        );

        mayoralitySelect.dispatchEvent(
            new Event("change", { bubbles: true })
        );

        expect(api.fetchOptions).not.toHaveBeenCalled();
    });


});