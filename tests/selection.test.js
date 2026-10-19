/**
 * @jest-environment jsdom
 */


import { initSelection } from "../public/js/selection.js";
import * as uiUtils from "../public/js/ui.js";
import * as urlUtils from "../public/js/url.js";
import * as apiUtils from "../public/js/api.js";
import {
    getSelectedIds,
    addSelectedId,
    clearSelectedIds
} from "../public/js/list.js";


jest.mock("../public/js/ui.js", () => ({
    updateDeleteButton: jest.fn()
}));

jest.mock("../public/js/url.js", () => ({
    parseUrlParams: jest.fn()
}));

jest.mock("../public/js/api.js", () => ({
    deleteItems: jest.fn()
}));

describe("selection.js", () => {
    let loadDataMock;

    beforeEach(() => {
        jest.clearAllMocks();

        clearSelectedIds();

        document.body.innerHTML = `
            <button id="deleteSelectedBtn"></button>

            <input
                type="checkbox"
                id="selectAll"
            />

            <table>
                <tbody id="tableBody">
                    <tr>
                        <td>
                            <input
                                type="checkbox"
                                class="rowCheckbox"
                                value="1"
                            />
                        </td>
                    </tr>

                    <tr>
                        <td>
                            <input
                                type="checkbox"
                                class="rowCheckbox"
                                value="2"
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        `;

        loadDataMock = jest.fn();

        urlUtils.parseUrlParams.mockReturnValue({
            view: "settlements"
        });

        //confirm винаги да връща true
        global.confirm = jest.fn(() => true);
    });

    describe("checkbox selection", () => {
        test("should add checkbox id to selectedIds", () => {
            initSelection(loadDataMock);

            const checkbox = document.querySelector(".rowCheckbox");
            checkbox.checked = true;

            checkbox.dispatchEvent(
                new Event("change", { bubbles: true })
            );

            expect(uiUtils.updateDeleteButton).toHaveBeenCalled();

            expect(getSelectedIds().has("1")).toBe(true);
        });

        test("should remove checkbox id from selectedIds", () => {
            addSelectedId("1");

            initSelection(loadDataMock);

            const checkbox = document.querySelector(".rowCheckbox");
            checkbox.checked = false;

            checkbox.dispatchEvent(
                new Event("change", { bubbles: true })
            );

            expect(uiUtils.updateDeleteButton).toHaveBeenCalled();

            expect(getSelectedIds().has("1")).toBe(false);
        });

        test("should do nothing if target is not rowCheckbox", () => {
            initSelection(loadDataMock);

            const tableBody = document.getElementById("tableBody");

            const div = document.createElement("div");
            tableBody.appendChild(div);

            div.dispatchEvent(
                new Event("change", { bubbles: true })
            );

            expect(uiUtils.updateDeleteButton).not.toHaveBeenCalled();

            expect(getSelectedIds().size).toBe(0);
        });
    });

    describe("selectAll", () => {
        test("should select all checkboxes", () => {
            initSelection(loadDataMock);

            const selectAll = document.getElementById("selectAll");
            selectAll.checked = true;

            selectAll.dispatchEvent(
                new Event("change", { bubbles: true })
            );

            expect(getSelectedIds().has("1")).toBe(true);
            expect(getSelectedIds().has("2")).toBe(true);

            expect(uiUtils.updateDeleteButton).toHaveBeenCalled();
        });

        test("should unselect all checkboxes", () => {
            addSelectedId("1");
            addSelectedId("2");

            initSelection(loadDataMock);

            const selectAll =
                document.getElementById("selectAll");

            selectAll.checked = false;

            selectAll.dispatchEvent(
                new Event("change", { bubbles: true })
            );

            expect(getSelectedIds().size).toBe(0);
        });
    });

    describe("delete selected", () => {
        test("should delete selected items and reload data", async () => {
            addSelectedId("1");
            addSelectedId("2");

            apiUtils.deleteItems.mockResolvedValue();

            initSelection(loadDataMock);

            document.getElementById("deleteSelectedBtn").click();

            await Promise.resolve();
            await Promise.resolve();

            expect(apiUtils.deleteItems).toHaveBeenCalledWith(
                "settlements",
                ["1", "2"]
            );


            expect(loadDataMock).toHaveBeenCalled();

            expect(getSelectedIds().size).toBe(0);
        });

        test("should not delete if confirm returns false", () => {
            global.confirm = jest.fn(() => false);

            addSelectedId("1");

            initSelection(loadDataMock);

            document.getElementById("deleteSelectedBtn").click();

            expect(apiUtils.deleteItems).not.toHaveBeenCalled();
        });

        test("should handle deleteItems error", async () => {
            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => { });

            addSelectedId("1");

            apiUtils.deleteItems.mockRejectedValue(
                new Error("Delete failed")
            );

            initSelection(loadDataMock);

            document.getElementById("deleteSelectedBtn").click();

            await Promise.resolve();

            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });
});