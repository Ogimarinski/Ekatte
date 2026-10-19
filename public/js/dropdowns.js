import { fetchOptions } from "./api.js";
import { dropdownPlaceholders } from "./config.js";
import { populateSelect } from "./ui.js";

function getDefaultOption(text) {
    return `<option value="" disabled selected>${text}</option>`;
}

function resetMunicipalityAndMayorality(municipalitySelect, mayoraltySelect) {
    municipalitySelect.innerHTML = getDefaultOption(dropdownPlaceholders.municipalityFirst);
    mayoraltySelect.innerHTML = getDefaultOption(dropdownPlaceholders.mayoralityFirst);
}

function resetMayorality(mayoraltySelect) {
    mayoraltySelect.innerHTML = getDefaultOption(dropdownPlaceholders.mayorality);
}

//добавям като първа опция на кмествата, самата община
function prepareMayoralityResults(resource, data, parentMeta) {

    return [
        {
            id: "municipality",
            name: parentMeta.name,
            code: `${parentMeta.code}-00`
        },
        ...data
    ];
}

async function loadOptions(resource, select, parentId = null, parentParam = "", parentMeta = null) {
    try {
        let results = await fetchOptions(resource, parentId, parentParam);

        if (resource === "mayoralties" && parentMeta) {
            results = prepareMayoralityResults(resource, results, parentMeta);
        }

        populateSelect(select, results);


    } catch (err) {
        console.error(`Грешка при зареждане на ${resource}:`, err);
    }
}


async function handleRegionChange(regionSelect, municipalitySelect, mayoraltySelect) {
    const regionId = regionSelect.value;
    resetMunicipalityAndMayorality(municipalitySelect, mayoraltySelect);

    if (regionId) {
        await loadOptions(
            "municipalities",
            municipalitySelect,
            regionId,
            "region_id"
        );
    }
}

async function handleMunicipalityChange(municipalitySelect, mayoraltySelect) {
    const municipalityId = municipalitySelect.value;
    resetMayorality(mayoraltySelect);

    if (municipalityId) {
        const selected = municipalitySelect.selectedOptions[0];

        await loadOptions(
            "mayoralties",
            mayoraltySelect,
            municipalityId,
            "municipality_id",
            {
                name: selected.textContent,
                code: selected.dataset.code
            }
        );
    }
}

function bindDropdownEvents(regionSelect, municipalitySelect, mayoraltySelect) {
    regionSelect.addEventListener(
        "change",
        async () => {
            await handleRegionChange(
                regionSelect,
                municipalitySelect,
                mayoraltySelect
            );

        }
    );

    municipalitySelect.addEventListener(
        "change",
        async () => {
            await handleMunicipalityChange(
                municipalitySelect,
                mayoraltySelect
            );
        }
    );

}

function initDropdownHandlers(regionSelect, municipalitySelect, mayoraltySelect, codeInput) {
    bindDropdownEvents(regionSelect, municipalitySelect, mayoraltySelect, codeInput);
}

export {
    loadOptions,
    resetMunicipalityAndMayorality,
    getDefaultOption,
    handleRegionChange,
    handleMunicipalityChange,
    initDropdownHandlers
}