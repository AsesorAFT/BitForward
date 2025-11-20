/**
 * DeFi API Integration Smoke Tests
 * Valida posiciones de vault, hedges (modo sin blockchain) y liquidaciones persistidas
 */

const path = require('path');
const fs = require('fs');
const request = require('supertest');
const BitForwardServer = require('../server/server');
const authConfig = require('../server/config/auth');
const { setupDatabase } = require('../server/database/setup');
const { db, closeConnection } = require('../server/database/config');

describe('🔗 DeFi API Integration', () => {
  let serverInstance;
  let api;
  let accessToken;
  let testDbFile;
  let userId;

  beforeAll(async () => {
    // Aislar BD de pruebas
    testDbFile = path.join(
      __dirname,
      '..',
      'server',
      'database',
      `test-defi-${Date.now()}.sqlite3`
    );
    process.env.DATABASE_FILE = testDbFile;
    process.env.PORT = '0'; // puerto aleatorio
    process.env.ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || 'http://localhost:8545';
    process.env.PRIVATE_KEY = process.env.PRIVATE_KEY || '0x' + '1'.repeat(64);

    await setupDatabase();

    // Crear usuario y token
    [userId] = await db('users').insert({
      email: 'defi@test.local',
      username: 'defi_tester',
      password_hash: 'test-hash',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const tokens = authConfig.generateTokenPair({
      id: userId,
      username: 'defi_tester',
      email: 'defi@test.local',
      role: 'user',
    });
    accessToken = tokens.accessToken;

    serverInstance = new BitForwardServer();
    await serverInstance.start();
    const port = serverInstance.server.address().port;
    api = request(`http://localhost:${port}`);
  }, 20000);

  afterAll(async () => {
    if (serverInstance?.server) {
      await new Promise(resolve => serverInstance.server.close(resolve));
    }
    await closeConnection();
    if (testDbFile && fs.existsSync(testDbFile)) {
      fs.unlinkSync(testDbFile);
    }
  });

  test('requiere autenticación para posiciones', async () => {
    const res = await api.get('/api/defi/positions');
    expect(res.status).toBe(401);
  });

  test('crea posición de vault y la lista', async () => {
    const createRes = await api
      .post('/api/defi/positions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ asset: 'BTC', amount: 0.1 });

    expect(createRes.status).toBe(201);
    expect(createRes.body?.position?.asset).toBe('BTC');

    const listRes = await api
      .get('/api/defi/positions')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.positions)).toBe(true);
    expect(listRes.body.positions.length).toBeGreaterThanOrEqual(1);
  });

  test('registra liquidación de préstamo y refleja estado', async () => {
    const loanId = `loan_${Date.now()}`;
    await db('loans').insert({
      id: loanId,
      user_id: userId,
      principal_amount: 100,
      principal_asset: 'USDT',
      collateral_amount: 0.5,
      collateral_asset: 'BTC',
      interest_rate: 5,
      ltv_ratio: 50,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const liquidateRes = await api
      .post('/api/defi/liquidations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ loanId, recoveredAmount: 10, recoveredAsset: 'USDT', reason: 'test-liquidation' });

    expect(liquidateRes.status).toBe(201);
    expect(liquidateRes.body?.liquidation?.loanId).toBe(loanId);

    const updatedLoan = await db('loans').where({ id: loanId }).first();
    expect(updatedLoan.status).toBe('liquidated');

    const listRes = await api
      .get('/api/defi/liquidations')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.liquidations)).toBe(true);
    expect(listRes.body.liquidations.length).toBeGreaterThanOrEqual(1);
  });
});
