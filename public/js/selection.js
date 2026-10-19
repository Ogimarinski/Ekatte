import { updateDeleteButton } from "./ui.js";
import { parseUrlParams } from "./url.js";
import { deleteItems } from "./api.js";
import {
    getSelectedIds,
    addSelectedId,
    removeSelectedId,
    clearSelectedIds
} from "./list.js";
import { withLock } from "./utils/formFeedback.js";

async function handleDeleteBtn(loadData) {
    const ids = Array.from(getSelectedIds());
    const { view } = parseUrlParams();

    if (!confirm(`Сигурни ли сте, че искате да изтриете ${ids.length} записа?`)) return;

    try {
        await deleteItems(view, ids);
        clearSelectedIds();
        await loadData();
    } catch (err) {
        console.error(err);
    }
}

function handleCheckBox(e, deleteBtn) {
    if (e.target.classList.contains("rowCheckbox")) {
        const id = e.target.value;
        e.target.checked ? addSelectedId(id) : removeSelectedId(id);
        updateDeleteButton(deleteBtn, getSelectedIds());
    }
}

function handleSelectAll(e, deleteBtn) {
    if (e.target.id === "selectAll") {
        const isChecked = e.target.checked;
        const checkBoxes = document.querySelectorAll(".rowCheckbox");

        checkBoxes.forEach(cb => {
            cb.checked = isChecked;
            if (isChecked) {
                addSelectedId(cb.value);
            } else {
                removeSelectedId(cb.value);
            }
        });

        updateDeleteButton(deleteBtn, getSelectedIds());
    }
}

export function initSelection(loadData) {
    const tableBody = document.getElementById("tableBody");
    const deleteBtn = document.getElementById("deleteSelectedBtn");

    deleteBtn.addEventListener("click", withLock(deleteBtn, () => handleDeleteBtn(loadData)));

    tableBody.addEventListener("change", (e) => handleCheckBox(e, deleteBtn));

    document.addEventListener("change", (e) => handleSelectAll(e, deleteBtn));
}