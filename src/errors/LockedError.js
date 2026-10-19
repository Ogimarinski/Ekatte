const { AppError } = require("./AppError");

class LockedError extends AppError {
    constructor(message, options) {
        super(423, message, options);
    }
}

module.exports = { LockedError };