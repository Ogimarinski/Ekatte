const fs = require("fs/promises");
const path = require("path");
const { sendHttpResponse } = require("../utils/response");

const publicDir = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "public"
);

const pageRoutes = {
    "/": "/index.html",
    "/login": "/login.html",
    "/register": "/register.html",
    "/verify": "/verify.html",
    "/settings": "/settings.html",
    "/dashboard": "/dashboard.html",
};

const spaRoutes = new Set([
    "/regions",
    "/municipalities",
    "/mayoralties",
    "/settlements",
]);

const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
};

function isInsidePublicDir(filePath) {
    const relativePath = path.relative(publicDir, filePath);

    return relativePath !== ".."
        && !relativePath.startsWith(`..${path.sep}`)
        && !path.isAbsolute(relativePath);
}

async function serveStaticFile(res, pathName) {
    let safePathName = pathName;

    if (pageRoutes[pathName]) {
        safePathName = pageRoutes[pathName];
    } else if (spaRoutes.has(pathName)) {
        safePathName = "/index.html";
    }

    const filePath = path.resolve(publicDir, `.${safePathName}`);

    if (!isInsidePublicDir(filePath)) {
        return sendHttpResponse(
            res,
            403,
            "403-забранен достъп",
            "text/plain; charset=utf-8"
        );
    }

    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || "text/plain";

    try {
        const content = await fs.readFile(filePath);
        return sendHttpResponse(res, 200, content, contentType);
    } catch (error) {
        // EISDIR: пътят сочи папка (напр. /js) — за клиента това е "няма такъв файл", не 500.
        if (error.code === "ENOENT" || error.code === "EISDIR") {
            return sendHttpResponse(res, 404, "404 - Файлът не е намерен!", "text/plain; charset=utf-8");
        }

        throw new Error("Static file read failed", { cause: error });
    }
}

module.exports = { serveStaticFile };
