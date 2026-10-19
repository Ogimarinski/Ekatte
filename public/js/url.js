// Същото правило като parseQuery в src/http/utils/request.js — ако едното се промени, трябва и другото.
export function parseQueryString(search) {
    const params = Object.create(null);

    for (const [key, value] of new URLSearchParams(search)) {
        const trimmedValue = value.trim();

        if (trimmedValue !== "") {
            params[key] = trimmedValue;
        }
    }

    return params;
}

export function parseUrlParams() {
    const path = window.location.pathname.split("/").pop(); //последната част от пътя

    const rawParams = parseQueryString(window.location.search);
    const sortParam = rawParams.sort;

    return {
        ...rawParams,
        view: path || "regions",
        page: parseInt(rawParams.page) || 1,
        query: rawParams.query || "",
        sort: sortParam
            ? sortParam.split(",").map(s => {
                const [key, order] = s.split(":");
                return { key, order };
            })
            : []
    };
}

export function updateUrlParams(newParams) {
    const url = new URL(window.location);
    Object.keys(newParams).forEach(key => {
        if (newParams[key]) url.searchParams.set(key, newParams[key]);
        else url.searchParams.delete(key);
    });
    return url.toString();
}
