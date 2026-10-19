require("dotenv").config();
const http = require("http");
const { serveStaticFile } = require("./src/http/static/staticHandler");
const { handleRequest } = require("./src/http/router");
const { handleError } = require("./src/http/utils/errorHandler");
const PORT = process.env.PORT || 8080;
const URL_BASE = "http://localhost";

/* istanbul ignore next */
const server = http.createServer(async (req, res) => {
    try {
        const parsedUrl = new URL(req.url, URL_BASE);
        const handled = await handleRequest(req, res, parsedUrl);

        if (handled) return;

        return await serveStaticFile(res, parsedUrl.pathname);
    } catch (err) {
        if (res.headersSent) {
            console.error(err);
            res.destroy();
            return;
        }

        return handleError(res, err);
    }
});

/* istanbul ignore if */
if (require.main === module) {
    server.listen(PORT, "0.0.0.0", () => {
        console.log(`Сървърът е стартиран успешно! Отворете: http://localhost:${PORT}`);
    });
}
