const settingsRepository = require("../repositories/settings.repository");

async function createSettings(userId) {
    return settingsRepository.createUserSettings(userId);
}

async function getOrCreateUserSettings(userId) {
    const existing = await settingsRepository.findUserSettings(userId);

    if (existing) {
        return existing;
    }

    return settingsRepository.createUserSettings(userId);
}

async function getSettings(userId) {
    return getOrCreateUserSettings(userId);
}

async function updateSettings(userId, { loginBlockDurationMinutes, resendEmailIntervalMinutes }) {
    // ако не съществува ред за user-а, гарантираме, че има преди update
    await getOrCreateUserSettings(userId);

    return settingsRepository.updateUserSettings(
        userId,
        loginBlockDurationMinutes,
        resendEmailIntervalMinutes
    );
}

module.exports = {
    createSettings,
    getOrCreateUserSettings,
    getSettings,
    updateSettings
};
