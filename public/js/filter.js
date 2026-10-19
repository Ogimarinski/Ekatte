import { parseUrlParams, updateUrlParams } from "./url.js";
import { handleRegionChange, handleMunicipalityChange, loadOptions } from "./dropdowns.js";
import { isValidDateFormat } from "./utils/dateFormatValidation.js";

function applyFilters(loadData) {
    const params = parseUrlParams();

    const sortParams = params.sort.map(s => `${s.key}:${s.order}`).join(",");

    const newParams = {
        page: 1,
        query: params.query,
        sort: sortParams
    };

    const filters = document.querySelectorAll("#filtersContainer input, #filtersContainer select");

    for (const filter of filters) {
        if (filter.type === "date" && !isValidDateFormat(filter.value)) {
            alert("Моля, изберете валидна дата.");
            return;
        }
    }


    filters.forEach(filter => {
        if (filter.value && filter.value.trim() !== "") {
            if (filter.id === "mayorality_id" && filter.value === "municipality") {
                newParams["has_no_mayorality"] = "true";
            } else {
                newParams[filter.id] = filter.value.trim();
            }
        }
    });

    const newUrl = updateUrlParams(newParams);

    window.history.pushState({}, "", newUrl);
    loadData();
}

async function clearFilters(loadData) {
    const params = parseUrlParams();

    const sortParams = params.sort
        .map(p => `${p.key}:${p.order}`).join(",");

    const filters = document.querySelectorAll("#filtersContainer input, #filtersContainer select");

    const newParams = {
        page: 1,
        query: params.query,
        sort: sortParams
    };

    filters.forEach(filter => {
        if (filter.id === "mayorality_id" && filter.value === "municipality") {
            newParams["has_no_mayorality"] = "";
        } else {
            newParams[filter.id] = "";
        }
        filter.value = "";

        if (filter.type === "date") {
            filter.removeAttribute("min");
            filter.removeAttribute("max");
        }
    });

    const newUrl = updateUrlParams(newParams);

    window.history.pushState({}, "", newUrl);
    loadData();
    loadFilterOptions();
}

function handleRangeInputs(e) {
    if (!e.target.id.endsWith("_from") && !e.target.id.endsWith("_to"))
        return;

    const isFrom = e.target.id.endsWith("_from");

    const otherInput = document.getElementById(
        e.target.id.replace(
            isFrom ? "_from" : "_to",
            isFrom ? "_to" : "_from"
        )
    );

    if (!otherInput)
        return;

    if (e.target.type === "date") {
        if (isFrom) {
            if (e.target.value) {
                otherInput.min = e.target.value;

                if (otherInput.value < e.target.value)
                    otherInput.value = "";
            } else {
                otherInput.removeAttribute("min");
            }
        } else {
            if (e.target.value) {
                otherInput.max = e.target.value;
            } else {
                otherInput.removeAttribute("max");
            }
        }

        return;
    }

    if (e.target.type === "number") {
        if (otherInput.value && (isFrom ? Number(otherInput.value) < Number(e.target.value) : Number(otherInput.value) > Number(e.target.value))) {
            otherInput.value = "";
        }
    }
}

function initFilters(loadData) {
    document.addEventListener("click", e => {
        if (e.target.id === "filterBtn") {
            applyFilters(loadData);
        }

        if (e.target.id === "clearFiltersBtn") {
            clearFilters(loadData);
        }
    });

    document.addEventListener("change", async (e) => {
        const { view } = parseUrlParams();

        handleRangeInputs(e);

        if (view === "settlements") {
            if (e.target.id === "region_id") {
                await handleRegionChange(
                    document.getElementById("region_id"),
                    document.getElementById("municipality_id"),
                    document.getElementById("mayorality_id")
                );
            }

            if (e.target.id === "municipality_id") {
                await handleMunicipalityChange(
                    document.getElementById("municipality_id"),
                    document.getElementById("mayorality_id")
                );
            }
        }

    });
}

async function loadFilterOptions() {
    const { view } = parseUrlParams();
    if (view === "municipalities") {
        await loadOptions("regions", document.getElementById("region_id"));
    }

    if (view === "settlements") {
        await loadOptions("regions", document.getElementById("region_id"));
        await loadOptions("municipalities", document.getElementById("municipality_id"));
        await loadOptions("mayoralties", document.getElementById("mayorality_id"));
    }

    if (view === "mayoralties") {
        await loadOptions("municipalities", document.getElementById("municipality_id"));
    }
}

export {
    loadFilterOptions,
    initFilters,
    applyFilters,
    clearFilters,
};
