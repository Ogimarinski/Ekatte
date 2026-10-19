const { serveStaticFile } = require("../src/http/static/staticHandler");
const fs = require("fs/promises");
const { sendHttpResponse } = require("../src/http/utils/response");

jest.mock("fs/promises");
jest.mock("../src/http/utils/response");

describe("Static Handler: serveStaticFile", () => {
    let res;

    beforeEach(() => {
        jest.clearAllMocks();
        res = { writeHead: jest.fn(), end: jest.fn() };
    });

    test("should serve index.html when path is '/'", async () => {
        const mockContent = "<html>Home</html>";
        fs.readFile.mockResolvedValue(mockContent);

        await serveStaticFile(res, "/");

        expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining("index.html"));
        expect(sendHttpResponse).toHaveBeenCalledWith(res, 200, mockContent, "text/html");
    });

    test("should serve CSS file with correct mime type", async () => {
        const mockCSS = "body { color: red; }";
        fs.readFile.mockResolvedValue(mockCSS);

        await serveStaticFile(res, "/style.css");

        expect(sendHttpResponse).toHaveBeenCalledWith(res, 200, mockCSS, "text/css");
    });

    test("should fallback to text/plain for unknown file extensions", async () => {
        const mockContent = "some plain text or binary";
        fs.readFile.mockResolvedValue(mockContent);

        await serveStaticFile(res, "/test.txt");

        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            200,
            mockContent,
            "text/plain"
        );
    });

    test("should return 404 if file does not exist (ENOENT)", async () => {
        const error = new Error("Not found");
        error.code = "ENOENT";
        fs.readFile.mockRejectedValue(error);

        await serveStaticFile(res, "/missing.js");

        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            404,
            "404 - Файлът не е намерен!",
            expect.any(String)
        );
    });

    test("should throw an error for generic file read failures", async () => {
        const error = new Error("Permission denied");
        error.code = "EACCES";
        fs.readFile.mockRejectedValue(error);

        await expect(serveStaticFile(res, "/secret.html")).rejects.toThrow("Static file read failed");
    });

    test("should fallback to index.html for SPA route", async () => {
        const mockContent = "<html>SPA</html>";
        fs.readFile.mockResolvedValue(mockContent);

        await serveStaticFile(res, "/regions");

        expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining("index.html"));
        expect(sendHttpResponse).toHaveBeenCalledWith(res, 200, mockContent, "text/html");
    });

    test.each([
        "/../server.js",
        "/js/../../server.js",
        "/../../../../etc/passwd",
        "/..",
    ])("should return 403 and not read files outside public for '%s'", async (pathName) => {
        await serveStaticFile(res, pathName);

        expect(fs.readFile).not.toHaveBeenCalled();
        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            403,
            expect.any(String),
            expect.any(String)
        );
    });

    test("should allow file names that only start with '..'", async () => {
        fs.readFile.mockResolvedValue("ok");

        await serveStaticFile(res, "/..notes.txt");

        expect(fs.readFile).toHaveBeenCalled();
        expect(sendHttpResponse).toHaveBeenCalledWith(res, 200, "ok", "text/plain");
    });

    test("should return 404 when path is a directory (EISDIR)", async () => {
        const error = new Error("Is a directory");
        error.code = "EISDIR";
        fs.readFile.mockRejectedValue(error);

        await serveStaticFile(res, "/js");

        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            404,
            "404 - Файлът не е намерен!",
            expect.any(String)
        );
    });
});