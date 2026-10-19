const authController = require("../controllers/auth.controller");

module.exports = [
    {
        method: "POST",
        pattern: new URLPattern({ pathname: "/api/auth/register" }),
        requiresAuth: false,
        handler: authController.register
    },
    {
        method: "GET",
        pattern: new URLPattern({ pathname: "/api/auth/verify" }),
        requiresAuth: false,
        handler: authController.verify
    },
    {
        method: "POST",
        pattern: new URLPattern({ pathname: "/api/auth/resend" }),
        requiresAuth: false,
        handler: authController.resendVerification
    },
    {
        method: "POST",
        pattern: new URLPattern({ pathname: "/api/auth/login" }),
        requiresAuth: false,
        handler: authController.login
    }
]