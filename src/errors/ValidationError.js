const { AppError } = require("./AppError");

class ValidationError extends AppError {
    constructor(message, options) {
        super(400, message, options);
    }
}

module.exports = { ValidationError };