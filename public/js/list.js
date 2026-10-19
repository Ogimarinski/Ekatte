import { fetchData } from "./api.js";
import { renderTable, updateDeleteButton, updatePageText } from "./ui.js";
import { parseUrlParams } from "./url.js";

let selectedIds = new Set();
let currentPage = 1;

function getDomElements() {
    return {
        searchInput: document.getElementById("searchInput"),
        prevButton: document.getElementById("prevPage"),
        nextButton: document.getElementById("nextPage"),
        currentPageSpan: document.getElementById("currentPage"),
        totalPageSpan: document.getElementById("totalPages"),
        resultsCounter: document.getElementById("resultsCounter"),
        tableBody: document.getElementById("tableBody"),
        deleteBtn: document.getElementById("deleteSelectedBtn")
    };
}

export async function loadData() {
    const {
        searchInput,
        prevButton,
        nextButton,
        currentPageSpan,
        totalPageSpan,
        resultsCounter,
        tableBody,
        deleteBtn
    } = getDomElements();

    const params = parseUrlParams();
    currentPage = params.page;

    updatePageText();
    searchInput.value = params.query || "";

    try {
        const data = await fetchData();

        console.log(data);
        console.log("count:", data.count);
        console.log("limit:", data.limit);
        console.log("totalPages:", Math.ceil(data.count / data.limit));
        const totalPages = Math.ceil(data.count / data.limit);

        prevButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= totalPages;

        currentPageSpan.textContent =
            `${currentPage}`;

        totalPageSpan.textContent = `${totalPages}`;

        resultsCounter.textContent =
            `Резултати: ${data.count}`;

        renderTable(data.results, tableBody);

        selectedIds.clear();

        updateDeleteButton(deleteBtn, selectedIds);

        return true;
    } catch (err) {
        console.error(err);

        return false;
    }
}

export function getCurrentPage() {
    return currentPage;
}

export function getSelectedIds() {
    return new Set(selectedIds);
}

export function addSelectedId(id) {
    selectedIds.add(id);
}

export function removeSelectedId(id) {
    selectedIds.delete(id);
}

export function clearSelectedIds() {
    selectedIds.clear();
}

export function initList() {
    window.addEventListener("popstate", () => {
        loadData();
    });
}

