const db = require("../../db");

async function findUserSettings(userId) {
    const result = await db.query(
        `
        SELECT
            login_block_duration_minutes,
            resend_email_interval_minutes
        FROM user_settings
        WHERE user_id = $1
        `,
        [userId]
    );

    return result.rows[0];
}

async function createUserSettings(userId) {
    const result = await db.query(
        `INSERT INTO user_settings(user_id) VALUES ($1) RETURNING *`,
        [userId]
    );

    return result.rows[0];
}

async function updateUserSettings(userId, loginBlockDuration, resendEmailIntervalMinutes) {
    const result = await db.query(
        `
        UPDATE user_settings
        SET
            login_block_duration_minutes = $1,
            resend_email_interval_minutes = $2
        WHERE user_id = $3
        RETURNING *
        `,
        [loginBlockDuration, resendEmailIntervalMinutes, userId]
    );

    return result.rows[0];
}

module.exports = {
    findUserSettings,
    createUserSettings,
    updateUserSettings
};
