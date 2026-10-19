const municipalityService = require("../../services/municipality.service");
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
    "region_name",
    "updated_at"
];

const COLUMNS = [
    { header: "ID", key: "id", width: 10 },
    { header: "Код", key: "code", width: 15 },
    { header: "Име", key: "name", width: 30 },
    { header: "Област(Име)", key: "region_name", width: 25 },
    { header: "Последна промяна", key: "updated_at", width: 20 }
];

function getExportStream(query) {
    const validatedFilters = validateSchema("municipality", "list", query);

    return municipalityService.exportMunicipalities(validatedFilters);
}

async function exportMunicipalityCsv(req, res, { query }) {
    try {
        const stream = await getExportStream(query);

        res.writeHead(200, {
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=municipality.csv"
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

async function exportMunicipalityExcel(req, res, { query }) {
    try {
        const stream = await getExportStream(query);

        res.writeHead(200, {
            "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "content-disposition": "attachment; filename=municipalities.xlsx"
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

async function getMunicipalities(req, res, { query }) {
    try {
        const validatedParams = validateSchema("municipality", "list", query);

        const municipalities = await municipalityService.getMunicipalities(validatedParams);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(municipalities),
            "application/json"
        );
    } catch (err) {
        return handleError(res, err);
    }
}

async function getMunicipalitesById(req, res, { params: { id } }) {
    try {
        const validated = validateSchema("municipality", "getById", { id });

        const municipality = await municipalityService.getMunicipalityById(validated.id);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(municipality),
            "application/json"
        );
    } catch (err) {
        return handleError(res, err);
    }
}

async function createMunicipality(req, res) {
    try {
        const body = await parseRequestBody(req);

        const validatedBody = validateSchema("municipality", "create", body);

        const municipality = await municipalityService.createMunicipality(validatedBody);

        return sendHttpResponse(
            res,
            201,
            JSON.stringify(municipality),
            "application/json"
        );
    } catch (err) {
        handleError(res, err);
    }
}

async function updateMunicipality(req, res, { params: { id } }) {
    try {
        const body = await parseRequestBody(req);

        const validatedBody = validateSchema(
            "municipality",
            "update",
            {
                ...body,
                id
            }
        );

        const municipality = await municipalityService.updateMunicipality(validatedBody.id, validatedBody);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(municipality),
            "application/json"
        );
    } catch (err) {
        handleError(res, err);
    }
}

async function deleteMunicipalities(req, res) {
    try {
        const body = await parseRequestBody(req);

        const validated = validateSchema("municipality", "delete", body);

        const deleted = await municipalityService.deleteMunicipalities(validated.ids);

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


async function getMunicipalityOptions(req, res, { query }) {
    try {
        const validatedParams = validateSchema("municipality", "options", query);

        const municipalities = await municipalityService.getMunicipalityOptions(validatedParams);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(municipalities),
            "application/json"
        );

    } catch (err) {
        handleError(res, err);
    }
}


module.exports = {
    exportMunicipalityCsv,
    exportMunicipalityExcel,
    getMunicipalities,
    getMunicipalitesById,
    createMunicipality,
    updateMunicipality,
    deleteMunicipalities,
    getMunicipalityOptions
};