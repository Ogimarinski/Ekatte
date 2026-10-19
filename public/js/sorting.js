import { parseUrlParams, updateUrlParams } from "./url.js";

function initSorting(loadData) {
    document.addEventListener("click", e => {
        if (e.target.dataset.sort) {
            const sortBy = e.target.dataset.sort;
            const params = parseUrlParams();

            let sort = params.sort.map(s => ({ ...s }));

            const index = sort.findIndex(s => s.key === sortBy);

            if (index !== -1) {
                if (sort[index].order === "asc") {
                    sort[index].order = "desc";
                } else {
                    sort.splice(index, 1);
                }
            } else {
                sort.push({ key: sortBy, order: "asc" });
            }

            const sortParams = sort.map(s => `${s.key}:${s.order}`).join(",");

            const newUrl = updateUrlParams({
                page: params.page,
                query: params.query,
                sort: sortParams
            });

            window.history.pushState({}, "", newUrl);
            loadData();
        }
    });
}

export {
    initSorting
}
