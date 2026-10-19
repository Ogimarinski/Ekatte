const crypto = require("crypto");
const jwt = require("jsonwebtoken");

function generateVerificationToken() {
    return crypto
        .randomBytes(32)
        .toString("hex");
}

function generateAccessToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    )
}

function verifyAccessToken(token) {
    return jwt.verify(
        token,
        process.env.JWT_SECRET
    );
}

module.exports = {
    generateVerificationToken,
    generateAccessToken,
    verifyAccessToken
};