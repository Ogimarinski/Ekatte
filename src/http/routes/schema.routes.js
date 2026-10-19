const schemaController = require("../controllers/schema.controller");

module.exports = [
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/schemas/:resource/create" }),
        handler: schemaController.getCreateSchema
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/schemas/:resource/update" }),
        handler: schemaController.getUpdateSchema
    },
];
