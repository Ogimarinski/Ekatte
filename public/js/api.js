import { authFetch } from "./auth/auth.api.js";
import { parseUrlParams } from "./url.js";
import { handleResponse } from "./utils/http.js";

function buildQueryParams() {
    const params = parseUrlParams();

    const {
        sort,
        view: _view,
        ...filters
    } = params;

    return new URLSearchParams({
        ...filters,
        ...(sort.length && {
            sort: sort
                .map(p => `${p.key}:${p.order}`)
                .join(",")
        })
    });
}

function buildClimateQueryParams() {
    const params = parseUrlParams();

    const query = new URLSearchParams();

    const climateKeys = [
        "avg_temperature_from",
        "avg_temperature_to",
        "min_temperature_from",
        "min_temperature_to",
        "max_temperature_from",
        "max_temperature_to"
    ];

    climateKeys.forEach(key => {
        if (params[key] !== undefined && params[key] !== "") {
            query.set(key, params[key]);
        }
    });

    return query;
}

export async function fetchData() {
    const params = parseUrlParams();

    const { view } = params;

    const query = buildQueryParams();

    query.set("limit", 20);

    const res = await authFetch(`/api/${view}?${query}`);

    return handleResponse(res);
}

export async function fetchStats() {
    const res = await authFetch('/api/stats');
    return handleResponse(res);
}

export async function deleteItems(view, ids) {
    const res = await authFetch(`/api/${view}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids })
    });

    return handleResponse(res);
}

export async function createItem(view, payload) {
    const res = await authFetch(`/api/${view}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
    });

    return handleResponse(res);
}

export async function updateItem(view, id, payload) {
    const res = await authFetch(`/api/${view}/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
    });

    return handleResponse(res);
}

export async function fetchOptions(resource, parentId = null, parentParam = "") {
    let url = `/api/${resource}/options`;

    if (parentId && parentParam) {
        url += `?${parentParam}=${parentId}`;
    }
    const res = await authFetch(url);
    return handleResponse(res);
}

export async function fetchOne(view, id) {
    const res = await authFetch(`/api/${view}/${id}`);
    return handleResponse(res);
}

export async function fetchSettlementClimateMonths(id, year) {
    const res = await authFetch(`/api/settlements/${id}/climate/${year}`);

    return handleResponse(res);
}

export async function fetchSettlementClimateYears(id) {
    const query = buildClimateQueryParams();

    const res = await authFetch(`/api/settlements/${id}/climate-years?${query}`);

    return handleResponse(res);
}

export async function fetchCountries() {
    const res = await authFetch("/api/countries");
    return handleResponse(res);
}

export async function fetchClimateSummary(params) {
    const res = await authFetch(`/api/climate/summary?${new URLSearchParams(params)}`);
    return handleResponse(res);
}

export async function fetchClimateTimeseries(params) {
    const res = await authFetch(`/api/climate/timeseries?${new URLSearchParams(params)}`);
    return handleResponse(res);
}

export async function fetchTopSettlements(params) {
    const res = await authFetch(`/api/climate/top-settlements?${new URLSearchParams(params)}`);
    return handleResponse(res);
}

export async function fetchYearRange() {
    const res = await authFetch(`/api/climate/year-range`);
    return handleResponse(res);
}