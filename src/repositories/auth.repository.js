const db = require("../../db");
const { assertPositiveInt } = require("../utils/assert.utils");

async function createUser(email, passwordHash, client = db) {
    const result = await client.query(
        `
        INSERT INTO users(email, password_hash)
        VALUES ($1, $2)
        RETURNING *
        `,
        [email, passwordHash]
    );

    return result.rows[0];
}

async function findUserByEmail(email) {
    const result = await db.query(
        `
        SELECT *
        FROM users
        WHERE email = $1
        `,
        [email]
    );

    return result.rows[0];
}

async function markUserAsVerified(id, client = db) {

    assertPositiveInt(id, 'id');

    const result = await client.query(
        `
        UPDATE users
        SET is_verified = true,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0];
}

// ----Verification tokens -----

async function createVerificationToken(userId, token, expiresAt, client = db) {

    assertPositiveInt(userId, 'userId');

    const result = await client.query(
        `
        INSERT INTO verification_tokens (user_id, token, expires_at)
        VALUES ($1, $2, $3)
        ON CONFLICT(user_id)
        DO UPDATE SET 
            token = EXCLUDED.token,
            expires_at = EXCLUDED.expires_at,
            created_at = NOW()
        RETURNING *
        `,
        [userId, token, expiresAt]
    );

    return result.rows[0];


}

async function findVerificationToken(token) {
    const result = await db.query(
        `
        SELECT
            vt.user_id,
            u.email,
            u.is_verified,
            vt.token,
            vt.expires_at
        FROM verification_tokens vt
        JOIN users u
            ON u.id = vt.user_id
        WHERE vt.token = $1;
        `,
        [token]
    );

    return result.rows[0];
}

async function findVerificationTokenByUserId(userId) {

    assertPositiveInt(userId, 'userId');

    const result = await db.query(
        `
        SELECT
            vt.token,
            vt.expires_at,
            vt.created_at
        FROM verification_tokens vt
        WHERE vt.user_id = $1
        `,
        [userId]
    );

    return result.rows[0];
}

async function deleteVerificationToken(token, client = db) {
    await client.query(
        `
        DELETE
        FROM verification_tokens
        WHERE token = $1;
        `,
        [token]
    );
}

async function verifyUserWithToken(userId, token) {

    assertPositiveInt(userId, 'userId');

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const user = await markUserAsVerified(userId, client);
        await deleteVerificationToken(token, client);

        await client.query("COMMIT");
        return user;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

// ------------ SETTINGS -------

async function getSetting(key) {
    const result = await db.query(
        `
        SELECT value
        FROM settings
        WHERE key = $1;
        `,
        [key]
    );

    return result.rows[0]?.value;
}

async function incrementFailedAttempts(userId) {

    assertPositiveInt(userId, 'userId');

    const result = await db.query(
        `
        UPDATE users
        SET
            failed_attempts = failed_attempts + 1,
            updated_at = NOW()
        WHERE id = $1
        RETURNING failed_attempts
        `,
        [userId]
    );

    return result.rows[0];
}

async function resetFailedAttempts(userId) {

    assertPositiveInt(userId, 'userId');

    await db.query(
        `
        UPDATE users
        SET
            failed_attempts = 0,
            blocked_until = NULL,
            updated_at = NOW()
        WHERE id = $1
        `,
        [userId]
    );
}


async function setBlockedUntil(userId, blockedUntil) {

    assertPositiveInt(userId, 'userId');

    await db.query(
        `
        UPDATE users
        SET 
            blocked_until = $1,
            updated_at = NOW()
        WHERE id = $2
        `,
        [blockedUntil, userId]
    );
}

async function createUserWithVerificationToken(email, passwordHash, token, expiresAt) {
    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const user = await createUser(email, passwordHash, client);
        await createVerificationToken(user.id, token, expiresAt, client);

        await client.query("COMMIT");
        return user;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    createUser,
    findUserByEmail,
    markUserAsVerified,
    createVerificationToken,
    findVerificationToken,
    findVerificationTokenByUserId,
    deleteVerificationToken,
    getSetting,
    incrementFailedAttempts,
    resetFailedAttempts,
    setBlockedUntil,
    createUserWithVerificationToken,
    verifyUserWithToken
};