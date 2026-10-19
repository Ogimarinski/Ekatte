const { ValidationError } = require("../../errors/ValidationError");
const { assertPositiveInt } = require("../../utils/assert.utils");

function escapeLike(text) {
    return text.replace(/[\\%_]/g, (ch) => "\\" + ch);
}

const DEFAULT_PAGE_SIZE = 20;

const SORT_DIRECTIONS = {
    asc: "ASC",
    desc: "DESC"
};
function buildPagination({ page = 1, limit = DEFAULT_PAGE_SIZE }) {
    assertPositiveInt(page, "page");
    assertPositiveInt(limit, "limit");

    return {
        page,
        limit,
        offset: (page - 1) * limit
    };
}

function buildOrderBy(sort, sortableColumns, defaultOrder) {
    if (!sort) {
        return `ORDER BY ${defaultOrder}`;
    }

    const sortParts = sort.split(",").map(part => {
        const [column, direction, ...rest] = part.split(":");

        const dbColumn = Object.hasOwn(sortableColumns, column) ? sortableColumns[column] : undefined;
        const dbDirection = Object.hasOwn(SORT_DIRECTIONS, direction) ? SORT_DIRECTIONS[direction] : undefined;

        if (!dbColumn || !dbDirection || rest.length > 0) {
            throw new ValidationError(`Invalid sort: "${part}"`);
        }

        return `${dbColumn} ${dbDirection}`;
    });

    return `ORDER BY ${sortParts.join(", ")}`;
}

module.exports = {
    escapeLike,
    buildOrderBy,
    DEFAULT_PAGE_SIZE,
    buildPagination
};
