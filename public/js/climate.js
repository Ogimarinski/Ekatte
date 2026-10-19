import { fetchSettlementClimateYears, fetchSettlementClimateMonths } from "./api.js";
import { renderMonths, renderYears } from "./ui.js";

const yearsCache = new Map();
const monthsCache = new Map();
const yearsSortState = new Map();

function getMonthsCacheKey(id, year) {
    return `${id}-${year}`;
}

// Сортира клиентски вече заредения (некеширан отделно за sort) years масив.
// Данните за едно settlement са малко (десетки редове), затова не пращаме
// заявка към бекенда при всеки клик върху хедър — сортираме наличното.
function sortYears(years, sortState) {
    if (!sortState) {
        return years;
    }

    const { column, direction } = sortState;
    const factor = direction === "desc" ? -1 : 1;

    return [...years].sort((a, b) => (a[column] - b[column]) * factor);
}

// Затваряне на ГОДИНА: маха само нейния months-row (максимум 1 дете)
function collapseIfOpen(row, siblingClass, button) {
    const existing = row.nextElementSibling;

    if (existing?.classList.contains(siblingClass)) {
        existing.remove();
        button.textContent = "+";
        return true;
    }

    return false;
}

// Затваряне на СЕЛИЩЕ: маха всички негови years-row-ове,
// включително всеки months-row, отворен под тях
function collapseSettlementRows(row, settlementId, button) {
    let sibling = row.nextElementSibling;

    if (sibling?.dataset.settlementId !== settlementId) {
        return false;
    }

    while (sibling?.dataset.settlementId === settlementId) {
        const toRemove = sibling;
        sibling = sibling.nextElementSibling;
        toRemove.remove();
    }

    button.textContent = "+";
    return true;
}

async function expandSettlement(button, row) {
    const settlementId = button.dataset.id;

    let years;

    if (yearsCache.has(settlementId)) {
        years = yearsCache.get(settlementId);
    } else {
        years = await fetchSettlementClimateYears(settlementId);
        yearsCache.set(settlementId, years);
    }

    console.log(years);

    const sortState = yearsSortState.get(settlementId) ?? null;
    const yearsRow = renderYears(sortYears(years, sortState), row, settlementId, sortState);

    row.after(yearsRow);

    button.textContent = "-";
}

// Клик върху сортируем хедър в под-таблицата на годините.
// Връща true, ако е обработил клика (за да спре по-нататъшната обработка в handleExpand).
function handleYearsSort(e) {
    const th = e.target.closest("th[data-years-sort]");

    if (!th) {
        return false;
    }

    const yearsRow = th.closest(".years-row");
    const settlementId = yearsRow?.dataset.settlementId;
    const years = settlementId && yearsCache.get(settlementId);

    if (!years) {
        return false;
    }

    const column = th.dataset.yearsSort;
    const current = yearsSortState.get(settlementId);
    const direction = current?.column === column && current.direction === "asc" ? "desc" : "asc";
    const sortState = { column, direction };

    yearsSortState.set(settlementId, sortState);

    // settlementRow трябва на renderYears само за row.cells.length (colspan)
    const settlementRow = yearsRow.previousElementSibling;
    const newYearsRow = renderYears(sortYears(years, sortState), settlementRow, settlementId, sortState);

    // replaceWith маха и всеки отворен months-row, вложен вътре в старата years-row —
    // очаквано поведение: пресортирането затваря разгънат месец под старата подредба.
    yearsRow.replaceWith(newYearsRow);

    return true;
}

async function expandYear(button, row) {
    const settlementId = button.dataset.id;
    const year = button.dataset.year;

    const key = getMonthsCacheKey(settlementId, year);

    let months;

    if (monthsCache.has(key)) {
        months = monthsCache.get(key);
    } else {
        months = await fetchSettlementClimateMonths(settlementId, year);
        monthsCache.set(key, months);
    }

    const monthsRow = renderMonths(months, row, settlementId);

    row.after(monthsRow);

    button.textContent = "-";
}

async function handleExpand(e) {
    if (handleYearsSort(e)) {
        return;
    }

    if (!e.target.classList.contains("expandBtn")) {
        return;
    }

    const button = e.target;
    const row = button.closest("tr");
    const settlementId = button.dataset.id;
    const year = button.dataset.year;

    if (year) {
        if (collapseIfOpen(row, "months-row", button)) {
            return;
        }

        await expandYear(button, row);
        return;
    }

    if (collapseSettlementRows(row, settlementId, button)) {
        return;
    }

    await expandSettlement(button, row);
}

export function initClimate() {
    document.getElementById("tableBody").addEventListener("click", handleExpand);
}
