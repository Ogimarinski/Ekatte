jest.mock("../src/repositories/settings.repository");

const settingsRepository = require("../src/repositories/settings.repository");

const {
    createSettings,
    getOrCreateUserSettings,
    getSettings,
    updateSettings
} = require("../src/services/settings.service");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("createSettings", () => {
    test("delegates to repository", async () => {
        const created = { user_id: 1, login_block_duration_minutes: 15, resend_email_interval_minutes: 1 };

        settingsRepository.createUserSettings.mockResolvedValue(created);

        const result = await createSettings(1);

        expect(settingsRepository.createUserSettings).toHaveBeenCalledWith(1);
        expect(result).toBe(created);
    });
});

describe("getOrCreateUserSettings", () => {
    test("returns the existing row without creating one", async () => {
        const existing = { login_block_duration_minutes: 15, resend_email_interval_minutes: 1 };

        settingsRepository.findUserSettings.mockResolvedValue(existing);

        const result = await getOrCreateUserSettings(1);

        expect(settingsRepository.findUserSettings).toHaveBeenCalledWith(1);
        expect(settingsRepository.createUserSettings).not.toHaveBeenCalled();
        expect(result).toBe(existing);
    });

    test("creates a default row when none exists (legacy user)", async () => {
        const created = { login_block_duration_minutes: 15, resend_email_interval_minutes: 1 };

        settingsRepository.findUserSettings.mockResolvedValue(undefined);
        settingsRepository.createUserSettings.mockResolvedValue(created);

        const result = await getOrCreateUserSettings(1);

        expect(settingsRepository.createUserSettings).toHaveBeenCalledWith(1);
        expect(result).toBe(created);
    });
});

describe("getSettings", () => {
    test("delegates to getOrCreateUserSettings behaviour", async () => {
        const existing = { login_block_duration_minutes: 15, resend_email_interval_minutes: 1 };

        settingsRepository.findUserSettings.mockResolvedValue(existing);

        const result = await getSettings(1);

        expect(settingsRepository.findUserSettings).toHaveBeenCalledWith(1);
        expect(result).toBe(existing);
    });
});

describe("updateSettings", () => {
    test("ensures a row exists, then updates it", async () => {
        const updated = { login_block_duration_minutes: 30, resend_email_interval_minutes: 2 };

        settingsRepository.findUserSettings.mockResolvedValue({
            login_block_duration_minutes: 15,
            resend_email_interval_minutes: 1
        });
        settingsRepository.updateUserSettings.mockResolvedValue(updated);

        const result = await updateSettings(1, {
            loginBlockDurationMinutes: 30,
            resendEmailIntervalMinutes: 2
        });

        expect(settingsRepository.findUserSettings).toHaveBeenCalledWith(1);
        expect(settingsRepository.updateUserSettings).toHaveBeenCalledWith(1, 30, 2);
        expect(result).toBe(updated);
    });

    test("creates the missing row before updating (legacy user)", async () => {
        settingsRepository.findUserSettings.mockResolvedValue(undefined);
        settingsRepository.createUserSettings.mockResolvedValue({
            login_block_duration_minutes: 15,
            resend_email_interval_minutes: 1
        });
        settingsRepository.updateUserSettings.mockResolvedValue({
            login_block_duration_minutes: 30,
            resend_email_interval_minutes: 2
        });

        await updateSettings(1, {
            loginBlockDurationMinutes: 30,
            resendEmailIntervalMinutes: 2
        });

        expect(settingsRepository.createUserSettings).toHaveBeenCalledWith(1);
        expect(settingsRepository.updateUserSettings).toHaveBeenCalledWith(1, 30, 2);
    });
});
