const { sendHttpResponse } = require("../utils/response");
const { handleError } = require("../utils/errorHandler");

const createSchemas = {
    regions: require("../../schemas/region/create.ui.json"),
    municipalities: require("../../schemas/municipality/create.ui.json"),
    mayoralties: require("../../schemas/mayorality/create.ui.json"),
    settlements: require("../../schemas/settlement/create.ui.json")
};

const updateSchemas = {
    regions: require("../../schemas/region/update.ui.json"),
    municipalities: require("../../schemas/municipality/update.ui.json"),
    mayoralties: require("../../schemas/mayorality/update.ui.json"),
    settlements: require("../../schemas/settlement/update.ui.json")
};

async function getCreateSchema(req, res, { params: { resource } }) {
    try {
        const schema = createSchemas[resource];

        if (!schema) {
            return sendHttpResponse(
                res,
                404,
                JSON.stringify({ error: "Schema not found" }),
                "application/json"
            );
        }

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(schema),
            "application/json"
        );
    } catch (err) {
        return handleError(res, err);
    }
}

async function getUpdateSchema(req, res, { params: { resource } }) {
    try {
        const schema = updateSchemas[resource];

        if (!schema) {
            return sendHttpResponse(
                res,
                404,
                JSON.stringify({ error: "Schema not found" }),
                "application/json"
            );
        }

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(schema),
            "application/json"
        );
    } catch (err) {
        return handleError(res, err);
    }
}

module.exports = {
    getCreateSchema,
    getUpdateSchema
};
