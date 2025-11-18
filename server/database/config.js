const knex = require('knex');
const path = require('path');

// Configuración de la base de datos SQLite
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, 'bitforward.sqlite3'),
  },
  useNullAsDefault: true, // Configuración recomendada para SQLite
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: path.join(__dirname, '../migrations'),
  },
});

// Función para verificar la conexión
const testConnection = async () => {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Conexión a la base de datos establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error.message);
    return false;
  }
};

// Función para cerrar la conexión
const closeConnection = async () => {
  try {
    await db.destroy();
    console.log('🔌 Conexión a la base de datos cerrada');
  } catch (error) {
    console.error('❌ Error al cerrar la conexión:', error.message);
  }
};

module.exports = {
  db,
  testConnection,
  closeConnection,
};
