const { AppError } = require("./AppError");

class TooManyRequestsError extends AppError {
    constructor(message, options) {
        super(429, message, options);
    }
}

module.exports = { TooManyRequestsError };