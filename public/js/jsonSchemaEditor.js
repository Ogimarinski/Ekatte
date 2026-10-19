import { authFetch } from "./auth/auth.api.js";

/* global JSONEditor */
let editor = null;
let currentSchema = null;

//Взима само полетата от value, които съществуват в schema-та.
function pickSchemaValue(schema, value) {
    const result = {};

    Object.keys(schema.properties || {}).forEach(key => {
        //Има ли value собствено поле с име key 
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            result[key] = value[key];
        }
    });

    return result;
}

function getTranslatedErrors(schema, errors) {
    const translated = [];
    const fieldsWithMinLength = new Set();

    // Запомням полетата, които вече имат minLength грешка
    errors.forEach(error => {
        if (error.property === "minLength") {
            fieldsWithMinLength.add(error.path);
        }
    });

    errors.forEach(error => {
        // Ако полето е празно, не показвам и pattern грешката
        if (error.property === "pattern" && fieldsWithMinLength.has(error.path)) {
            return;
        }

        // Error path-a е root.name, махам root. и става name
        const field = error.path.replace("root.", "");

        // Взимам schema-та на конкретното поле, например schema.properties["name"]
        const fieldSchema = schema.properties?.[field];

        // Взимам къстъм съобщението за грешка, спрямо кое пропърти е проблемното
        const customMessage = fieldSchema?.["x-errors"]?.[error.property];

        translated.push(customMessage ?? error.message);
    });

    return [...new Set(translated)];
}

export async function initJsonSchemaEditor(holder, resource, action = "create", value = {}) {

    const res = await authFetch(`/api/schemas/${resource}/${action}`);

    if (!res.ok) {
        throw new Error("Schema could not be loaded");
    }

    currentSchema = await res.json();

    if (editor) {
        editor.destroy();
    }

    holder.innerHTML = "";

    const options = {
        schema: currentSchema,
        theme: 'html',
        disable_collapse: true,
        disable_edit_json: true,
        disable_properties: true,
        show_errors: "never"
    };

    if (Object.keys(value).length > 0) {
        options.startval = pickSchemaValue(currentSchema, value);
    }

    editor = new JSONEditor(holder, options);

    return editor;
}

export function destroyJsonSchemaEditor() {
    if (!editor) return;

    editor.destroy();
    editor = null;
}

export function getJsonSchemaEditorPayload() {
    if (!editor) {
        return {
            payload: {},
            hasError: true
        };
    }

    const errors = editor.validate();

    if (errors.length > 0) {
        const messages = getTranslatedErrors(
            editor.schema,
            errors
        );

        alert(messages.join("\n"));

        return {
            payload: {},
            hasError: true
        };
    }

    return {
        payload: editor.getValue(),
        hasError: false
    };
}
