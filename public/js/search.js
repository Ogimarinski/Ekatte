import { parseUrlParams, updateUrlParams } from "./url.js";

function initSearch(loadData) {
    const searchInput = document.getElementById("searchInput");

    let timeoutId;
    searchInput.addEventListener("input", e => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            const params = parseUrlParams();
            const sortParams = params.sort.map(param => `${param.key}:${param.order}`).join(",");

            const newUrl = updateUrlParams({
                page: 1,
                query: e.target.value.trim(),
                sort: sortParams
            });

            window.history.pushState({}, "", newUrl);
            loadData();
        }, 500);
    });
}

export {
    initSearch
}
