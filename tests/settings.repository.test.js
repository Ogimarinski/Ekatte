jest.mock("../db");

const db = require("../db");
const {
    findUserSettings,
    createUserSettings,
    updateUserSettings
} = require("../src/repositories/settings.repository");

describe("settings.repository", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("findUserSettings", async () => {
        db.query.mockResolvedValue({
            rows: [{ login_block_duration_minutes: 15, resend_email_interval_minutes: 1 }]
        });

        const result = await findUserSettings(1);

        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining("FROM user_settings"),
            [1]
        );

        expect(result).toEqual({ login_block_duration_minutes: 15, resend_email_interval_minutes: 1 });
    });

    test("findUserSettings returns undefined when no row exists", async () => {
        db.query.mockResolvedValue({ rows: [] });

        const result = await findUserSettings(1);

        expect(result).toBeUndefined();
    });

    test("createUserSettings", async () => {
        db.query.mockResolvedValue({
            rows: [{ user_id: 1, login_block_duration_minutes: 15, resend_email_interval_minutes: 1 }]
        });

        const result = await createUserSettings(1);

        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO user_settings"),
            [1]
        );

        expect(result).toEqual({ user_id: 1, login_block_duration_minutes: 15, resend_email_interval_minutes: 1 });
    });

    test("updateUserSettings", async () => {
        db.query.mockResolvedValue({
            rows: [{ user_id: 1, login_block_duration_minutes: 30, resend_email_interval_minutes: 2 }]
        });

        const result = await updateUserSettings(1, 30, 2);

        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining("UPDATE user_settings"),
            [30, 2, 1]
        );

        expect(result).toEqual({ user_id: 1, login_block_duration_minutes: 30, resend_email_interval_minutes: 2 });
    });
});
