const { ValidationError } = require("../../errors/ValidationError");

// При повтарящ се ключ печели последната непразна стойност
function parseQuery(searchParams) {
    const query = Object.create(null);

    for (const [key, value] of searchParams) {
        const trimmedValue = value.trim();

        if (trimmedValue !== '') {
            query[key] = trimmedValue;
        }
    }

    return query;
}

async function parseRequestBody(req) {
    return new Promise((res, rej) => {
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {
            try {
                const parsed = JSON.parse(body || "{}");
                res(parsed);
            } catch (err) {
                rej(new ValidationError("Invalid JSON body", { cause: err }));
            }
        });

        req.on("error", rej);
    });
}

module.exports = { parseRequestBody, parseQuery };