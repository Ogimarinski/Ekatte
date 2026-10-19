import { initClimateDashboardVisibility, renderFilters, setActiveNav } from "./ui.js";
import { loadFilterOptions, initFilters } from "./filter.js";
import { initModal } from "./modal.js";
import { initPagination } from "./pagination.js";
import { initSearch } from "./search.js";
import { initSorting } from "./sorting.js";
import { initExport } from "./export.js";
import { initSelection } from "./selection.js";
import { loadData, getCurrentPage, initList } from "./list.js";
import { loadStats } from "./stats.js";
import { initClimate } from "./climate.js";
import { redirectIfUnauthenticated } from "./auth/auth.guard.js";

async function init() {

    renderFilters();

    initList();

    initFilters(loadData);
    initSearch(loadData);
    initPagination(loadData, getCurrentPage);
    initSorting(loadData);

    initModal(loadData);
    initExport();
    initSelection(loadData);
    initClimate();
    initClimateDashboardVisibility();

    await Promise.all([
        loadFilterOptions(),
        loadData(),
        loadStats()
    ]);

    setActiveNav(
        document.querySelectorAll(".nav a"),
        window.location.pathname === "/" ? "/regions" : window.location.pathname
    );
}

if (!redirectIfUnauthenticated()) {
    init();
}