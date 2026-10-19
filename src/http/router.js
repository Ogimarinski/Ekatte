const regionRoutes = require("./routes/region.routes");
const municipalityRoutes = require("./routes/municipality.routes");
const mayoralityRoutes = require("./routes/mayorality.routes");
const settlementRoutes = require("./routes/settlement.routes");
const statsRoutes = require("./routes/stats.routes");
const schemaRoutes = require("./routes/schema.routes");
const authRoutes = require("./routes/auth.routes");
const { authMiddleware } = require("../middleware/auth.middleware");
const { handleError } = require("./utils/errorHandler");
const settingsRoutes = require("./routes/settings.routes");
const climateRoutes = require("./routes/climate.routes");
const countryRoutes = require("./routes/country.routes");
const { parseQuery } = require("./utils/request");

const routes = [
    ...authRoutes,
    ...schemaRoutes,
    ...regionRoutes,
    ...municipalityRoutes,
    ...mayoralityRoutes,
    ...settlementRoutes,
    ...statsRoutes,
    ...settingsRoutes,
    ...climateRoutes,
    ...countryRoutes
];

function findRoute(method, pathname) {
    for (const route of routes) {
        if (route.method !== method) {
            continue;
        }

        const match = route.pattern.exec({ pathname });

        if (match) {
            return {
                handler: route.handler,
                params: match.pathname.groups,
                requiresAuth: route.requiresAuth
            };
        }
    }

    return null;
}

async function handleRequest(req, res, parsedUrl) {
    try {
        const match = findRoute(req.method, parsedUrl.pathname);

        if (!match) {
            return false; // Не е API route — оставяме заявката да бъде обработена от static file handler.
        }

        if (match.requiresAuth !== false) {
            await authMiddleware(req);
        }

        await match.handler(req, res, {
            query: parseQuery(parsedUrl.searchParams),
            params: match.params
        });

        return true;

    } catch (err) {
        handleError(res, err);

        return true;
    }
}

module.exports = { handleRequest };
