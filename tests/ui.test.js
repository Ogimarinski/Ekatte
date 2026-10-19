/**
 * @jest-environment jsdom
 */
import { renderTable, renderMonths, updateDeleteButton, populateSelect, setActiveNav, getSortIcon, updatePageText, renderFilters, getPlaceholderBySelectId, renderYears } from "../public/js/ui.js";
import * as urlUtils from "../public/js/url.js";
import { dropdownPlaceholders, tableConfigs, } from "../public/js/config.js";

jest.mock("../public/js/url.js");
jest.mock("../public/js/config.js", () => ({
    tableConfigs: {
        settlements: [
            { label: "Име", key: "name" },
            { label: "Код", key: "code" }
        ],
        regions: [
            { label: "Име", key: "name" }
        ]
    },
    viewTranslations: {
        settlements: {
            title: "Търсене на населено място",
            placeholder: "Търси населено място по име..."
        }
    },
    filterConfigs: {
        settlements: [
            {
                key: "country_code", type: "select", placeholder: "Държава", label: "Държава", options: [
                    { value: "BG", text: "България" },
                    { value: "CN", text: "Китай" }
                ]
            },
            { key: "region_id", type: "select", placeholder: "Област" },
            { key: "municipality_id", type: "select", placeholder: "Община" },
            { key: "mayorality_id", type: "select", placeholder: "Кметство" },
            { key: "updated_at", type: "date" },
            { key: "region_id", type: "select", placeholder: "Област", label: "Област" },
            { key: "updated_at", type: "date", label: "Последна промяна" },
            { key: "avg_temperature", type: "numberRange", label: "Средна температура" }
        ]
    },
    dropdownPlaceholders: {
        municipalityFirst: "-- Първо избери област --",
        mayoralityFirst: "-- Първо избери община --",
        default: "-- Избери --"
    },
    countryLabels: {
        BG: "България",
        CN: "Китай"
    },
}));

describe("updatePageText", () => {
    test("updatePageText updates title and placeholder", () => {
        document.body.innerHTML = `
        <h1 id="pageTitle"></h1>
        <input id="searchInput"/>
        `;

        urlUtils.parseUrlParams.mockReturnValue({
            view: "settlements"
        });

        updatePageText();
        expect(document.getElementById("pageTitle").textContent).toBe("Търсене на населено място");
        expect(document.getElementById("searchInput").placeholder).toBe("Търси населено място по име...");
    });

    test("updatePageText should use settlement for view if there is no translation", () => {
        document.body.innerHTML = `
        <h1 id="pageTitle"></h1>
        <input id="searchInput"/>
        `;

        urlUtils.parseUrlParams.mockReturnValue({
            view: ""
        });

        updatePageText();
        expect(document.getElementById("pageTitle").textContent).toBe("Търсене на населено място");
        expect(document.getElementById("searchInput").placeholder).toBe("Търси населено място по име...");
    });
});

describe("renderFilters", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="filtersContainer"></div>
        `;

        urlUtils.parseUrlParams.mockReturnValue({
            view: "settlements"
        });
    });

    test("should render text, select, date filters and buttons", () => {
        renderFilters();

        //const textInput = document.querySelector('input[type="text"]');
        //expect(textInput).toBeTruthy();

        const select = document.querySelector("select");
        expect(select).toBeTruthy();

        const defaultOption = select.querySelector("option");
        expect(defaultOption.value).toBe("");
        expect(defaultOption.textContent).toContain("--");

        const fromDate = document.querySelector('input[id$="_from"]');
        const toDate = document.querySelector('input[id$="_to"]');

        expect(fromDate).toBeTruthy();
        expect(toDate).toBeTruthy();

        const wrapper = document.querySelector(".date-range");
        expect(wrapper).toBeTruthy();

        expect(document.getElementById("filterBtn")).toBeTruthy();
        expect(document.getElementById("clearFiltersBtn")).toBeTruthy();
    });

    test("should render number range filter", () => {
        renderFilters();

        const from = document.getElementById("avg_temperature_from");
        const to = document.getElementById("avg_temperature_to");

        expect(from).toBeTruthy();
        expect(to).toBeTruthy();

        expect(from.type).toBe("number");
        expect(to.type).toBe("number");

        expect(from.placeholder).toBe("От");
        expect(to.placeholder).toBe("До");

        const wrapper = from.closest(".number-range");
        expect(wrapper).toBeTruthy();

        const filterGroup = from.closest(".temperature-filter");
        expect(filterGroup).toBeTruthy();
    });

    test("should render extra options for select filters with options config", () => {
        renderFilters();

        const select = document.getElementById("country_code");

        expect(select).toBeTruthy();

        const options = select.querySelectorAll("option");

        expect(options.length).toBe(3);

        expect(options[1].value).toBe("BG");
        expect(options[1].textContent).toBe("България");

        expect(options[2].value).toBe("CN");
        expect(options[2].textContent).toBe("Китай");

    });

    test("should clear old filters before rendering", () => {
        const container = document.getElementById("filtersContainer");

        container.innerHTML = `<p>Old content</p>`;

        renderFilters();

        expect(container.textContent).not.toContain("Old content");
    });

    test("should still render buttons when no filters config exists", () => {
        urlUtils.parseUrlParams.mockReturnValue({
            view: "unknown"
        });

        renderFilters();

        expect(document.getElementById("filterBtn")).toBeTruthy();
        expect(document.getElementById("clearFiltersBtn")).toBeTruthy();
    });
});

describe("getSortIcon", () => {
    test("getSortIcon returns empty string when no sort", () => {
        urlUtils.parseUrlParams.mockReturnValue({
            sort: []
        });

        expect(getSortIcon("name")).toBe("");
    });

    test("getSortIcon returns ↑1 for first asc sort", () => {
        urlUtils.parseUrlParams.mockReturnValue({
            sort: [{ key: "name", order: "asc" }]
        });

        expect(getSortIcon("name")).toBe(" ↑1");
    });

    test("getSortIcon returns ↓1 for first desc sort", () => {
        urlUtils.parseUrlParams.mockReturnValue({
            sort: [{ key: "name", order: "desc" }]
        });

        expect(getSortIcon("name")).toBe(" ↓1");
    });

    test("getSortIcon returns correct priority index", () => {
        urlUtils.parseUrlParams.mockReturnValue({
            sort: [
                { key: "id", order: "asc" },
                { key: "name", order: "desc" }
            ]
        });

        expect(getSortIcon("id")).toBe(" ↑1");
        expect(getSortIcon("name")).toBe(" ↓2");
    });
});

describe("renderTable", () => {
    let tableBody, tableHead;

    beforeEach(() => {
        document.body.innerHTML = `
            <table>
                <thead id="tableHead"></thead>
                <tbody id="tableBody"></tbody>
            </table>
        `;
        tableBody = document.getElementById("tableBody");
        tableHead = document.getElementById("tableHead");

        // Симулирам, че сме в изглед "settlements"
        urlUtils.parseUrlParams.mockReturnValue({
            view: "settlements",
            sort: []
        });
    });

    test("should render 'No results' message when data is empty", () => {
        renderTable([], tableBody);
        expect(tableBody.textContent).toContain("Няма резултати");
    });

    test("should render correct headers and rows", () => {
        const mockData = [
            { id: 1, name: "Test", code: "t1" }
        ];

        renderTable(mockData, tableBody);

        const headers = tableHead.querySelectorAll("th");
        expect(headers[2].textContent).toContain("Име");
        expect(headers[3].textContent).toContain("Код");

        const rows = tableBody.querySelectorAll("tr");
        expect(rows.length).toBe(1);

        const cells = rows[0].querySelectorAll("td");
        expect(cells[2].textContent).toContain("Test");
        expect(cells[3].textContent).toContain("t1");
        expect(cells[4].querySelector(".editBtn")).toBeTruthy();
    });

    test("should render expand button for settlements only", () => {
        renderTable([{ id: 7, name: "Sofia" }], tableBody);

        const button = tableBody.querySelector(".expandBtn");

        expect(button).toBeTruthy();
        expect(button.dataset.id).toBe("7");
    });

    test("should not render expand column for views without climate data", () => {
        urlUtils.parseUrlParams.mockReturnValue({ view: "regions", sort: [] });

        renderTable([{ id: 10, name: "София" }], tableBody);

        expect(tableBody.querySelector(".expandBtn")).toBeNull();
        expect(tableHead.querySelectorAll("th")).toHaveLength(3);
        expect(tableHead.querySelector("th").querySelector("#selectAll")).toBeTruthy();
    });

    test.each([
        ["settlements"],
        ["regions"]
    ])("should span all columns in 'No result' row for %s", (view) => {
        urlUtils.parseUrlParams.mockReturnValue({ view, sort: [] });

        renderTable([], tableBody);

        const cells = tableBody.querySelector("td");

        expect(Number(cells.getAttribute("colspan"))).toBe(tableHead.querySelectorAll("th").length);
    });

    test("should render dash when value is null or missing", () => {
        const data = [
            { id: 1, name: "Name", code: null }
        ];
        renderTable(data, tableBody);

        const row = tableBody.querySelector("tr");

        const dashCell = [...row.querySelectorAll("td")]
            .find(td => td.textContent.trim() === "-");

        expect(dashCell).toBeTruthy();
    });

    test("should format updated_at", () => {
        tableConfigs.settlements = [
            { label: "Name", key: "name" },
            { label: "Changed", key: "updated_at" }
        ];

        const data = [
            {
                id: 1, name: "Name", updated_at: "2026-04-29T10:30:00.000Z"
            }
        ];

        renderTable(data, tableBody);
        const expected = new Date("2026-04-29T10:30:00.000Z")
            .toLocaleString("bg-Bg");

        const row = tableBody.querySelector("tr");

        expect(row.textContent).toContain(expected);
    });

    test("should format temperature cells", () => {
        tableConfigs.settlements = [
            { label: "Avg", key: "avg_temperature" },
            { label: "Min", key: "min_temperature" },
            { label: "Max", key: "max_temperature" }
        ];

        const data = [
            {
                avg_temperature: "13.3333",
                min_temperature: "12.1",
                max_temperature: "11.22"
            }
        ];

        renderTable(data, tableBody);

        expect(tableBody.textContent).toContain("13.33");
        expect(tableBody.textContent).toContain("12.10");
        expect(tableBody.textContent).toContain("11.22");
    });

    test("should map country_code to label", () => {
        tableConfigs.settlements = [
            { label: "Държава", key: "country_code" }
        ];

        const data = [
            { country_code: "BG" },
            { country_code: "XX" },
            { country_code: null }
        ];

        renderTable(data, tableBody);

        expect(tableBody.textContent).toContain("България");
        expect(tableBody.textContent).toContain("XX");
        expect(tableBody.textContent).toContain("-");

    });
});

describe("updateDeleteButton", () => {
    let btn;

    beforeEach(() => {
        // Създавам бутон преди всеки тест
        document.body.innerHTML = '<button id="deleteBtn"></button>';
        btn = document.getElementById("deleteBtn");
    });

    test("should disable button when no IDs are selected (size 0)", () => {
        const selectedIds = new Set();
        updateDeleteButton(btn, selectedIds);
        expect(btn.disabled).toBe(true);
    });

    test("should enable button when at least one ID is selected", () => {
        const selectedIds = new Set(["12345"]);
        updateDeleteButton(btn, selectedIds);
        expect(btn.disabled).toBe(false);
    });
});

describe("populateSelect", () => {
    let select;

    beforeEach(() => {
        document.body.innerHTML = '<select id="testSelect"></select>';
        select = document.getElementById("testSelect");
    });

    test("should add options correctly from data results", () => {
        const mockData = [
            { id: 101, name: "SOFIA", code: "SOF" },
            { ekatte: "68134", name: "SOFIA", code: "SFA" }
        ];

        populateSelect(select, mockData);

        const options = select.querySelectorAll("option");

        expect(options.length).toBe(3);

        expect(options[0].value).toBe("");
        expect(options[0].textContent).toBe("-- Избери --");

        expect(options[1].value).toBe("101");
        expect(options[1].textContent).toBe("SOFIA");
        expect(options[1].dataset.code).toBe("SOF");

        expect(options[2].value).toBe("68134");
        expect(options[2].textContent).toBe("SOFIA");
        expect(options[2].dataset.code).toBe("SFA");
    });

    test("should clear previous options before adding new ones", () => {
        select.innerHTML = '<option>Old Data</option>';

        populateSelect(select, []);

        expect(select.querySelectorAll("option").length).toBe(1);
        expect(select.textContent).not.toContain("Old Data");
    });
});

describe("setActiveNav", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <nav class="nav">
                <a href="/">Home</a>
                <a href="/regions">Regions</a>
                <a href="/settlements">Settlements</a>
            </nav>
        `;
    });

    test("adds active class to matching link", () => {
        const links = document.querySelectorAll(".nav a");
        setActiveNav(links, "/regions");
        const activeLink = document.querySelector('a[href="/regions"]');
        expect(activeLink.classList.contains("active")).toBe(true);
    });

    test("dont add active class to non matching link", () => {
        const links = document.querySelectorAll(".nav a");
        setActiveNav(links, "/regions");
        const activeLink = document.querySelector('a[href="/settlements"]');
        expect(activeLink.classList.contains("active")).toBe(false);
    });
});

describe("getPlaceholderBySelectId", () => {
    test("returns region placeholder", () => {
        expect(getPlaceholderBySelectId("region_id"))
            .toBe(dropdownPlaceholders.region);
    });

    test("returns municipality placheholder", () => {
        expect(getPlaceholderBySelectId("municipality_id"))
            .toBe(dropdownPlaceholders.municipality);
    });

    test("return mayorality placeholder", () => {
        expect(getPlaceholderBySelectId("mayorality_id"))
            .toBe(dropdownPlaceholders.mayorality);
    });
});


describe("renderMonths", () => {
    test("renderMonths should render months row correctly", () => {
        const months = [
            {
                month: 1,
                avg_temperature: 5.2,
                min_temperature: -2,
                max_temperature: 10
            },
            {
                month: 2,
                avg_temperature: 7,
                min_temperature: 0,
                max_temperature: 12
            }
        ];

        const row = document.createElement("tr");

        for (let i = 0; i < 7; i++) {
            row.appendChild(document.createElement("td"));
        }

        const monthsRow = renderMonths(months, row);

        expect(monthsRow.tagName).toBe("TR");
        expect(monthsRow.classList.contains("months-row")).toBe(true);

        const td = monthsRow.querySelector("td");
        expect(td.colSpan).toBe(7);

        expect(monthsRow.textContent).toContain("Януари");
        expect(monthsRow.textContent).toContain("Февруари");

        expect(monthsRow.textContent).toContain("5.2");
        expect(monthsRow.textContent).toContain("-2");
        expect(monthsRow.textContent).toContain("10");

        expect(monthsRow.textContent).toContain("7");
        expect(monthsRow.textContent).toContain("12");
    });
});

describe("renderYears", () => {
    test("renderYears should render years correctly", () => {
        const years = [
            {
                year: 2025,
                avg_temperature: 12.1,
                min_temperature: 1,
                max_temperature: 22.3
            },
            {
                year: 2026,
                avg_temperature: 9.8,
                min_temperature: -10,
                max_temperature: 15.6
            }
        ];

        const row = document.createElement("tr");

        for (let i = 0; i < 5; i++) {
            row.appendChild(document.createElement("td"));
        }

        const yearsRow = renderYears(years, row, 10553);

        expect(yearsRow.tagName).toBe("TR");
        expect(yearsRow.classList.contains("years-row")).toBe(true);
        expect(yearsRow.dataset.settlementId).toBe("10553");

        const td = yearsRow.querySelector("td");
        expect(td.colSpan).toBe(5);

        expect(yearsRow.textContent).toContain("2025");
        expect(yearsRow.textContent).toContain("12.1");
        expect(yearsRow.textContent).toContain("1");
        expect(yearsRow.textContent).toContain("22.3");

        expect(yearsRow.textContent).toContain("2026");
        expect(yearsRow.textContent).toContain("9.8");

        const buttons = yearsRow.querySelectorAll(".expandBtn");
        expect(buttons.length).toBe(2);

        expect(buttons[0].dataset.id).toBe("10553");
        expect(buttons[0].dataset.year).toBe("2025");
    });
}); 