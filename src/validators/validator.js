const Ajv = require("ajv");
const { ValidationError } = require("../errors/ValidationError");

const ajv = new Ajv({
    allErrors: true,
    coerceTypes: true
});

function isValidCalendarDate(str) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;

    const [year, month, day] = str.split("-").map(Number);
    const d = new Date(year, month - 1, day);

    return d.getFullYear() === year &&
        d.getMonth() === month - 1 &&
        d.getDate() === day;
}

function isValidEmail(str) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) return false;

    return true;
}

ajv.addFormat("date", isValidCalendarDate);
ajv.addFormat("email", isValidEmail);

const validators = {
    region: {
        create: ajv.compile(
            require("../schemas/region/create.validate.json")
        ),
        update: ajv.compile(
            require("../schemas/region/update.validate.json")
        ),
        list: ajv.compile(
            require("../schemas/region/list.json")
        ),
        getById: ajv.compile(
            require("../schemas/region/getById.json")
        ),
        delete: ajv.compile(
            require("../schemas/region/delete.json")
        )
    },
    municipality: {
        create: ajv.compile(
            require("../schemas/municipality/create.validate.json")
        ),
        update: ajv.compile(
            require("../schemas/municipality/update.validate.json")
        ),
        list: ajv.compile(
            require('../schemas/municipality/list.json')
        ),
        getById: ajv.compile(
            require("../schemas/municipality/getById.json")
        ),
        delete: ajv.compile(
            require("../schemas/municipality/delete.json")
        ),
        options: ajv.compile(
            require("../schemas/municipality/options.json")
        )
    },
    mayorality: {
        create: ajv.compile(
            require("../schemas/mayorality/create.validate.json")
        ),
        update: ajv.compile(
            require("../schemas/mayorality/update.validate.json")
        ),
        list: ajv.compile(
            require("../schemas/mayorality/list.json")
        ),
        getById: ajv.compile(
            require("../schemas/mayorality/getById.json")
        ),
        delete: ajv.compile(
            require("../schemas/mayorality/delete.json")
        ),
        options: ajv.compile(
            require("../schemas/mayorality/options.json")
        )
    },
    settlement: {
        create: ajv.compile(
            require("../schemas/settlement/create.validate.json")
        ),
        update: ajv.compile(
            require("../schemas/settlement/update.validate.json")
        ),
        list: ajv.compile(
            require("../schemas/settlement/list.json")
        ),
        getById: ajv.compile(
            require("../schemas/settlement/getById.json")
        ),
        delete: ajv.compile(
            require("../schemas/settlement/delete.json")
        ),
        climate: ajv.compile(
            require("../schemas/settlement/climate.json")
        ),
        climate_years: ajv.compile(
            require("../schemas/settlement/climate_years.json")
        )
    },
    auth: {
        register: ajv.compile(
            require("../schemas/auth/register.json")
        ),
        verify: ajv.compile(
            require("../schemas/auth/verify.json")
        ),
        resend: ajv.compile(
            require("../schemas/auth/resend.json")
        ),
        login: ajv.compile(
            require("../schemas/auth/login.json")
        )
    },
    settings: {
        update: ajv.compile(
            require("../schemas/settings/update.json")
        )
    },
    climate: {
        summary: ajv.compile(
            require("../schemas/climate/summary.json")
        ),
        timeseries: ajv.compile(
            require("../schemas/climate/timeseries.json")
        ),
        topsettlements: ajv.compile(
            require("../schemas/climate/topsettlements.json")
        )
    }
};

function validateSchema(resource, operation, data) {

    const resourceSchemas = validators[resource];

    if (!resourceSchemas) {
        throw new ValidationError("Invalid resource");
    }

    const validate = resourceSchemas[operation];

    if (!validate) {
        throw new ValidationError("Invalid operation");
    }

    // coerceTypes променя обекта, който валидира — копираме, за да не пипаме данните на извикващия.
    const validatedData = { ...data };

    const valid = validate(validatedData);

    if (!valid) {
        throw new ValidationError(
            ajv.errorsText(validate.errors)
        );
    }

    return validatedData;
}

module.exports = {
    validateSchema
}
