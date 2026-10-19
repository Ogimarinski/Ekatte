const { streamCsv, streamExcel } = require("../src/http/utils/export");
const { PassThrough } = require("stream");
const { EventEmitter } = require("events");

function createRes({ writeReturns = true } = {}) {
    const res = new EventEmitter();
    res.destroyed = false;
    res.writableEnded = false;
    res.write = jest.fn().mockReturnValue(writeReturns);
    res.end = jest.fn(() => {
        res.writableEnded = true;
    });
    res.destroy = jest.fn(() => {
        res.destroyed = true;
        res.emit("close");
    });
    return res;
}

describe("streamCsv", () => {
    test("writes csv and ends response", async () => {
        const stream = [
            {
                id: 1,
                name: "Sofia"
            },
            {
                id: 2,
                name: "Varna"
            }
        ];

        const res = createRes();

        await streamCsv(stream, ["id", "name"], res);

        expect(res.write).toHaveBeenCalledWith("\uFEFF");
        expect(res.write).toHaveBeenCalledWith("id,name\n");
        expect(res.write).toHaveBeenCalledWith('"1","Sofia"\n');
        expect(res.write).toHaveBeenCalledWith('"2","Varna"\n');

        expect(res.end).toHaveBeenCalled();
    });

    test("writes empty string for missing value", async () => {
        const stream = [
            {
                id: 1
            }
        ];

        const res = createRes();

        await streamCsv(stream, ["id", "name"], res);

        expect(res.write).toHaveBeenCalledWith('"1",""\n');
    });

    test("escapes quotes and commas in values", async () => {
        const stream = [
            {
                id: 1,
                name: 'Sofia, "capital"'
            }
        ];

        const res = createRes();

        await streamCsv(stream, ["id", "name"], res);

        expect(res.write).toHaveBeenCalledWith('"1","Sofia, ""capital"""\n');
    });

    test("waits for drain when the response buffer is full", async () => {
        const stream = [
            {
                id: 1,
                name: "Sofia"
            }
        ];

        const res = new EventEmitter();
        res.write = jest.fn().mockReturnValue(false);
        res.end = jest.fn();

        const pending = streamCsv(stream, ["id", "name"], res);

        let settled = false;
        pending.then(() => {
            settled = true;
        });

        for (let i = 0; i < 10 && !settled; i++) {
            await new Promise((resolve) => setImmediate(resolve));
            res.emit("drain");
        }

        await pending;

        expect(res.write.mock.calls.length).toBeGreaterThanOrEqual(3);
        expect(res.end).toHaveBeenCalled();
    });

    test("destroys stream and response on error", async () => {
        const error = new Error("boom");

        const stream = {
            destroy: jest.fn(),
            [Symbol.asyncIterator]() {
                return {
                    async next() {
                        throw error;
                    }
                };
            }
        };

        const res = createRes();

        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });

        await streamCsv(stream, ["id"], res);

        expect(stream.destroy).toHaveBeenCalledWith(error);
        expect(res.destroy).toHaveBeenCalled();
        expect(res.end).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    test("stops waiting for drain when the client disconnects", async () => {
        const stream = Object.assign([{ id: 1 }], { destroy: jest.fn() });
        const res = createRes({ writeReturns: false });
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });

        const pending = streamCsv(stream, ["id"], res);

        await new Promise((resolve) => setImmediate(resolve));
        res.destroyed = true;
        res.emit("close");

        await pending;

        expect(stream.destroy).toHaveBeenCalled();
        expect(res.end).not.toHaveBeenCalled();
        expect(res.listenerCount("drain")).toBe(0);
        expect(consoleSpy).toHaveBeenCalledTimes(1);

        consoleSpy.mockRestore();
    });
});


describe("streamExcel", () => {
    test("writes excel workbook", async () => {
        const stream = [
            {
                id: 1,
                name: "Sofia"
            }
        ];

        const res = new PassThrough();

        await expect(
            streamExcel(
                stream,
                [
                    {
                        header: "ID",
                        key: "id",
                        width: 10
                    },
                    {
                        header: "Name",
                        key: "name",
                        width: 20
                    }
                ],
                res
            )
        ).resolves.not.toThrow();
    });
});