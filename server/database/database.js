const { db, testConnection: rawTestConnection, closeConnection } = require('./config');

// Lightweight wrapper so the rest of the codebase uses a single knex client
let connected = false;

async function testConnection() {
  try {
    const ok = await rawTestConnection();
    connected = ok;
    return ok;
  } catch (error) {
    connected = false;
    console.error('❌ Error testing database connection:', error.message);
    return false;
  }
}

async function run(sql, params = []) {
  return db.raw(sql, params);
}

async function get(sql, params = []) {
  const result = await db.raw(sql, params);
  if (Array.isArray(result)) {
    return result[0];
  }
  if (result && result.rows) {
    return result.rows[0];
  }
  return result;
}

async function all(sql, params = []) {
  const result = await db.raw(sql, params);
  if (Array.isArray(result)) {
    return result;
  }
  if (result && result.rows) {
    return result.rows;
  }
  return [];
}

function isConnected() {
  return connected;
}

async function beginTransaction() {
  return db.transaction();
}

module.exports = {
  db,
  run,
  get,
  all,
  testConnection,
  isConnected,
  beginTransaction,
  closeConnection,
};
