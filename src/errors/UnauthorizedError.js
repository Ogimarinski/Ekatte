const { AppError } = require("./AppError");

class UnauthorizedError extends AppError {
    constructor(message, options) {
        super(401, message, options);
    }
}

module.exports = { UnauthorizedError };