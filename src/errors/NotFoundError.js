const { AppError } = require("./AppError");

class NotFoundError extends AppError {
    constructor(message, options) {
        super(404, message, options);
    }
}

module.exports = { NotFoundError };