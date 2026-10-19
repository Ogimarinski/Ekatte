import { parseUrlParams, parseQueryString } from "./url.js";

export function buildExportUrl(format) {
    const { view } = parseUrlParams();

    const {
        page: _page,
        limit: _limit,
        view: _view,
        ...filters
    } = parseQueryString(window.location.search);

    const url = new URL(
        `/api/${view}/export/${format}`,
        window.location.origin
    );

    url.search = new URLSearchParams(filters);

    return url.toString();
}

function handleCsvExport() {
    window.location.assign(buildExportUrl("csv"));
}

function handleExcelExport() {
    window.location.assign(buildExportUrl("excel"));
}

export function initExport() {
    document.getElementById("exportCsv").addEventListener("click", handleCsvExport);
    document.getElementById("exportExcel").addEventListener("click", handleExcelExport);
}