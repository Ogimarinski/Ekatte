const settlementService = require("../../services/settlement.service");
const { validateSchema } = require("../../validators/validator");

const { parseRequestBody } = require("../utils/request");
const { sendHttpResponse } = require("../utils/response");
const { handleError } = require("../utils/errorHandler");
const { streamCsv } = require("../utils/export");
const { streamExcel } = require("../utils/export");

const HEADERS = [
    "id",
    "ekatte",
    "geoname_id",
    "country_code",
    "name",
    "region_name",
    "municipality_name",
    "mayorality_name",
    "updated_at"
];

const COLUMNS = [
    { header: "ID", key: "id_display", width: 15 },
    { header: "Country", key: "country_code", width: 10 },
    { header: "Name", key: "name", width: 30 },
    { header: "Region", key: "region_name", width: 25 },
    { header: "Municipality", key: "municipality_name", width: 25 },
    { header: "Mayorality", key: "mayorality_name", width: 25 },
    { header: "Updated At", key: "updated_at", width: 25 }
];

function getExportStream(query) {
    const validatedFilters = validateSchema("settlement", "list", query);

    return settlementService.exportSettlements(validatedFilters);
}

async function exportSettlementCsv(req, res, { query }) {
    try {
        const stream = await getExportStream(query);

        res.writeHead(200, {
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=settlements.csv"
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

async function exportSettlementExcel(req, res, { query }) {
    try {
        const stream = await getExportStream(query);

        res.writeHead(200, {
            "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "content-disposition": "attachment; filename=settlements.xlsx"
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

async function getSettlements(req, res, { query }) {
    try {
        const validatedParams = validateSchema("settlement", "list", query);

        const settlements = await settlementService.getSettlements(validatedParams);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(settlements),
            "application/json"
        );
    } catch (err) {
        return handleError(res, err);
    }
}

async function getSettlementById(req, res, { params: { id } }) {
    try {
        const validated = validateSchema("settlement", "getById", { id });

        const settlement = await settlementService.getSettlemetById(validated.id);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(settlement),
            "application/json"
        );
    } catch (err) {
        return handleError(res, err);
    }
}

async function createSettlement(req, res) {
    try {
        const body = await parseRequestBody(req);

        const validatedBody = validateSchema("settlement", "create", body);

        const settlement = await settlementService.createSettlement(validatedBody);

        return sendHttpResponse(
            res,
            201,
            JSON.stringify(settlement),
            "application/json"
        );
    } catch (err) {
        return handleError(res, err);
    }
}

async function updateSettlement(req, res, { params: { id } }) {
    try {
        const body = await parseRequestBody(req);

        const validatedBody = validateSchema(
            "settlement",
            "update",
            {
                ...body,
                id
            }
        );

        const settlement = await settlementService.updateSettlement(validatedBody.id, validatedBody);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(settlement),
            "application/json"
        );
    } catch (err) {
        return handleError(res, err);
    }
}

async function deleteSettlements(req, res) {
    try {
        const body = await parseRequestBody(req);

        const validated = validateSchema("settlement", "delete", body);

        const deleted = await settlementService.deleteSettlements(validated.ids);

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(deleted),
            "application/json"
        );
    } catch (err) {
        return handleError(res, err);
    }
}

async function getSettlementClimate(req, res, { params: { id, year } }) {
    try {
        const validated = validateSchema("settlement", "climate", { id, year });

        const climate = await settlementService.getSettlementClimate(
            validated.id,
            validated.year
        );

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(climate),
            "application/json"
        );

    } catch (err) {
        return handleError(res, err);
    }
}

async function getSettlementClimateYears(req, res, { params: { id }, query }) {
    try {

        const validated = validateSchema("settlement", "climate_years", {
            ...query,
            id
        });

        const { id: settlementId, ...filters } = validated;

        const years = await settlementService.getSettlementClimateYears(
            settlementId,
            filters
        );

        return sendHttpResponse(
            res,
            200,
            JSON.stringify(years),
            "application/json"
        );

    } catch (err) {
        return handleError(res, err);
    }
}

module.exports = {
    exportSettlementCsv,
    exportSettlementExcel,
    getSettlements,
    getSettlementById,
    createSettlement,
    updateSettlement,
    deleteSettlements,
    getSettlementClimate,
    getSettlementClimateYears
}