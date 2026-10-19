const { parseRequestBody } = require("../src/http/utils/request");
const { validateSchema } = require("../src/validators/validator");

const settingsService = require("../src/services/settings.service");
const { getSettings, updateSettings } = require("../src/http/controllers/settings.controller");
const { sendHttpResponse } = require("../src/http/utils/response");
const { handleError } = require("../src/http/utils/errorHandler");

jest.mock("../src/http/utils/request");
jest.mock("../src/validators/validator");
jest.mock("../src/services/settings.service");
jest.mock("../src/http/utils/response");
jest.mock("../src/http/utils/errorHandler");

describe("settings.controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("getSettings returns 200 with the current user's settings", async () => {
        settingsService.getSettings.mockResolvedValue({
            login_block_duration_minutes: 15,
            resend_email_interval_minutes: 1
        });

        const req = { user: { id: 1 } };
        const res = {};

        await getSettings(req, res);

        expect(settingsService.getSettings).toHaveBeenCalledWith(1);
        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            200,
            JSON.stringify({
                login_block_duration_minutes: 15,
                resend_email_interval_minutes: 1
            }),
            "application/json"
        );
    });

    test("getSettings handles errors", async () => {
        const error = new Error("error");
        settingsService.getSettings.mockRejectedValue(error);

        const req = { user: { id: 1 } };
        const res = {};

        await getSettings(req, res);

        expect(handleError).toHaveBeenCalledWith(res, error);
    });

    test("updateSettings validates the body, updates and returns 200", async () => {
        parseRequestBody.mockResolvedValue({
            loginBlockDurationMinutes: 30,
            resendEmailIntervalMinutes: 2
        });

        validateSchema.mockReturnValue({
            loginBlockDurationMinutes: 30,
            resendEmailIntervalMinutes: 2
        });

        settingsService.updateSettings.mockResolvedValue({
            login_block_duration_minutes: 30,
            resend_email_interval_minutes: 2
        });

        const req = { user: { id: 1 } };
        const res = {};

        await updateSettings(req, res);

        expect(validateSchema).toHaveBeenCalledWith(
            "settings",
            "update",
            {
                loginBlockDurationMinutes: 30,
                resendEmailIntervalMinutes: 2
            }
        );

        expect(settingsService.updateSettings).toHaveBeenCalledWith(1, {
            loginBlockDurationMinutes: 30,
            resendEmailIntervalMinutes: 2
        });

        expect(sendHttpResponse).toHaveBeenCalledWith(
            res,
            200,
            JSON.stringify({
                login_block_duration_minutes: 30,
                resend_email_interval_minutes: 2
            }),
            "application/json"
        );
    });

    test("updateSettings handles errors", async () => {
        const error = new Error("error");
        parseRequestBody.mockRejectedValue(error);

        const req = { user: { id: 1 } };
        const res = {};

        await updateSettings(req, res);

        expect(handleError).toHaveBeenCalledWith(res, error);
    });
});
