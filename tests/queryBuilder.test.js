const { escapeLike, buildOrderBy } = require("../src/repositories/helpers/queryBuilder");
const { ValidationError } = require("../src/errors/ValidationError");

describe("escapeLike", () => {
    test.each([
        ["Sofia", "Sofia"],
        ["50%", "50\\%"],
        ["a_b", "a\\_b"],
        ["a\\b", "a\\\\b"],
        ["\\%", "\\\\\\%"],
        ["%_%", "\\%\\_\\%"],
        ["", ""],
    ])("escapes %p as %p", (input, expected) => {
        expect(escapeLike(input)).toBe(expected);
    });
});

describe("buildOrderBy", () => {
    const columns = {
        name: "r.name",
        id_display: "COALESCE(s.ekatte::bigint, s.geoname_id)"
    };

    test.each([undefined, ""])("returns the default order when sort is %p", (sort) => {
        expect(buildOrderBy(sort, columns, "r.name ASC")).toBe("ORDER BY r.name ASC");
    });

    test("maps API columns to SQL expressions", () => {
        expect(buildOrderBy("name:desc,id_display:asc", columns, "r.name ASC"))
            .toBe("ORDER BY r.name DESC, COALESCE(s.ekatte::bigint, s.geoname_id) ASC");
    });

    test.each([
        "unknown:asc",
        "name:up",
        "name",
        "name:asc:extra",
        "name:asc,",
        "constructor:asc",
        "toString:asc",
        "name:constructor",
    ])("throws ValidationError for %p", (sort) => {
        expect(() => buildOrderBy(sort, columns, "r.name ASC")).toThrow(ValidationError);
    });
});
