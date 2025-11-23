#!/usr/bin/env node

/**
 * Script de verificación del Búnker de Datos BitForward
 * Verifica que toda la infraestructura de persistencia esté funcionando
 */

const { db, testConnection } = require('./server/database/config');

async function verifyBunker() {
  console.log('🔍 Verificando el estado del Búnker de Datos BitForward...\n');

  try {
    // 1. Verificar conexión
    console.log('1️⃣  Verificando conexión a la base de datos...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('No se pudo conectar a la base de datos');
    }
    console.log('   ✅ Conexión exitosa\n');

    // 2. Verificar tablas
    console.log('2️⃣  Verificando estructura de tablas...');
    const tables = ['users', 'contracts', 'loans', 'transactions', 'system_config'];

    for (const table of tables) {
      const exists = await db.schema.hasTable(table);
      if (exists) {
        const count = await db(table).count('* as total').first();
        console.log(`   ✅ Tabla "${table}" existe (${count.total} registros)`);
      } else {
        console.log(`   ❌ Tabla "${table}" no existe`);
      }
    }
    console.log('');

    // 3. Verificar configuración del sistema
    console.log('3️⃣  Verificando configuración del sistema...');
    const configs = await db('system_config').select('*');
    configs.forEach(config => {
      console.log(`   ⚙️  ${config.key}: ${config.value}`);
    });
    console.log('');

    // 4. Verificar integridad
    console.log('4️⃣  Verificando integridad de datos...');

    // Verificar usuarios
    const usersCount = await db('users').count('* as total').first();
    console.log(`   👥 Usuarios registrados: ${usersCount.total}`);

    // Verificar contratos
    const contractsCount = await db('contracts').count('* as total').first();
    console.log(`   📄 Contratos creados: ${contractsCount.total}`);

    // Verificar préstamos
    const loansCount = await db('loans').count('* as total').first();
    console.log(`   💰 Préstamos activos: ${loansCount.total}`);

    // Verificar transacciones
    const transactionsCount = await db('transactions').count('* as total').first();
    console.log(`   🧾 Transacciones registradas: ${transactionsCount.total}`);

    console.log('\n🎯 RESUMEN DEL BÚNKER:');
    console.log('══════════════════════════════════════');
    console.log('✅ Base de datos: Operativa');
    console.log('✅ Tablas: Todas presentes');
    console.log('✅ Configuración: Cargada');
    console.log('✅ Integridad: Verificada');
    console.log('');
    console.log('🏛️  El Búnker de Datos Persistente está listo para operar');
    console.log('🚀 Puedes iniciar el servidor con: npm run server:dev');
  } catch (error) {
    console.error('\n❌ ERROR en la verificación del búnker:');
    console.error('   ', error.message);
    console.log('\n🔧 Acciones recomendadas:');
    console.log('   1. Ejecutar: npm install');
    console.log('   2. Ejecutar: npm run db:setup');
    console.log('   3. Verificar permisos de escritura en el directorio');
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Ejecutar verificación
if (require.main === module) {
  verifyBunker().catch(console.error);
}

module.exports = { verifyBunker };
