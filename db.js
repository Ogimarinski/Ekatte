/* istanbul ignore file */
require("dotenv").config();
const { Pool } = require("pg");

const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
    })
    : new Pool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
        port: process.env.DB_PORT,

        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
    });

pool.on('error', (err) => {
    console.error("Unexpected error on idle database client:", err);
});

pool.on('connect', (client) => {
    client.on('error', (err) => {
        console.error("Unexpected error on database client: ", err);
    });
});

module.exports = pool;