import { modalConfigs } from "./config.js";
import { createItem, updateItem, fetchOne } from "./api.js";
import { parseUrlParams } from "./url.js";
import { loadOptions, resetMunicipalityAndMayorality, handleRegionChange, handleMunicipalityChange, initDropdownHandlers } from "./dropdowns.js";
import { initJsonSchemaEditor, destroyJsonSchemaEditor, getJsonSchemaEditorPayload } from "./jsonSchemaEditor.js";
import { withLock } from "./utils/formFeedback.js";


let editModeId = null;
let originalData = null;

function getElements() {
    return {
        addBtn: document.getElementById("addBtn"),
        saveBtn: document.getElementById("saveBtn"),
        cancelBtn: document.getElementById("cancelBtn"),
        modalOverlay: document.getElementById("modalOverlay"),
        tableBody: document.getElementById("tableBody"),
        modalTitle: document.getElementById("modalTitle"),
        regionSelect: document.getElementById("add-region"),
        municipalitySelect: document.getElementById("add-municipality"),
        mayoraltySelect: document.getElementById("add-mayorality"),
        codeInput: document.querySelector('input[name=code]'),
        form: document.getElementById("addForm"),
        jsonEditorHolder: document.getElementById("jsonEditorHolder")
    };
}

function getConfig() {
    const { view } = parseUrlParams();
    return {
        view,
        config: modalConfigs[view]
    };
}

function resetEditState() {
    editModeId = null;
    originalData = null;
}

function getChangedFields(original, payload) {
    const changed = {};

    Object.keys(payload).forEach(key => {
        const originalValue = original[key];
        const newValue = payload[key];

        if (String(originalValue ?? "") !== String(newValue ?? "")) {
            changed[key] = newValue;
        }
    });

    return changed;
}

function buildPkPayload(view, id) {
    return {
        id: Number(id)
    };
}

function resetForms(elements) {
    resetEditState();

    elements.form.reset();

    resetMunicipalityAndMayorality(
        elements.municipalitySelect,
        elements.mayoraltySelect
    );
}

function showModal(elements) {
    elements.modalOverlay.classList.remove("hidden");
}

function hideModal(elements) {
    elements.modalOverlay.classList.add("hidden");
}


function setupVisibleFields(config) {
    document
        .querySelectorAll(".field-group")
        .forEach(group => {
            const fieldName = group.getAttribute("data-field");

            const isVisible = hasUiField(config, fieldName);

            isVisible
                ? group.classList.remove("hidden")
                : group.classList.add("hidden");
        });
}

function toggleJsonSchemaEditor(elements, enabled) {
    if (!elements.jsonEditorHolder) return;

    enabled
        ? elements.jsonEditorHolder.classList.remove("hidden")
        : elements.jsonEditorHolder.classList.add("hidden");
}

async function openModal() {
    const elements = getElements();
    const { view, config } = getConfig();

    resetEditState();

    if (!config) return;

    if (elements.codeInput) {
        elements.codeInput.readOnly = view !== "regions";
    }

    elements.modalTitle.textContent = config.title;

    await initJsonSchemaEditor(elements.jsonEditorHolder, view, "create");

    setupVisibleFields(config);

    await loadOptions("regions", elements.regionSelect);

    toggleJsonSchemaEditor(elements, true);

    showModal(elements);

}

function closeModal() {
    const elements = getElements();
    destroyJsonSchemaEditor();
    toggleJsonSchemaEditor(elements, false);
    resetForms(elements);
    hideModal(elements);
}

function hasField(config, field) {
    return config.fields?.includes(field);
}

function hasUiField(config, field) {
    return (
        config.fields?.includes(field) ||
        config.uiOnly?.includes(field)
    );
}

function buildLocationFilters(config, elements) {
    const filters = {};

    if (hasField(config, "region_id") && elements.regionSelect?.value) {
        filters.region_id = parseInt(elements.regionSelect.value, 10);
    }

    if (hasField(config, "municipality_id") && elements.municipalitySelect?.value) {
        filters.municipality_id = parseInt(elements.municipalitySelect.value, 10);
    }

    if (hasField(config, "mayorality_id")) {
        const mayoralityValue = elements.mayoraltySelect?.value;
        filters.mayorality_id =
            mayoralityValue && mayoralityValue !== "municipality"
                ? parseInt(mayoralityValue, 10)
                : null;
    }

    return filters;
}

async function saveModal(loadData) {
    const elements = getElements();
    const { view, config } = getConfig();

    const { payload, hasError } = getJsonSchemaEditorPayload();

    if (hasError) return;

    if (hasUiField(config, "region_id") && !elements.regionSelect?.value) {
        alert("Моля изберете област!");
        return;
    }

    if (hasUiField(config, "municipality_id") && !elements.municipalitySelect?.value) {
        alert("Моля изберете община!");
        return;
    }

    const finalPayload = {
        ...payload,
        ...buildLocationFilters(config, elements)
    };

    try {
        if (editModeId) {
            const changedFields = getChangedFields(originalData, finalPayload);

            if (Object.keys(changedFields).length === 0) {
                alert("Няма направени промени");
                return;
            }

            await updateItem(
                view,
                editModeId,
                {
                    ...changedFields,
                    ...buildPkPayload(view, editModeId)
                }
            );
        } else {
            await createItem(
                view,
                finalPayload
            );
        }

        alert(editModeId ? "Успешна редакция" : "Успешно добавяне");
        closeModal();
        loadData();
    } catch (err) {
        alert(err.message);
        console.error(err);
    }
}

async function preloadDropdowns(data, elements) {
    if (!data.region_id) return;

    await loadOptions(
        "regions",
        elements.regionSelect
    );

    elements.regionSelect.value = data.region_id;

    await handleRegionChange(
        elements.regionSelect,
        elements.municipalitySelect,
        elements.mayoraltySelect
    );

    if (!data.municipality_id) return;

    elements.municipalitySelect.value = data.municipality_id;

    await handleMunicipalityChange(
        elements.municipalitySelect,
        elements.mayoraltySelect
    );

    if (data.mayorality_id) {
        elements.mayoraltySelect.value = data.mayorality_id;
    } else {
        elements.mayoraltySelect.value = "municipality";
    }
}

async function handleEditClick(e) {
    if (!e.target.classList.contains("editBtn")) return;

    const id = Number(e.target.dataset.id);
    const elements = getElements();
    const { view, config } = getConfig();

    try {
        const data = await fetchOne(view, id);
        originalData = data;
        editModeId = id;

        elements.modalTitle.textContent = "Редактирай запис";

        setupVisibleFields(config);

        await initJsonSchemaEditor(
            elements.jsonEditorHolder,
            view,
            "update",
            data
        );

        await preloadDropdowns(data, elements);

        toggleJsonSchemaEditor(elements, true);

        showModal(elements);

    } catch (err) {
        alert("Грешка при зареждане на данни за редакция");
        console.error(err);
    }
}

function bindEvents(loadData, elements) {
    elements.addBtn.addEventListener("click", openModal);
    elements.cancelBtn.addEventListener("click", closeModal);
    elements.saveBtn.addEventListener("click", withLock(elements.saveBtn, () => saveModal(loadData)));
    elements.tableBody.addEventListener("click", handleEditClick);
}

function initModal(loadData) {
    const elements = getElements();

    resetMunicipalityAndMayorality(elements.municipalitySelect, elements.mayoraltySelect);

    initDropdownHandlers(
        elements.regionSelect,
        elements.municipalitySelect,
        elements.mayoraltySelect,
        elements.codeInput
    );

    bindEvents(
        loadData,
        elements
    );
}

export {
    buildPkPayload,
    initModal
};
