const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function getDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      name       TEXT    NOT NULL,
      email      TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS documents (
      id           SERIAL PRIMARY KEY,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      file_name    TEXT    NOT NULL,
      file_path    TEXT    NOT NULL,
      file_url     TEXT    NOT NULL DEFAULT '',
      upload_date  TIMESTAMP NOT NULL DEFAULT NOW(),
      file_type    TEXT    NOT NULL,
      file_size    INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS password_resets (
      id         SERIAL PRIMARY KEY,
      email      TEXT    NOT NULL,
      otp        TEXT    NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used       BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  return pool;
}

async function run(sql, params = []) {
  const result = await pool.query(sql, params);
  return { lastInsertRowid: result.rows[0]?.id, rowCount: result.rowCount };
}

async function get(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0] || null;
}

async function all(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

module.exports = { getDb, run, get, all, pool };
