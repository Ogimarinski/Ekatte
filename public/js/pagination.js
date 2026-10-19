import { parseUrlParams, updateUrlParams } from "./url.js";

function initPagination(loadData, getCurrentPage) {
    const prevButton = document.getElementById("prevPage");
    const nextButton = document.getElementById("nextPage");
    const goButton = document.getElementById("goToPage");
    const pageInput = document.getElementById("pageInput");

    const allPagingButtons = [prevButton, nextButton, goButton];

    function lockPaging() {
        allPagingButtons.forEach(btn => btn.disabled = true);
    }

    function unlockPaging() {
        goButton.disabled = false;
    }

    async function goToPage(page, params) {
        const sortParams = params.sort
            .map(param => `${param.key}:${param.order}`)
            .join(",");

        const newUrl = updateUrlParams({
            page,
            query: params.query,
            sort: sortParams
        });

        window.history.pushState({}, "", newUrl);

        lockPaging();
        try {
            const ok = await loadData();

            if (!ok) {
                prevButton.disabled = false;
                nextButton.disabled = false;
            }
        } finally {
            unlockPaging();
        }
    }

    prevButton.addEventListener("click", () => {
        const params = parseUrlParams();
        const currentPage = getCurrentPage();

        if (currentPage > 1) {
            goToPage(currentPage - 1, params);
        }
    });

    nextButton.addEventListener("click", () => {
        const params = parseUrlParams();
        const currentPage = getCurrentPage();

        goToPage(currentPage + 1, params);
    });

    goButton.addEventListener("click", () => {
        const params = parseUrlParams();
        const page = Number(pageInput.value);

        if (!Number.isInteger(page) || page < 1) return;

        goToPage(page, params);
    });

    pageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            goButton.click();
        }
    });
}
export {
    initPagination
};
