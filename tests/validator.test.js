const { validateSchema } = require("../src/validators/validator");
const { ValidationError } = require("../src/errors/ValidationError");


describe("validateSchema", () => {

    describe("region", () => {

        test("validates create payload", () => {
            const result = validateSchema(
                "region",
                "create",
                {
                    code: "SOF",
                    name: "София"
                }
            );

            expect(result).toEqual({
                code: "SOF",
                name: "София"
            });
        });

        test("validates update payload", () => {
            const result = validateSchema(
                "region",
                "update",
                {
                    id: 1,
                    code: "SOF",
                    name: "София"
                }
            );

            expect(result).toEqual({
                id: 1,
                code: "SOF",
                name: "София"
            });
        });

        test("validates list query", () => {
            const result = validateSchema(
                "region",
                "list",
                {
                    page: "1",
                    limit: "20"
                }
            );

            expect(result.page).toBe(1);
            expect(result.limit).toBe(20);
        });

        test("validates getById", () => {
            const result = validateSchema(
                "region",
                "getById",
                {
                    id: "5"
                }
            );

            expect(result.id).toBe(5);
        });

        test("validates delete payload", () => {
            const result = validateSchema(
                "region",
                "delete",
                {
                    ids: [1, 2]
                }
            );

            expect(result).toEqual({
                ids: [1, 2]
            });
        });

        test("throws on invalid create payload", () => {
            expect(() =>
                validateSchema(
                    "region",
                    "create",
                    {}
                )
            ).toThrow(ValidationError);
        });

        test("throws on invalid getById payload", () => {
            expect(() =>
                validateSchema(
                    "region",
                    "getById",
                    {
                        id: "abc"
                    }
                )
            ).toThrow(ValidationError);
        });

        test("throws on invalid delete payload", () => {
            expect(() =>
                validateSchema(
                    "region",
                    "delete",
                    {
                        ids: []
                    }
                )
            ).toThrow(ValidationError);
        });
    });

    describe("municipality", () => {

        test("validates create payload", () => {
            const result = validateSchema(
                "municipality",
                "create",
                {
                    name: "Варна",
                    region_id: 1
                }
            );

            expect(result).toEqual({
                name: "Варна",
                region_id: 1
            });
        });

        test("throws on invalid payload", () => {
            expect(() =>
                validateSchema(
                    "municipality",
                    "create",
                    {
                        name: "Варна"
                    }
                )
            ).toThrow(ValidationError);
        });
    });

    describe("mayorality", () => {

        test("validates create payload", () => {
            const result = validateSchema(
                "mayorality",
                "create",
                {
                    name: "Аспарухово",
                    municipality_id: 1
                }
            );

            expect(result).toEqual({
                name: "Аспарухово",
                municipality_id: 1
            });
        });

        test("throws on invalid payload", () => {
            expect(() =>
                validateSchema(
                    "mayorality",
                    "create",
                    {
                        name: "Аспарухово"
                    }
                )
            ).toThrow(ValidationError);
        });
    });

    describe("settlement", () => {

        test("validates create payload", () => {
            const result = validateSchema(
                "settlement",
                "create",
                {
                    name: "Варна",
                    municipality_id: 1,
                    mayorality_id: null
                }
            );

            expect(result).toEqual({
                name: "Варна",
                municipality_id: 1,
                mayorality_id: null
            });
        });

        test("throws on invalid payload", () => {
            expect(() =>
                validateSchema(
                    "settlement",
                    "create",
                    {
                        name: "Варна"
                    }
                )
            ).toThrow(ValidationError);
        });
    });

    describe("general validation", () => {

        test("throws for invalid resource", () => {
            expect(() =>
                validateSchema(
                    "invalid",
                    "create",
                    {}
                )
            ).toThrow(ValidationError);
        });

        test("throws for invalid operation", () => {
            expect(() =>
                validateSchema(
                    "region",
                    "unknown",
                    {}
                )
            ).toThrow(ValidationError);
        });

        test("coerces values to correct types", () => {
            const result = validateSchema(
                "region",
                "getById",
                {
                    id: "10"
                }
            );

            expect(result.id).toBe(10);
        });
    });

    describe("custom formats", () => {

        describe("date format", () => {
            test("accepts a valid calendar date", () => {
                const result = validateSchema(
                    "region",
                    "list",
                    { updated_at_from: "2024-01-15" }
                );

                expect(result.updated_at_from).toBe("2024-01-15");
            });

            test("rejects a malformed date string", () => {
                expect(() =>
                    validateSchema(
                        "region",
                        "list",
                        { updated_at_from: "15-01-2024" }
                    )
                ).toThrow(ValidationError);
            });

            test("rejects a calendar-impossible date (e.g. Feb 30)", () => {
                expect(() =>
                    validateSchema(
                        "region",
                        "list",
                        { updated_at_from: "2024-02-30" }
                    )
                ).toThrow(ValidationError);
            });
        });

        describe("email format", () => {
            test("accepts a valid email", () => {
                const result = validateSchema(
                    "auth",
                    "login",
                    { email: "user@example.com", password: "secret123" }
                );

                expect(result.email).toBe("user@example.com");
            });

            test("rejects an email without domain", () => {
                expect(() =>
                    validateSchema(
                        "auth",
                        "login",
                        { email: "user@", password: "secret123" }
                    )
                ).toThrow(ValidationError);
            });

            test("rejects an email without @", () => {
                expect(() =>
                    validateSchema(
                        "auth",
                        "login",
                        { email: "userexample.com", password: "secret123" }
                    )
                ).toThrow(ValidationError);
            });
        });
    });
});

describe("validateSchema: real-world names, codes and sort", () => {
    // Реални данни от базата, които старите regex-и отхвърляха.
    test.each([
        ["region", "update", { id: 1, name: "София (столица)" }],
        ["settlement", "create", { name: "Zhen’an", municipality_id: 1 }],
        ["settlement", "update", { id: 1, name: "Samzhubzê, Xigazê" }],
        ["mayorality", "update", { id: 1, code: "PAZ08-01" }],
    ])("%s %s accepts %p", (resource, operation, data) => {
        expect(validateSchema(resource, operation, data)).toEqual(data);
    });

    test.each([
        ["region", "create", { name: "   ", code: "SOF" }],
        ["settlement", "update", { id: 1, name: "" }],
        ["mayorality", "update", { id: 1, code: "PAZ08" }],
    ])("%s %s rejects %p", (resource, operation, data) => {
        expect(() => validateSchema(resource, operation, data)).toThrow(ValidationError);
    });

    // Позволените колони се проверяват в repository-то (buildOrderBy), не в schema-та.
    test("list schema leaves sort column validation to the repository", () => {
        expect(validateSchema("region", "list", { sort: "anything:asc" })).toEqual({ sort: "anything:asc" });
    });
});
