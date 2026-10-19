class AppError extends Error {
    constructor(statusCode, message, options) {
        super(message, options);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
    }
}

module.exports = { AppError };