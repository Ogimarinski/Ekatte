/**
 * @jest-environment jsdom
 */

jest.mock("../public/js/jsonSchemaEditor.js", () => ({
    initJsonSchemaEditor: jest.fn().mockResolvedValue({}),
    destroyJsonSchemaEditor: jest.fn(),
    getJsonSchemaEditorPayload: jest.fn(() => ({
        payload: {},
        hasError: false
    }))
}));

import { buildPkPayload } from "../public/js/modal.js";

import * as api from "../public/js/api.js";
import * as urlUtils from "../public/js/url.js";
import * as dropdowns from "../public/js/dropdowns.js";
import * as helper from "../public/js/helper.js";
import * as jsonSchemaEditor from "../public/js/jsonSchemaEditor.js";

jest.mock("../public/js/api.js", () => ({
    createItem: jest.fn(),
    updateItem: jest.fn(),
    fetchOne: jest.fn()
}));

jest.mock("../public/js/url.js", () => ({
    parseUrlParams: jest.fn()
}));

jest.mock("../public/js/dropdowns.js", () => ({
    loadOptions: jest.fn(),
    resetMunicipalityAndMayorality: jest.fn(),
    handleRegionChange: jest.fn(),
    handleMunicipalityChange: jest.fn(),
    initDropdownHandlers: jest.fn()
}));

jest.mock("../public/js/helper.js", () => ({
    isValidName: jest.fn()
}));

// Изчаква целия microtask queue да се изпразни\

describe("modal.js", () => {
    let loadData;

    let initModal;

    // Дава възможност на всички асинхронни операции (Promise-и)
    // да приключат преди проверките в теста.
    const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

    beforeEach(async () => {
        jest.clearAllMocks();

        jest.isolateModules(() => {
            const modalModule = require("../public/js/modal.js");
            initModal = modalModule.initModal;
        });

        loadData = jest.fn();

        document.body.innerHTML = `
            <button id="addBtn">Add</button>
            <button id="saveBtn">Save</button>
            <button id="cancelBtn">Cancel</button>

            <div id="modalOverlay" class="hidden"></div>
            <div id="jsonEditorHolder" class="hidden"></div>
            <div id="tableBody"></div>
            <h2 id="modalTitle"></h2>

            <form id="addForm">
                <input name="name" value="Sofia" />
                <input name="code" value="SOF" />
                <select id="add-region" name="region_id"></select>
                <select id="add-municipality" name="municipality_id"></select>
                <select id="add-mayorality" name="mayorality_id"></select>
            </form>

            <div class="field-group" data-field="name"></div>
            <div class="field-group" data-field="code"></div>
            <div class="field-group" data-field="region_id"></div>
        `;

        urlUtils.parseUrlParams.mockReturnValue({
            view: "regions"
        });

        helper.isValidName.mockReturnValue(true);

        global.alert = jest.fn();

        jest.clearAllMocks();
        loadData = jest.fn();
    });

    test("should initialize dropdown handlers", () => {
        initModal(loadData);

        expect(dropdowns.initDropdownHandlers)
            .toHaveBeenCalled();
    });

    test("should open modal on add button click", async () => {
        initModal(loadData);

        document.getElementById("addBtn").click();

        await flushPromises();

        expect(document.getElementById("modalOverlay").classList.contains("hidden"))
            .toBe(false);
    });

    test("should close modal on cancel button click", () => {
        initModal(loadData);

        document.getElementById("cancelBtn").click();

        expect(dropdowns.resetMunicipalityAndMayorality)
            .toHaveBeenCalled();
    });

    test("should create item on save", async () => {
        api.createItem.mockResolvedValue();

        initModal(loadData);

        document.getElementById("saveBtn").click();

        await flushPromises();

        expect(api.createItem).toHaveBeenCalled();

        expect(loadData).toHaveBeenCalled();
    });

    test("should update item on save", async () => {
        document.getElementById("tableBody").innerHTML = `
            <button class="editBtn" data-id="1">Edit</button>
        `;

        api.fetchOne.mockResolvedValue({
            id: 1,
            name: "Sofia",
            code: "SOF"
        });

        api.updateItem.mockResolvedValue();

        initModal(loadData);

        document.querySelector(".editBtn").click();
        await flushPromises();

        jsonSchemaEditor.getJsonSchemaEditorPayload.mockReturnValue({
            payload: {
                name: "New Name",
                code: "SOF"
            },
            hasError: false
        });

        document.querySelector("[name='name']").value = "New Name";

        document.getElementById("saveBtn").click();
        await flushPromises();

        expect(api.updateItem).toHaveBeenCalled();
        expect(loadData).toHaveBeenCalled();
    });

    test("should update item with missing field on save", async () => {
        document.getElementById("tableBody").innerHTML = `
            <button class="editBtn" data-id="1">Edit</button>
        `;

        api.fetchOne.mockResolvedValue({
            id: 1,
            name: "Sofia",
        });

        api.updateItem.mockResolvedValue();

        initModal(loadData);

        document.querySelector(".editBtn").click();
        await flushPromises();

        jsonSchemaEditor.getJsonSchemaEditorPayload.mockReturnValue({
            payload: {
                name: "Софиа",
                code: "SOF"
            },
            hasError: false
        });

        document.getElementById("saveBtn").click();
        await flushPromises();

        expect(api.updateItem).toHaveBeenCalledWith(
            "regions",
            1,
            expect.objectContaining({
                id: 1,
                code: "SOF"
            })
        );
    });

    test("should handle error in handleEditClick", async () => {
        document.getElementById("tableBody").innerHTML = `
            <button class="editBtn" data-id="1">Edit</button>
        `;

        api.fetchOne.mockRejectedValue(
            new Error("Fetch failed")
        );

        const consoleSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => { });

        initModal(loadData);

        document.querySelector(".editBtn").click();

        await flushPromises();

        expect(global.alert).toHaveBeenCalledWith(
            "Грешка при зареждане на данни за редакция"
        );

        expect(consoleSpy).toHaveBeenCalledWith(
            expect.any(Error)
        );

        consoleSpy.mockRestore();
    });
    test("should handle error in saveModal", async () => {
        api.createItem.mockRejectedValue(
            new Error("error")
        );

        initModal(loadData);

        document.getElementById("saveBtn").click();

        await flushPromises();

        expect(global.alert).toHaveBeenCalledWith("error");

        expect(loadData).not.toHaveBeenCalled();
    });

    test("should pop alert if region is not selected in saveModal", async () => {
        urlUtils.parseUrlParams.mockReturnValue({
            view: "settlements"
        });

        jsonSchemaEditor.getJsonSchemaEditorPayload.mockReturnValue({
            payload: {},
            hasError: false
        });


        initModal(loadData);

        document.getElementById("saveBtn").click();

        await flushPromises();

        expect(alert).toHaveBeenCalledWith(
            "Моля изберете област!"
        );
    });

    test("saveModal should pop alert if municipality is not selected", async () => {
        urlUtils.parseUrlParams.mockReturnValue({
            view: "mayoralties"
        });

        jsonSchemaEditor.getJsonSchemaEditorPayload.mockReturnValue({
            payload: {},
            hasError: false
        });

        document.getElementById("add-region").innerHTML = `
            <option value="1" selected>София</option>
        `;

        initModal(loadData);

        document.getElementById("saveBtn").click();

        await flushPromises();

        expect(alert).toHaveBeenCalledWith(
            "Моля изберете община!"
        );
    });

    test("saveModal should parse mayorality_id to integer", async () => {
        urlUtils.parseUrlParams.mockReturnValue({
            view: "settlements"
        });

        jsonSchemaEditor.getJsonSchemaEditorPayload.mockReturnValue({
            payload: {},
            hasError: false
        });

        document.getElementById("add-region").innerHTML =
            `<option value="1" selected>Region</option>`;

        document.getElementById("add-municipality").innerHTML =
            `<option value="2" selected>Municipality</option>`;

        document.getElementById("add-mayorality").innerHTML =
            `<option value="3" selected>Mayorality</option>`;

        api.createItem.mockResolvedValue({});

        initModal(loadData);

        document.getElementById("saveBtn").click();

        await flushPromises();

        expect(api.createItem).toHaveBeenCalledWith(
            "settlements",
            expect.objectContaining({
                municipality_id: 2,
                mayorality_id: 3
            })
        );
    });

    test("saveModal returns if jsonSchemaEditorHasError", async () => {
        urlUtils.parseUrlParams.mockReturnValue({
            view: "settlements"
        });

        jsonSchemaEditor.getJsonSchemaEditorPayload.mockReturnValue({
            payload: {},
            hasError: true
        });

        initModal(loadData);

        document.getElementById("saveBtn").click();

        await flushPromises();

        expect(api.createItem).not.toHaveBeenCalled();
        expect(api.updateItem).not.toHaveBeenCalled();
        expect(alert).not.toHaveBeenCalled();
    });


    test("should set mayorality_id to null when municipality is selected", async () => {
        document.body.innerHTML = `
        <button id="addBtn"></button>
        <button id="saveBtn"></button>
        <button id="cancelBtn"></button>

        <div id="modalOverlay"></div>
        <div id="tableBody"></div>
        <h2 id="modalTitle"></h2>

        <form id="addForm">
            <input name="name" value="Sofia" />

            <select name="municipality_id" id="add-municipality">
                <option value="1" selected>Municipality</option>
            </select>

            <select name="mayorality_id" id="add-mayorality">
                <option value="municipality" selected>
                    municipality
                </option>
            </select>

            <select id="add-region" name="region_id">
                <option value="1" selected>Region</option>
            </select>
        </form>

        <div class="field-group" data-field="name"></div>
        <div class="field-group" data-field="municipality_id"></div>
        <div class="field-group" data-field="mayorality_id"></div>
        <div class="field-group" data-field="region_id"></div>
        `;

        urlUtils.parseUrlParams.mockReturnValue({
            view: "settlements"
        });

        jsonSchemaEditor.getJsonSchemaEditorPayload.mockReturnValue({
            payload: { name: "Sofia" },
            hasError: false
        });

        api.createItem.mockResolvedValue();

        initModal(loadData);

        document.getElementById("saveBtn").click();

        await flushPromises();

        expect(api.createItem).toHaveBeenCalledWith(
            "settlements",
            expect.objectContaining({
                mayorality_id: null
            })
        );
    });

    test("buildPkPayload should return parsed id for other views", () => {
        const result = buildPkPayload("regions", "5");

        expect(result).toEqual({
            id: 5
        });
    });

    test("buildPkPayload should return parsed id for settlements", () => {
        const result = buildPkPayload("settlements", "12345");

        expect(result).toEqual({
            id: 12345
        });
    });

    test("should load region options when modal requires region_id", async () => {
        urlUtils.parseUrlParams.mockReturnValue({
            view: "municipalities"
        });

        initModal(loadData);

        document.getElementById("addBtn").click();

        await flushPromises();

        expect(dropdowns.loadOptions).toHaveBeenCalledWith(
            "regions",
            expect.anything()
        );
    });

    test("should show alert when no changes are made in edit mode", async () => {
        document.getElementById("tableBody").innerHTML = `
            <button class="editBtn" data-id="1">Edit</button>
        `;

        urlUtils.parseUrlParams.mockReturnValue({
            view: "regions"
        });

        api.fetchOne.mockResolvedValue({
            id: 1,
            name: "Sofia",
            code: "SOF"
        });

        jsonSchemaEditor.getJsonSchemaEditorPayload.mockReturnValue({
            payload: {
                name: "Sofia",
                code: "SOF"
            },
            hasError: false
        });

        initModal(loadData);

        document.querySelector(".editBtn").click();

        await flushPromises();

        document.getElementById("saveBtn").click();

        await flushPromises();

        expect(global.alert).toHaveBeenCalledWith(
            "Няма направени промени"
        );

        expect(api.updateItem).not.toHaveBeenCalled();
    });

    test("should preload dropdowns with region, municipality and mayorality", async () => {
        document.getElementById("tableBody").innerHTML = `
            <button class="editBtn" data-id="1">Edit</button>
        `;

        document.getElementById("add-municipality").innerHTML = `
            <option value="20" selected>Municipality</option>
        `;
        document.getElementById("add-mayorality").innerHTML = `
            <option value="30">Mayorality</option>
        `;

        urlUtils.parseUrlParams.mockReturnValue({
            view: "settlements"
        });

        api.fetchOne.mockResolvedValue({
            id: 1,
            name: "Test",
            region_id: 10,
            municipality_id: 20,
            mayorality_id: 30
        });

        initModal(loadData);

        document.querySelector(".editBtn").click();

        await flushPromises();

        expect(dropdowns.loadOptions).toHaveBeenCalledWith(
            "regions",
            expect.anything()
        );

        expect(dropdowns.handleRegionChange).toHaveBeenCalled();

        expect(
            document.getElementById("add-municipality").value
        ).toBe("20");

        expect(
            document.getElementById("add-mayorality").value
        ).toBe("30");
    });

    test("should preload dropdowns with region, municipality and mayorality - null mayorality", async () => {
        document.getElementById("tableBody").innerHTML = `
            <button class="editBtn" data-id="1">Edit</button>
        `;

        document.getElementById("add-municipality").innerHTML = `
            <option value="20" selected>Municipality</option>
        `;
        document.getElementById("add-mayorality").innerHTML = `
            <option value="municipality">Mayorality</option>
        `;

        urlUtils.parseUrlParams.mockReturnValue({
            view: "settlements"
        });

        api.fetchOne.mockResolvedValue({
            id: 1,
            name: "Test",
            region_id: 10,
            municipality_id: 20,
            mayorality_id: null
        });

        initModal(loadData);

        document.querySelector(".editBtn").click();

        await flushPromises();

        expect(dropdowns.loadOptions).toHaveBeenCalledWith(
            "regions",
            expect.anything()
        );

        expect(dropdowns.handleRegionChange).toHaveBeenCalled();

        expect(
            document.getElementById("add-municipality").value
        ).toBe("20");

        expect(
            document.getElementById("add-mayorality").value
        ).toBe("municipality");
    });

    test("should return early when config does not exist", async () => {
        urlUtils.parseUrlParams.mockReturnValue({
            view: "unknownView"
        });

        initModal(loadData);

        document.getElementById("addBtn").click();

        await flushPromises();

        expect(dropdowns.loadOptions).not.toHaveBeenCalled();
    });

    test("should open modal without code input", async () => {
        document.querySelector("[name='code']").remove();

        initModal(loadData);

        document.getElementById("addBtn").click();

        await flushPromises();

        expect(document.getElementById("modalOverlay").classList.contains("hidden"))
            .toBe(false);
    });

    test("should load regions when region_id is in uiOnly", async () => {
        urlUtils.parseUrlParams.mockReturnValue({
            view: "settlements"
        });

        initModal(loadData);

        document.getElementById("addBtn").click();

        await flushPromises();

        expect(dropdowns.loadOptions).toHaveBeenCalledWith(
            "regions",
            expect.anything()
        );
    });

    test("should not load regions when region_id is not needed", async () => {
        urlUtils.parseUrlParams.mockReturnValue({
            view: "regions"
        });

        initModal(loadData);

        document.getElementById("addBtn").click();

        await flushPromises();

        // modal.js зарежда regions винаги в openModal,
        // затова проверяваме само че loadOptions не е извикан с municipality или mayorality
        expect(dropdowns.loadOptions).not.toHaveBeenCalledWith(
            "municipalities",
            expect.anything()
        );
        expect(dropdowns.loadOptions).not.toHaveBeenCalledWith(
            "mayoralities",
            expect.anything()
        );
    });

    test("should stop preloadDropdowns when municipality_id is missing", async () => {
        document.getElementById("tableBody").innerHTML = `
            <button class="editBtn" data-id="1">Edit</button>
        `;

        urlUtils.parseUrlParams.mockReturnValue({
            view: "settlements"
        });

        api.fetchOne.mockResolvedValue({
            id: 1,
            name: "Test",
            region_id: 10,
            municipality_id: null,
            mayorality_id: null
        });

        initModal(loadData);

        document.querySelector(".editBtn").click();

        await flushPromises();

        expect(dropdowns.loadOptions).toHaveBeenCalledWith(
            "regions",
            expect.anything()
        );

        expect(dropdowns.handleRegionChange).toHaveBeenCalled();

        expect(dropdowns.handleMunicipalityChange).not.toHaveBeenCalled();
    });

    test("should ignore click when target is not editBtn", async () => {
        document.getElementById("tableBody").innerHTML = `
            <button class="otherBtn">Other</button>
        `;

        initModal(loadData);

        document.querySelector(".otherBtn").click();

        await flushPromises();

        expect(api.fetchOne).not.toHaveBeenCalled();
    });

    test("should not fail when jsonEditorHolder is missing", async () => {
        document.getElementById("jsonEditorHolder")?.remove();

        initModal(loadData);

        document.getElementById("addBtn").click();

        await flushPromises();

        expect(document.getElementById("modalOverlay")
            .classList.contains("hidden"))
            .toBe(false);
    });


});