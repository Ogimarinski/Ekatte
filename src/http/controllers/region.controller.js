const regionService = require("../../services/region.service");
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
    "updated_at"
];

const COLUMNS = [
    { header: "ID", key: "id", width: 10 },
    { header: "Код", key: "code", width: 15 },
    { header: "Област(Име)", key: "name", width: 30 },
    { header: "Последна промяна", key: "updated_at", width: 25 }
];

function getExportStream(query) {
    const validatedFilters = validateSchema("region", "list", query);

    return regionService.exportRegions(validatedFilters);
}

async function exportRegionCsv(req, res, { query }) {
    try {
        const stream = await getExportStream(query);

        res.writeHead(200, {
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=regions.csv"
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

async function exportRegionExcel(req, res, { query }) {
    try {
        const stream = await getExportStream(query);

        res.writeHead(200, {
            "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "content-disposition": "attachment; filename=regions.xlsx"
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


async function getRegions(req, res, { query }) {
    try {
        const validatedParams = validateSchema("region", "list", query);

        const regions = await regionService.getRegions(validatedParams);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(regions),
            "application/json"
        );
    } catch (err) {
        return handleError(res, err);
    }
}

async function getRegionById(req, res, { params: { id } }) {
    try {
        const validated = validateSchema("region", "getById", { id });

        const region = await regionService.getRegionById(validated.id);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(region),
            "application/json"
        );
    } catch (err) {
        return handleError(res, err);
    }
}

async function createRegion(req, res) {
    try {
        const body = await parseRequestBody(req);

        const validatedBody = validateSchema("region", "create", body);

        const region = await regionService.createRegion(validatedBody);

        return sendHttpResponse(
            res,
            201,
            JSON.stringify(region),
            "application/json"
        );
    } catch (err) {
        return handleError(res, err);
    }
}

async function updateRegion(req, res, { params: { id } }) {
    try {
        const body = await parseRequestBody(req);

        const validatedBody = validateSchema(
            "region",
            "update",
            {
                ...body,
                id
            },
        );

        const region = await regionService.updateRegion(validatedBody.id, validatedBody);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(region),
            "application/json"
        );
    } catch (err) {
        return handleError(res, err);
    }
}

async function deleteRegions(req, res) {
    try {
        const body = await parseRequestBody(req);

        const validated = validateSchema("region", "delete", body);

        const deleted = await regionService.deleteRegions(validated.ids);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(deleted),
            "application/json"
        );
    } catch (err) {
        return handleError(res, err)
    }
}

async function getRegionOptions(req, res) {
    try {
        const regions = await regionService.getRegionOptions();

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(regions),
            "application/json"
        );
    } catch (err) {
        handleError(res, err);
    }
}

module.exports = {
    exportRegionCsv,
    exportRegionExcel,
    getRegions,
    getRegionById,
    createRegion,
    updateRegion,
    deleteRegions,
    getRegionOptions
};