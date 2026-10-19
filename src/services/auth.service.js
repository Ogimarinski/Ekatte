const authRepository = require("../repositories/auth.repository");
const settingsService = require("./settings.service");
const { generateVerificationToken, generateAccessToken } = require("../utils/token.utils");
const { hashPassword, comparePassword } = require("../utils/password.utils");
const { sendVerificationEmail } = require("../services/email.service");
const { ValidationError } = require("../errors/ValidationError");
const { UnauthorizedError } = require("../errors/UnauthorizedError");
const { ForbiddenError } = require("../errors/ForbiddenError");
const { ConflictError } = require("../errors/ConflictError");
const { TooManyRequestsError } = require("../errors/TooManyRequestsError");
const { NotFoundError } = require("../errors/NotFoundError");
const { LockedError } = require("../errors/LockedError");

async function register(email, password) {
    const existingUser = await authRepository.findUserByEmail(email);

    if (existingUser) {
        throw new ConflictError("User already exists");
    }

    const passwordHash = await hashPassword(password);
    const token = generateVerificationToken();

    const expirationMinutes = await authRepository.getSetting("verification_token_expiration_minutes");

    const expiresAt = new Date();

    expiresAt.setMinutes(
        expiresAt.getMinutes() + Number(expirationMinutes)
    );

    const user = await authRepository.createUserWithVerificationToken(
        email,
        passwordHash,
        token,
        expiresAt
    );

    sendVerificationEmail(
        user.email,
        token
    ).catch((err) => {
        console.error(`Failed to send verification email to ${user.email}:`, err);
    });

    return {
        message: "Verification email sent."
    };
}

async function verify(token) {
    const verificationToken = await authRepository.findVerificationToken(token);

    if (!verificationToken) {
        throw new NotFoundError("Verification token not found.");
    }

    if (verificationToken.expires_at < new Date()) {
        throw new ValidationError("Verification token has expired");
    }

    if (verificationToken.is_verified) {
        throw new ConflictError("User is already verified.");
    }

    await authRepository.verifyUserWithToken(
        verificationToken.user_id,
        token
    );

    return {
        message: "Email verified successfully"
    };
}

async function resendVerification(email) {
    const user = await authRepository.findUserByEmail(email);

    if (!user) {
        throw new NotFoundError("User not found.");
    }

    if (user.is_verified) {
        throw new ConflictError("User is already verified.");
    }

    const verificationToken = await authRepository.findVerificationTokenByUserId(user.id);

    if (!verificationToken) {
        throw new NotFoundError("Verification token not found");
    }

    const userSettings = await settingsService.getSettings(user.id);
    const resendInterval = userSettings.resend_email_interval_minutes;

    const availableAt = new Date(
        verificationToken.created_at
    );

    availableAt.setMinutes(
        availableAt.getMinutes() + Number(resendInterval)
    );

    if (availableAt > new Date()) {
        throw new TooManyRequestsError("Please wait before requesting another verification email");
    }

    const expirationMinutes = await authRepository.getSetting("verification_token_expiration_minutes");

    const token = generateVerificationToken();

    const expiresAt = new Date();

    expiresAt.setMinutes(
        expiresAt.getMinutes() + Number(expirationMinutes)
    );

    await authRepository.createVerificationToken(
        user.id,
        token,
        expiresAt
    );

    sendVerificationEmail(
        user.email,
        token
    ).catch((err) => {
        console.error(`Failed to send verification email to ${user.email}:`, err);
    });

    return {
        message: "Verification email sent"
    };
}

async function login(email, password) {
    const user = await authRepository.findUserByEmail(email);

    if (!user) {
        throw new UnauthorizedError("Invalid email or password");
    }

    if (user.blocked_until) {

        if (user.blocked_until > new Date()) {
            throw new LockedError(
                "Account is temporarily locked."
            );
        }

        await authRepository.resetFailedAttempts(
            user.id
        );

        user.blocked_until = null;
        user.failed_attempts = 0;
    }

    const isPasswordValid = await comparePassword(
        password,
        user.password_hash
    );

    if (!isPasswordValid) {
        const attempts = await authRepository.incrementFailedAttempts(
            user.id
        );

        const maxAttempts = Number(
            await authRepository.getSetting(
                "max_failed_login_attempts"
            )
        );

        if (attempts.failed_attempts >= maxAttempts) {

            const userSettings = await settingsService.getSettings(user.id);
            const blockedDuration = userSettings.login_block_duration_minutes;

            const blockedUntil = new Date();

            blockedUntil.setMinutes(
                blockedUntil.getMinutes() + blockedDuration
            );

            await authRepository.setBlockedUntil(
                user.id,
                blockedUntil
            );
        }

        throw new UnauthorizedError(
            "Invalid email or password"
        );
    }

    if (!user.is_verified) {
        throw new ForbiddenError("Please verify your email first");
    }

    await authRepository.resetFailedAttempts(
        user.id
    );

    const accessToken = generateAccessToken(user);

    return {
        accessToken
    };
}

module.exports = {
    register,
    verify,
    resendVerification,
    login
}