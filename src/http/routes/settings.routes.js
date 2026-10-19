const settingsController = require("../controllers/settings.controller");

module.exports = [
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/settings" }),
        requiresAuth: true,
        handler: settingsController.getSettings
    },
    {
        method: "PUT",
        pattern: new URLPattern({ pathname: "/api/settings" }),
        requiresAuth: true,
        handler: settingsController.updateSettings
    }
];