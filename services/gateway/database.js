// ─────────────────────────────────────────────
// SentinelX — Database Connection
// All PostgreSQL communication goes through here
// ─────────────────────────────────────────────

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Rinku@9358',

   max: 10,
   idleTimeoutMillis: 30000,
   connectionTimeoutMillis: 2000
});

pool.connect((error, client, release) => {
  if (error) {
    console.error('Failed to connect to PostgreSQL:', error.message);
    return;
  }
  console.log('Connected to PostgreSQL successfully');
  release(); 
});

async function query(sql, params) {
  try {
    const result = await pool.query(sql, params);
    return result;
  } catch (error) {
    console.error('Database query failed:', error.message);
    throw error;
  }
}

module.exports = { query };
