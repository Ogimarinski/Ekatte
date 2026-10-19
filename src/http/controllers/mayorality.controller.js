const mayoralityService = require("../../services/mayorality.service");
const {
    validateSchema
} = require("../../validators/validator");

const { parseRequestBody } = require("../utils/request");
const { sendHttpResponse } = require("../utils/response");
const { handleError } = require("../utils/errorHandler");
const { streamCsv, streamExcel } = require("../utils/export")

const HEADERS = [
    "id",
    "code",
    "name",
    "municipality_name",
    "updated_at"
];

const COLUMNS = [
    { header: "ID", key: "id", width: 10 },
    { header: "Code", key: "code", width: 15 },
    { header: "Name", key: "name", width: 30 },
    { header: "Municipality", key: "municipality_name", width: 25 },
    { header: "Updated At", key: "updated_at", width: 25 }
];

function getExportStream(query) {
    const validatedFilters = validateSchema("mayorality", "list", query);

    return mayoralityService.exportMayoralities(validatedFilters);
}

async function exportMayoralityCsv(req, res, { query }) {
    try {
        const stream = await getExportStream(query);

        res.writeHead(200, {
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=mayoralities.csv"
        });

        await streamCsv(stream, HEADERS, res);
    } catch (err) {
        if (res.headersSent) {
            console.error("Стриймът прекъсна след изпратени хедъри:", err);
            return res.destroy();
        }
        return handleError(res, err);
    }
}

async function exportMayoralityExcel(req, res, { query }) {
    try {
        const stream = await getExportStream(query);

        res.writeHead(200, {
            "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "content-disposition": "attachment; filename=mayoralities.xlsx"
        });

        await streamExcel(stream, COLUMNS, res);
    } catch (err) {
        if (res.headersSent) {
            console.error("Стриймът прекъсна след изпратени хедъри:", err);
            return res.destroy();
        }
        return handleError(res, err);
    }
}


async function getMayoralities(req, res, { query }) {
    try {
        const validatedParams = validateSchema("mayorality", "list", query);

        const mayoralities = await mayoralityService.getMayoralities(validatedParams);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(mayoralities),
            "application/json"
        );
    } catch (err) {
        return handleError(res, err);
    }
}

async function getMayoralityById(req, res, { params: { id } }) {
    try {
        const validated = validateSchema("mayorality", "getById", { id });

        const mayorality = await mayoralityService.getMayoralityById(validated.id);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(mayorality),
            "application/json"
        );
    } catch (err) {
        handleError(res, err);
    }
}

async function createMayorality(req, res) {
    try {
        const body = await parseRequestBody(req);

        const validatedBody = validateSchema("mayorality", "create", body);

        const mayorality = await mayoralityService.createMayorality(validatedBody);

        return sendHttpResponse(
            res,
            201,
            JSON.stringify(mayorality),
            "application/json"
        );
    } catch (err) {
        handleError(res, err);
    }
}

async function updateMayorality(req, res, { params: { id } }) {
    try {
        const body = await parseRequestBody(req);

        const validatedBody = validateSchema(
            "mayorality",
            "update",
            {
                ...body,
                id
            }
        );

        const mayorality = await mayoralityService.updateMayorality(validatedBody.id, validatedBody);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(mayorality),
            "application/json"
        );
    } catch (err) {
        handleError(res, err);
    }
}

async function deleteMayoralities(req, res) {
    try {
        const body = await parseRequestBody(req);

        const validated = validateSchema("mayorality", "delete", body);

        const deleted = await mayoralityService.deleteMayoralities(validated.ids);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(deleted),
            "application/json"
        );
    } catch (err) {
        handleError(res, err);
    }
}

async function getMayoralityOptions(req, res, { query }) {
    try {
        const validatedParams = validateSchema("mayorality", "options", query);

        const mayoralities = await mayoralityService.getMayoralityOptions(validatedParams);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(mayoralities),
            "application/json"
        );
    } catch (err) {
        handleError(res, err);
    }
}

module.exports = {
    exportMayoralityCsv,
    exportMayoralityExcel,
    getMayoralities,
    getMayoralityById,
    createMayorality,
    updateMayorality,
    deleteMayoralities,
    getMayoralityOptions
}