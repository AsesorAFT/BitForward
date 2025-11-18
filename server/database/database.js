/**
 * Sistema de Base de Datos BitForward
 * Maneja la persistencia de contratos, usuarios y estadísticas
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const config = require('../config/config');

class BitForwardDatabase {
  constructor() {
    this.db = null;
    this.dbPath = config.DATABASE_PATH;
    this.connected = false;
  }

  /**
   * Inicializa la base de datos y crea las tablas necesarias
   */
  async initialize() {
    try {
      // Crear directorio de datos si no existe
      const dataDir = path.dirname(this.dbPath);
      await fs.mkdir(dataDir, { recursive: true });

      // Conectar a la base de datos
      await this.connect();

      // Crear tablas
      await this.createTables();

      // Insertar datos de ejemplo en desarrollo
      if (config.NODE_ENV === 'development') {
        await this.seedDevelopmentData();
      }

      this.connected = true;
      console.log('✅ Base de datos inicializada en:', this.dbPath);
    } catch (error) {
      console.error('❌ Error inicializando base de datos:', error);
      throw error;
    }
  }

  /**
   * Conecta a la base de datos SQLite
   */
  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, err => {
        if (err) {
          reject(err);
        } else {
          // Habilitar foreign keys
          this.db.run('PRAGMA foreign_keys = ON');
          resolve();
        }
      });
    });
  }

  /**
   * Crea las tablas necesarias
   */
  async createTables() {
    const tables = [
      // Tabla de usuarios
      `CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                wallet_address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            )`,

      // Tabla de contratos
      `CREATE TABLE IF NOT EXISTS contracts (
                id TEXT PRIMARY KEY,
                creator_id TEXT,
                blockchain TEXT NOT NULL,
                amount DECIMAL(18,8) NOT NULL,
                strike_price DECIMAL(18,2),
                counterparty_address TEXT NOT NULL,
                execution_date DATETIME NOT NULL,
                status TEXT DEFAULT 'pending',
                contract_type TEXT DEFAULT 'forward',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                executed_at DATETIME,
                transaction_hash TEXT,
                metadata TEXT,
                FOREIGN KEY (creator_id) REFERENCES users(id)
            )`,

      // Tabla de participaciones en contratos
      `CREATE TABLE IF NOT EXISTS contract_participants (
                id TEXT PRIMARY KEY,
                contract_id TEXT NOT NULL,
                user_id TEXT,
                participant_address TEXT NOT NULL,
                role TEXT NOT NULL, -- 'creator' o 'counterparty'
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                signature TEXT,
                FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,

      // Tabla de transacciones
      `CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                contract_id TEXT NOT NULL,
                transaction_hash TEXT UNIQUE NOT NULL,
                blockchain TEXT NOT NULL,
                transaction_type TEXT NOT NULL, -- 'creation', 'execution', 'cancellation'
                amount DECIMAL(18,8),
                gas_used INTEGER,
                gas_price DECIMAL(18,8),
                block_number INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
                FOREIGN KEY (contract_id) REFERENCES contracts(id)
            )`,

      // Tabla de eventos del sistema
      `CREATE TABLE IF NOT EXISTS system_events (
                id TEXT PRIMARY KEY,
                event_type TEXT NOT NULL,
                entity_type TEXT NOT NULL, -- 'contract', 'user', 'transaction'
                entity_id TEXT NOT NULL,
                data TEXT, -- JSON con datos del evento
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                processed BOOLEAN DEFAULT 0
            )`,
    ];

    for (const tableSQL of tables) {
      await this.run(tableSQL);
    }

    // Crear índices para mejor performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status)',
      'CREATE INDEX IF NOT EXISTS idx_contracts_blockchain ON contracts(blockchain)',
      'CREATE INDEX IF NOT EXISTS idx_contracts_execution_date ON contracts(execution_date)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash)',
      'CREATE INDEX IF NOT EXISTS idx_system_events_type ON system_events(event_type, timestamp)',
    ];

    for (const indexSQL of indexes) {
      await this.run(indexSQL);
    }
  }

  /**
   * Inserta datos de ejemplo para desarrollo
   */
  async seedDevelopmentData() {
    try {
      // Verificar si ya hay datos
      const contractCount = await this.get('SELECT COUNT(*) as count FROM contracts');
      if (contractCount.count > 0) {
        return; // Ya hay datos, no insertar de nuevo
      }

      const { v4: uuidv4 } = require('uuid');

      // Datos de ejemplo
      const sampleContracts = [
        {
          id: uuidv4(),
          blockchain: 'bitcoin',
          amount: 0.05,
          strike_price: 75000,
          counterparty_address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          execution_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
        },
        {
          id: uuidv4(),
          blockchain: 'ethereum',
          amount: 2.5,
          strike_price: 3500,
          counterparty_address: '0x742d35Cc6634C0532925a3b8D4e6b8f8Ca3EB3',
          execution_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
        },
        {
          id: uuidv4(),
          blockchain: 'solana',
          amount: 10.0,
          strike_price: 200,
          counterparty_address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          execution_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
        },
      ];

      for (const contract of sampleContracts) {
        await this.run(
          `
                    INSERT INTO contracts (id, blockchain, amount, strike_price, counterparty_address, execution_date, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
          [
            contract.id,
            contract.blockchain,
            contract.amount,
            contract.strike_price,
            contract.counterparty_address,
            contract.execution_date,
            contract.status,
          ]
        );
      }

      console.log('✅ Datos de ejemplo insertados');
    } catch (error) {
      console.error('❌ Error insertando datos de ejemplo:', error);
    }
  }

  /**
   * Ejecuta una query SQL
   */
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * Obtiene una fila
   */
  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Obtiene múltiples filas
   */
  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Inicia una transacción
   */
  async beginTransaction() {
    await this.run('BEGIN TRANSACTION');
  }

  /**
   * Confirma una transacción
   */
  async commit() {
    await this.run('COMMIT');
  }

  /**
   * Revierte una transacción
   */
  async rollback() {
    await this.run('ROLLBACK');
  }

  /**
   * Verifica si la base de datos está conectada
   */
  isConnected() {
    return this.connected && this.db !== null;
  }

  /**
   * Cierra la conexión a la base de datos
   */
  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close(err => {
          if (err) {
            reject(err);
          } else {
            this.connected = false;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Prueba la conexión a la base de datos
   */
  async testConnection() {
    try {
      await this.get('SELECT 1 as test');
      return true;
    } catch (error) {
      console.error('Error testing database connection:', error);
      return false;
    }
  }

  /**
   * Inicializa la base de datos y crea las tablas
   */
  async init() {
    try {
      if (!this.connected) {
        await this.initialize();
      }
      console.log('✅ Base de datos inicializada correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando base de datos:', error);
      return false;
    }
  }
}

// Instancia singleton
const database = new BitForwardDatabase();

module.exports = database;
