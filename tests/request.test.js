const { EventEmitter } = require("events");
const { parseRequestBody, parseQuery } = require("../src/http/utils/request");

describe("parseRequestBody", () => {
    test("parses valid json", async () => {
        const req = new EventEmitter();

        const promise = parseRequestBody(req);

        req.emit("data", Buffer.from('{"name":"Sofia"}'));
        req.emit("end");

        await expect(promise).resolves.toEqual({
            name: "Sofia"
        });
    });
    test("returns empty object when body is empty", async () => {
        const req = new EventEmitter();

        const promise = parseRequestBody(req);

        req.emit("end");

        await expect(promise).resolves.toEqual({});
    });

    test("rejects on invalid json", async () => {
        const req = new EventEmitter();

        const promise = parseRequestBody(req);

        req.emit("data", Buffer.from("{invalid"));
        req.emit("end");

        await expect(promise).rejects.toThrow("Invalid JSON");
    });

    test("rejects when request emits error", async () => {
        const req = new EventEmitter();

        const promise = parseRequestBody(req);

        const error = new Error("stream error");

        req.emit("error", error);

        await expect(promise).rejects.toThrow("stream error");
    });
});

describe("parseQuery", () => {
    test("returns empty object when there are no params", () => {
        expect(parseQuery(new URLSearchParams(""))).toEqual({});
    });

    test("skips params with empty value", () => {
        const query = parseQuery(new URLSearchParams("page=&query=Sofia"));

        expect(query).toEqual({ query: "Sofia" });
    });

    test("skips params with whitespace-only value", () => {
        const query = parseQuery(new URLSearchParams("query=%20%20"));

        expect(query).toEqual({});
    });

    test("trims values", () => {
        const query = parseQuery(new URLSearchParams("name=%20Sofia%20"));

        expect(query).toEqual({ name: "Sofia" });
    });

    test("keeps the last value for repeated params", () => {
        const query = parseQuery(new URLSearchParams("page=2&page=5"));

        expect(query).toEqual({ page: "5" });
    });

    test("ignores empty value when picking the last repeated param", () => {
        const query = parseQuery(new URLSearchParams("page=2&page="));

        expect(query).toEqual({ page: "2" });
    });

    test("keeps __proto__ as a regular own property", () => {
        const query = parseQuery(
            new URLSearchParams("__proto__=x")
        );

        expect(Object.hasOwn(query, "__proto__")).toBe(true);
        expect(query["__proto__"]).toBe("x");
        expect(Object.getPrototypeOf(query)).toBe(null);
    });
});