// заради lint -> казва знам, че Chart не е деклариран в този файл. Той е глобална променлива.
/* global Chart */
import {
    fetchCountries,
    fetchClimateSummary,
    fetchClimateTimeseries,
    fetchTopSettlements,
    fetchYearRange
} from "./api.js";
import { parseUrlParams, updateUrlParams } from "./url.js";
import { withLock, setSubmitting } from "./utils/formFeedback.js";

let lineChart;
let barChart;
let yearRange;

function applyYearRange(range) {
    const { min_year: minYear, max_year: maxYear } = range;

    document.getElementById("yearRangeHint").textContent = `(${minYear}-${maxYear})`;

    [document.getElementById("fromYear"), document.getElementById("toYear")].forEach(input => {
        input.min = minYear;
        input.max = maxYear;
    });
}

function validateYearBounds(fromYear, toYear) {
    if (!yearRange) {
        return;
    }

    const { min_year: minYear, max_year: maxYear } = yearRange;
    const from = Number(fromYear);
    const to = Number(toYear);

    if (from < minYear || to > maxYear) {
        throw new Error(`Годината трябва да е между ${minYear} и ${maxYear}`);
    }
}

function humanizeError(message) {
    const map = [
        { test: /to_year must be <=/, text: "Годината 'до' не може да бъде след 2025." },
        { test: /from_year must be >=/, text: "Началната година е извън наличния период." },
        { test: /from_year.*to_year/, text: "Началната година трябва да е преди крайната." },
        { test: /limit must be <=/, text: "Броят населени места не може да е повече от 200." },
        { test: /limit must be >=/, text: "Броят населени места трябва да е поне 1." }
    ];

    const match = map.find(m => m.test.test(message));
    return match ? match.text : "Възникна грешка при зареждане на данните.";
}
function showError(errMessage) {
    const element = document.getElementById("dashboardError");
    element.textContent = errMessage;
    element.hidden = false;
}

function clearError() {
    const element = document.getElementById("dashboardError");
    element.hidden = true;
    element.textContent = "";
}

function setStale(isStale) {
    const content = document.getElementById("dashboardContent");

    if (content.hidden) {
        return;
    }

    content.classList.toggle("is-stale", isStale);
}

function setLoading(isLoading) {
    const chartsPanel = document.getElementById("dashboardContent");
    chartsPanel.classList.toggle("is-loading", isLoading);
}

function initTopLimitField() {
    const select = document.getElementById("topLimit");
    const customField = document.getElementById("topLimitCustomField");
    const customInput = document.getElementById("topLimitCustom");

    select.addEventListener("change", () => {
        customField.hidden = select.value !== "custom";

        if (select.value === "custom") {
            customInput.focus();
        }
    });
}

function getTopLimitValue() {
    const select = document.getElementById("topLimit");

    if (select.value !== "custom") {
        return select.value;
    }

    const custom = document.getElementById("topLimitCustom").value;
    const num = Number(custom);

    if (!custom || !Number.isInteger(num) || num < 1 || num > 200) {
        throw new Error("Броят трябва да е между 1 и 200");
    }

    return String(num);
}

function setEmptyState(isEmpty) {
    document.getElementById("dashboardEmptyState").hidden = !isEmpty;
    document.getElementById("dashboardContent").hidden = isEmpty;
}

function readFilters() {
    const params = parseUrlParams();

    const filters = {
        country_code: params.country_code || "BG",
        granularity: params.granularity || "year",
        temp_type: params.temp_type || "max",
        from_year: params.from_year || "2020",
        to_year: params.to_year || "2025"
    };

    if (filters.granularity === "month") {
        filters.from_month = params.from_month || "1";
        filters.to_month = params.to_month || "12";
    }

    return filters;
}

function readTopFilters() {
    const params = parseUrlParams();

    const filters = {
        country_code: params.country_code || "BG",
        granularity: params.granularity || "year",
        temp_type: params.temp_type || "max",
        from_year: params.from_year || "2020",
        to_year: params.to_year || "2025",
        limit: params.limit || "10"
    };

    if (filters.granularity === "month") {
        filters.from_month = params.from_month || "1";
        filters.to_month = params.to_month || "12";
    }

    return filters;
}

function renderSummary(summary) {
    document.getElementById("summary").innerHTML = `
        <span>Средна: ${summary.average.toFixed(2)}</span>
        <span>Максимална: ${summary.max}</span>
        <span>Минимална: ${summary.min}</span>
        <span>Записи: ${summary.records}</span>
    `;
}

function renderLineChart(rows, granularity) {
    const labels = rows.map(r => granularity === "year" ? `${r.year}` : `${r.year}-${String(r.month).padStart(2, "0")}`);

    const data = rows.map(r => r.value);

    if (lineChart) {
        lineChart.data.labels = labels;
        lineChart.data.datasets[0].data = data;
        lineChart.update(); //след промяна на данните прерисува графиката
        return;
    }

    lineChart = new Chart(document.getElementById("lineChart"), {
        type: "line",
        data: { labels, datasets: [{ label: "Температура", data }] }
    });
}

function renderBarChart(rows) {
    const labels = rows.map(r => r.name);
    const data = rows.map(r => r.value);

    if (barChart) {
        barChart.data.labels = labels;
        barChart.data.datasets[0].data = data;
        barChart.update();
        return;
    }

    barChart = new Chart(document.getElementById("barChart"), {
        type: "bar",
        data: { labels, datasets: [{ label: "Топ населени места", data }] }
    });
}

async function refreshCharts() {
    const filters = readFilters();
    const showBtn = document.getElementById("showBtn");

    clearError();
    setSubmitting(showBtn, true, "Приложи");
    setEmptyState(false);
    setLoading(true);

    try {
        const [summary, timeseries, top] = await Promise.all([
            fetchClimateSummary(filters),
            fetchClimateTimeseries(filters),
            fetchTopSettlements(readTopFilters())
        ]);

        renderSummary(summary);
        renderLineChart(timeseries, filters.granularity);
        renderBarChart(top)


        setStale(false);
    } catch (err) {
        showError(humanizeError(err.message));
        setStale(true);
    } finally {
        setSubmitting(showBtn, false, "Приложи");
        setLoading(false);
    }
};

function applyFilters() {

    const fromYear = document.getElementById("fromYear").value;
    const toYear = document.getElementById("toYear").value;

    let limit;
    try {
        limit = getTopLimitValue();
        validateYearBounds(fromYear, toYear);
    } catch (err) {
        showError(err.message);
        return;
    }

    const newParams = {
        country_code: document.getElementById("country").value,
        granularity: document.getElementById("granularity").value,
        temp_type: document.getElementById("tempType").value,
        from_year: fromYear,
        to_year: toYear,
        from_month: document.getElementById("fromMonth").value,
        to_month: document.getElementById("toMonth").value,
        limit
    };

    const newUrl = updateUrlParams(newParams);

    window.history.pushState({}, "", newUrl);

    return refreshCharts();
}

function populateFormFromFilters() {
    const params = parseUrlParams();
    const limit = params.limit || "10";
    const select = document.getElementById("topLimit");
    const presetValues = ["10", "20", "50"];

    if (presetValues.includes(limit)) {
        select.value = limit;
        document.getElementById("topLimitCustomField").hidden = true;
    } else {
        select.value = "custom";
        document.getElementById("topLimitCustom").value = limit;
        document.getElementById("topLimitCustomField").hidden = false;
    }

    document.getElementById("granularity").value = params.granularity || "year";
    document.getElementById("tempType").value = params.temp_type || "max";
    document.getElementById("fromYear").value = params.from_year || "2020";
    document.getElementById("toYear").value = params.to_year || "2025";
    document.getElementById("fromMonth").value = params.from_month || "";
    document.getElementById("toMonth").value = params.to_month || "";
}

function hasAppliedFilters() {
    return window.location.search.length > 0;
}

async function init() {
    setEmptyState(!hasAppliedFilters());

    const [countries, range] = await Promise.all([
        fetchCountries(),
        fetchYearRange()
    ]);

    yearRange = range;
    applyYearRange(range);

    const select = document.getElementById("country");
    select.innerHTML = countries.map(c => `<option value="${c.code}">${c.name}</option>`).join("");

    select.value = parseUrlParams().country_code || "BG";

    initTopLimitField();
    populateFormFromFilters();

    const showBtn = document.getElementById("showBtn");
    showBtn.addEventListener("click", withLock(showBtn, applyFilters));

    document.getElementById("exitBtn").addEventListener("click", () => {
        window.location.href = "/settlements";
    });

    if (hasAppliedFilters()) {
        await refreshCharts();
    }
}

init();