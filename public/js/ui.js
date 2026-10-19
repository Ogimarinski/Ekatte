import { tableConfigs, filterConfigs, viewTranslations, dropdownPlaceholders, countryLabels } from "./config.js";
import { parseUrlParams } from "./url.js";
import { getDefaultOption } from "./dropdowns.js";

export function initClimateDashboardVisibility() {
    const { view } = parseUrlParams();
    const btn = document.getElementById("climateDashboardBtn");

    btn.hidden = view !== "settlements";
}

export function updatePageText() {
    const { view } = parseUrlParams();
    const translation = viewTranslations[view] || viewTranslations.settlements;

    document.getElementById("pageTitle").textContent = translation.title;
    document.getElementById("searchInput").placeholder = translation.placeholder;
}

export function getSortIcon(key) {
    const params = parseUrlParams();

    const sort = params.sort;

    const index = sort.findIndex(s => s.key === key);

    if (index === -1) return "";

    const order = params.sort[index].order;
    const arrow = order === "asc" ? "↑" : "↓";

    return ` ${arrow}${index + 1}`;
}

function getFilterPlaceholder(filter) {
    if (filter.key === "municipality_id") {
        return dropdownPlaceholders.municipalityFirst;
    }

    if (filter.key === "mayorality_id") {
        return dropdownPlaceholders.mayoralityFirst;
    }

    return `--${filter.placeholder}--`;
}

export function renderFilters() {
    const { view } = parseUrlParams();
    const config = filterConfigs[view] || [];

    const filtersContainer = document.getElementById("filtersContainer");

    filtersContainer.innerHTML = "";
    const title = document.createElement("h3");
    title.textContent = "Филтри";
    title.classList.add("filters-title");

    filtersContainer.appendChild(title);


    const temperatureContainer = document.createElement("div");
    temperatureContainer.classList.add("temperature-filters");

    config.forEach(filter => {
        let element;

        if (filter.type === "select") {
            const label = document.createElement("label");
            label.htmlFor = filter.key;
            label.textContent = filter.label;
            label.classList.add("filter-label");

            filtersContainer.appendChild(label);
            element = document.createElement("select");
            element.id = filter.key;

            const options = document.createElement("option");
            options.value = "";
            options.textContent = getFilterPlaceholder(filter);

            element.appendChild(options);

            if (filter.options) {
                filter.options.forEach(option => {
                    const optionElement = document.createElement("option");

                    optionElement.value = option.value;
                    optionElement.textContent = option.text;

                    element.appendChild(optionElement);
                });
            }

            filtersContainer.appendChild(element);
        }

        if (filter.type === "numberRange") {
            const filterGroup = document.createElement("div");
            filterGroup.classList.add("temperature-filter");

            const label = document.createElement("label");
            label.textContent = filter.label;
            label.classList.add("filter-label");

            const wrapper = document.createElement("div");
            wrapper.classList.add("number-range");

            const fromInput = document.createElement("input");
            fromInput.type = "number";
            fromInput.step = "0.01";
            fromInput.placeholder = "От";
            fromInput.id = `${filter.key}_from`;

            const toInput = document.createElement("input");
            toInput.type = "number";
            toInput.step = "0.01";
            toInput.placeholder = "До";
            toInput.id = `${filter.key}_to`;

            wrapper.appendChild(fromInput);
            wrapper.appendChild(toInput);

            filterGroup.appendChild(label);
            filterGroup.appendChild(wrapper);

            temperatureContainer.appendChild(filterGroup);
        }

        if (filter.type === "date") {
            const filterGroup = document.createElement("div");
            filterGroup.classList.add("temperature-filter");

            const label = document.createElement("label");
            label.textContent = filter.label;
            label.classList.add("filter-label");

            const wrapper = document.createElement("div");
            wrapper.classList.add("date-range");

            const fromDate = document.createElement("input");
            fromDate.type = "date";
            fromDate.id = `${filter.key}_from`;
            fromDate.placeholder = "От дата";

            const toDate = document.createElement("input");
            toDate.type = "date";
            toDate.id = `${filter.key}_to`;
            toDate.placeholder = "До дата";

            wrapper.appendChild(fromDate);
            wrapper.appendChild(toDate);

            filterGroup.appendChild(label);
            filterGroup.appendChild(wrapper);

            temperatureContainer.appendChild(filterGroup);
        }
    });

    filtersContainer.appendChild(temperatureContainer);

    const filterBtn = document.createElement('button');
    filterBtn.id = "filterBtn";
    filterBtn.textContent = "Филтрирай";

    const clearFiltersBtn = document.createElement("button");
    clearFiltersBtn.id = "clearFiltersBtn";
    clearFiltersBtn.textContent = "Изчисти";

    filtersContainer.appendChild(filterBtn);
    filtersContainer.appendChild(clearFiltersBtn);
}

export function renderTable(data, tableBody) {
    const params = parseUrlParams();
    const currentView = params.view;
    const config = tableConfigs[currentView];

    const isExpandable = currentView === "settlements";
    const columntCount = config.length + (isExpandable ? 3 : 2);

    const tableHead = document.getElementById("tableHead");
    tableHead.innerHTML = `
        <tr>
            ${isExpandable ? "<th></th>" : ""}
            <th><input type="checkbox" id="selectAll"></th>
            ${config.map(col => `
                <th data-sort="${col.key}" style="cursor:pointer">${col.label}${getSortIcon(col.key)}</th>
            `).join("")}
            <th>Редактирай</th>
        </tr>
    `;

    tableBody.innerHTML = "";

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="${columntCount}">Няма резултати</td></tr>`;
        return;
    }

    //Добавям много елементи наведнъж без излишни DOM update-ти
    const fragment = document.createDocumentFragment();

    data.forEach(row => {
        const id = row.id;
        const tr = document.createElement("tr");
        tr.style.cursor = "pointer";

        // Попълваме клетките само с ключовете, дефинирани в tableConfigs
        const cellsHtml = config.map(col => {
            let value = row[col.key] ?? "-";

            if (col.key === 'updated_at' && value !== '-') {
                value = new Date(value).toLocaleString("bg-Bg");
            }

            if (col.key === "country_code" && value !== "-") {
                value = countryLabels[value] ?? value;
            }

            if (["avg_temperature", "min_temperature", "max_temperature"].includes(col.key) && value !== "-") {
                value = Number(value).toFixed(2);
            }
            return `<td>${value}</td>`;
        }).join("");

        const editBtn = `<button class="editBtn" data-id="${id}">✏️</button>`;

        tr.innerHTML = `
            ${isExpandable ? `<td><button class="expandBtn" data-id="${id}">+</button></td>` : ""}
            <td><input type="checkbox" class="rowCheckbox" value="${id}"></td>
            ${cellsHtml}
            <td>${editBtn}</td>
        `;

        fragment.appendChild(tr);
    });

    tableBody.appendChild(fragment);
}

const YEARS_SORT_COLUMNS = [
    { key: "year", label: "Година" },
    { key: "avg_temperature", label: "Средна (°C)" },
    { key: "min_temperature", label: "Минимална (°C)" },
    { key: "max_temperature", label: "Максимална (°C)" }
];

export function renderYears(years, row, settlementId, sortState = null) {
    const yearsRow = document.createElement("tr");
    yearsRow.classList.add("years-row");
    yearsRow.dataset.settlementId = settlementId;

    const headerCells = YEARS_SORT_COLUMNS.map(column => {
        const isActive = sortState?.column === column.key;
        const arrow = isActive ? (sortState.direction === "asc" ? " ▲" : " ▼") : "";

        return `<th class="sortable" data-years-sort="${column.key}">${column.label}${arrow}</th>`;
    }).join("");

    yearsRow.innerHTML = `
        <td colspan="${row.cells.length}">
            <div class="years-container">
                <table class="years-table">
                    <thead>
                        <tr>
                            <th></th>
                            ${headerCells}
                        </tr>
                    </thead>

                    <tbody>
                        ${years.map(year => `
                            <tr class="year-row">
                                <td>
                                    <button
                                        class="expandBtn"
                                        data-id="${settlementId}"
                                        data-year="${year.year}">
                                        +
                                    </button>
                                </td>

                                <td>${year.year}</td>
                                <td>${year.avg_temperature}</td>
                                <td>${year.min_temperature}</td>
                                <td>${year.max_temperature}</td>
                            </tr>
                        `).join("")}
                    </tbody>

                </table>

            </div>
        </td>
    `;

    return yearsRow;
}

const monthNames = {
    1: "Януари",
    2: "Февруари",
    3: "Март",
    4: "Април",
    5: "Май",
    6: "Юни",
    7: "Юли",
    8: "Август",
    9: "Септември",
    10: "Октомври",
    11: "Ноември",
    12: "Декември"
};

export function renderMonths(months, row, settlementId) {
    const monthsRow = document.createElement("tr");
    monthsRow.classList.add("months-row");
    monthsRow.dataset.settlementId = settlementId;

    monthsRow.innerHTML = `
        <td colspan="${row.cells.length}">
            <div class="months-container">

                <div class="months-header">
                    <div>Месец</div>
                    <div>Средна</div>
                    <div>Минимална</div>
                    <div>Максимална</div>
                </div>

                ${months.map(month => `
                    <div class="month-row">
                        <div>${monthNames[month.month]}</div>
                        <div>${month.avg_temperature}</div>
                        <div>${month.min_temperature}</div>
                        <div>${month.max_temperature}</div>
                    </div>
                `).join("")}

            </div>
        </td>
    `;

    return monthsRow;
}

export function updateDeleteButton(deleteBtn, selectedIds) {
    deleteBtn.disabled = selectedIds.size === 0;
}

export function getPlaceholderBySelectId(selectId) {
    if (selectId.includes("region")) {
        return dropdownPlaceholders.region;
    }

    if (selectId.includes("municipality")) {
        return dropdownPlaceholders.municipality;
    }

    if (selectId.includes("mayorality")) {
        return dropdownPlaceholders.mayorality;
    }

    return dropdownPlaceholders.default;
}

export function populateSelect(select, data) {
    const placeholder = getPlaceholderBySelectId(select.id);

    select.innerHTML = getDefaultOption(placeholder);

    data.forEach(item => {
        const opt = document.createElement("option");

        opt.value = item.id || item.ekatte;
        opt.textContent = item.name;
        opt.dataset.code = item.code;

        select.appendChild(opt);
    });
}

export function setActiveNav(links, currentPath) {
    links.forEach(link => {
        if (link.getAttribute("href") === currentPath) {
            link.classList.add("active");
        }
    });
}
