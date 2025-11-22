/**
 * Contracts & Lending Integration Tests
 * Valida creación y consulta de contratos y préstamos con auth JWT.
 */

const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const BitForwardServer = require('../server/server');
const { setupDatabase } = require('../server/database/setup');
const { db, closeConnection } = require('../server/database/config');
const authConfig = require('../server/config/auth');

describe('🔒 Contracts & Lending API', () => {
  let serverInstance;
  let api;
  let accessToken;
  let testDbFile;
  let userId;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    testDbFile = path.join(
      __dirname,
      '..',
      'server',
      'database',
      `test-contracts-${Date.now()}.sqlite3`
    );
    process.env.DATABASE_FILE = testDbFile;
    process.env.PORT = '0';
    process.env.ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || 'http://localhost:8545';
    process.env.PRIVATE_KEY = process.env.PRIVATE_KEY || '0x' + '1'.repeat(64);

    await setupDatabase();

    const passwordHash = await bcrypt.hash('SuperSecret123!', 12);
    [userId] = await db('users').insert({
      email: 'contracts@test.local',
      username: 'contracts_user',
      password_hash: passwordHash,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const tokens = authConfig.generateTokenPair({
      id: userId,
      username: 'contracts_user',
      email: 'contracts@test.local',
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

  test('health responde OK', async () => {
    const res = await api.get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  test('crea y lista contratos', async () => {
    const payload = {
      asset: 'BTC',
      amount: 0.2,
      strikePrice: 70000,
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const createRes = await api
      .post('/api/contracts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);
    expect(createRes.status).toBe(201);
    expect(createRes.body?.contract?.id).toBeDefined();

    const listRes = await api.get('/api/contracts').set('Authorization', `Bearer ${accessToken}`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.contracts)).toBe(true);
    expect(listRes.body.contracts.length).toBeGreaterThanOrEqual(1);
  });

  test('crea y lista préstamos', async () => {
    const loanRes = await api
      .post('/api/lending/request')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        collateralType: 'BTC',
        collateralAmount: 0.5,
        loanAmount: 5000,
        termDays: 90,
        ltvRatio: 60,
      });
    expect(loanRes.status).toBe(201);
    expect(loanRes.body?.loan?.id).toBeDefined();

    const listRes = await api
      .get('/api/lending/loans')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.loans)).toBe(true);
    expect(listRes.body.loans.length).toBeGreaterThanOrEqual(1);
  });
});
