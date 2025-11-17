const { db, testConnection, closeConnection } = require('./config');

async function setupDatabase() {
  console.log('🏗️  Iniciando construcción del Búnker de Datos Persistente...\n');

  try {
    // Verificar conexión
    const connected = await testConnection();
    if (!connected) {
      throw new Error('No se pudo establecer conexión con la base de datos');
    }

    console.log('📋 Verificando y creando estructura de tablas...\n');

    // Tabla de usuarios
    if (!(await db.schema.hasTable('users'))) {
      await db.schema.createTable('users', table => {
        table.increments('id').primary();
        table.string('email').unique().notNullable();
        table.string('username').unique().notNullable();
        table.string('password_hash').notNullable();
        table.boolean('email_verified').defaultTo(false);
        table.string('verification_token').nullable();
        table.timestamp('last_login').nullable();
        table.json('profile').nullable(); // Para datos adicionales del usuario
        table.timestamps(true, true);

        // Índices para optimización
        table.index(['email']);
        table.index(['username']);
        table.index(['verification_token']);
      });
      console.log('✅ Tabla "users" creada con éxito');
    } else {
      console.log('📝 Tabla "users" ya existe');
    }

    // Tabla de contratos
    if (!(await db.schema.hasTable('contracts'))) {
      await db.schema.createTable('contracts', table => {
        table.string('id').primary(); // ID único del contrato
        table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.string('asset').notNullable(); // BTC, ETH, SOL, etc.
        table.decimal('amount', 20, 8).notNullable(); // Cantidad con precisión de 8 decimales
        table.decimal('strike_price', 20, 8).notNullable(); // Precio de ejercicio
        table.decimal('current_price', 20, 8).nullable(); // Precio actual para cálculos
        table.date('expiration_date').notNullable();
        table.string('status').defaultTo('active'); // active, expired, exercised, cancelled
        table.string('contract_type').defaultTo('forward'); // forward, option, future
        table.decimal('collateral_amount', 20, 8).nullable(); // Colateral requerido
        table.string('collateral_asset').nullable(); // Activo usado como colateral
        table.json('metadata').nullable(); // Datos adicionales del contrato
        table.timestamps(true, true);

        // Índices para consultas eficientes
        table.index(['user_id']);
        table.index(['asset']);
        table.index(['status']);
        table.index(['expiration_date']);
        table.index(['contract_type']);
      });
      console.log('✅ Tabla "contracts" creada con éxito');
    } else {
      console.log('📝 Tabla "contracts" ya existe');
    }

    // Tabla de préstamos
    if (!(await db.schema.hasTable('loans'))) {
      await db.schema.createTable('loans', table => {
        table.string('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.decimal('principal_amount', 20, 8).notNullable(); // Monto principal
        table.string('principal_asset').notNullable(); // USDT, USDC, DAI
        table.decimal('collateral_amount', 20, 8).notNullable(); // Cantidad de colateral
        table.string('collateral_asset').notNullable(); // BTC, ETH, SOL
        table.decimal('interest_rate', 8, 4).notNullable(); // APR con 4 decimales
        table.decimal('ltv_ratio', 5, 4).notNullable(); // Loan-to-Value ratio
        table.date('due_date').notNullable();
        table.string('status').defaultTo('active'); // active, repaid, liquidated, defaulted
        table.decimal('repaid_amount', 20, 8).defaultTo(0); // Cantidad ya pagada
        table.timestamp('liquidation_threshold').nullable();
        table.json('terms').nullable(); // Términos adicionales del préstamo
        table.timestamps(true, true);

        // Índices
        table.index(['user_id']);
        table.index(['status']);
        table.index(['due_date']);
        table.index(['collateral_asset']);
        table.index(['principal_asset']);
      });
      console.log('✅ Tabla "loans" creada con éxito');
    } else {
      console.log('📝 Tabla "loans" ya existe');
    }

    // Tabla de transacciones/historial
    if (!(await db.schema.hasTable('transactions'))) {
      await db.schema.createTable('transactions', table => {
        table.string('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.string('type').notNullable(); // deposit, withdrawal, loan_payment, contract_exercise, etc.
        table.string('reference_id').nullable(); // ID del contrato o préstamo relacionado
        table.decimal('amount', 20, 8).notNullable();
        table.string('asset').notNullable();
        table.string('status').defaultTo('pending'); // pending, confirmed, failed
        table.string('transaction_hash').nullable(); // Hash de la transacción en blockchain
        table.json('details').nullable(); // Detalles adicionales
        table.timestamps(true, true);

        // Índices
        table.index(['user_id']);
        table.index(['type']);
        table.index(['status']);
        table.index(['reference_id']);
        table.index(['transaction_hash']);
      });
      console.log('✅ Tabla "transactions" creada con éxito');
    } else {
      console.log('📝 Tabla "transactions" ya existe');
    }

    // Tabla de configuración del sistema
    if (!(await db.schema.hasTable('system_config'))) {
      await db.schema.createTable('system_config', table => {
        table.string('key').primary();
        table.text('value').notNullable();
        table.string('type').defaultTo('string'); // string, number, boolean, json
        table.text('description').nullable();
        table.timestamps(true, true);
      });

      // Insertar configuraciones por defecto
      const defaultConfigs = [
        {
          key: 'platform_version',
          value: '2.0.0',
          type: 'string',
          description: 'Versión actual de la plataforma BitForward'
        },
        {
          key: 'max_ltv_ratio',
          value: '0.75',
          type: 'number',
          description: 'Ratio máximo de Loan-to-Value permitido'
        },
        {
          key: 'default_interest_rate',
          value: '0.035',
          type: 'number',
          description: 'Tasa de interés por defecto (3.5% APR)'
        },
        {
          key: 'supported_assets',
          value: JSON.stringify(['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'DAI']),
          type: 'json',
          description: 'Lista de activos soportados por la plataforma'
        }
      ];

      for (const config of defaultConfigs) {
        await db('system_config').insert({
          ...config,
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      console.log('✅ Tabla "system_config" creada con configuraciones por defecto');
    } else {
      console.log('📝 Tabla "system_config" ya existe');
    }

    console.log('\n🎯 ¡Búnker de Datos Persistente construido exitosamente!');
    console.log('📊 Resumen de la infraestructura:');
    console.log('   • 5 tablas principales creadas');
    console.log('   • Índices optimizados para consultas rápidas');
    console.log('   • Relaciones y restricciones configuradas');
    console.log('   • Configuraciones por defecto inicializadas');
    console.log('\n🚀 BitForward está listo para almacenar datos de forma permanente');

  } catch (error) {
    console.error('\n❌ Error durante la construcción del búnker:', error.message);
    console.error('🔧 Detalles técnicos:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Ejecutar el setup si el script se ejecuta directamente
if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = { setupDatabase };
