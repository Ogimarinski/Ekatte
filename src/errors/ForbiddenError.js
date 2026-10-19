const { AppError } = require("./AppError");

class ForbiddenError extends AppError {
    constructor(message, options) {
        super(403, message, options);
    }
}

module.exports = { ForbiddenError };