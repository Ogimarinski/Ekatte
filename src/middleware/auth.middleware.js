const { UnauthorizedError } = require("../errors/UnauthorizedError");
const { verifyAccessToken } = require("../utils/token.utils");

async function authMiddleware(req) {
    const authorization = req.headers.authorization;

    if (!authorization) {
        throw new UnauthorizedError("Authorization header is required");
    }

    if (!authorization.startsWith("Bearer ")) {
        throw new UnauthorizedError("Invalid Authorization header");
    }

    const token = authorization.substring(7);

    try {
        const payload = verifyAccessToken(token);

        req.user = payload;
    } catch {
        throw new UnauthorizedError("Invalid or expired access token");
    }
}

module.exports = { authMiddleware };