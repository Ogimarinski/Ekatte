const { AppError } = require("./AppError");

class ConflictError extends AppError {
    constructor(message, options) {
        super(409, message, options);
    }
}

module.exports = { ConflictError };