/**
 * Tests Unitarios para BitForward v2.0
 * Validación de funcionalidades críticas
 */

const request = require('supertest');
const { expect } = require('chai');
const BitForwardServer = require('../server/server');

describe('BitForward API Tests', () => {
  let app;
  let server;

  before(async () => {
    // Configurar entorno de test
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_PATH = ':memory:'; // Base de datos en memoria para tests

    const bitForwardServer = new BitForwardServer();
    app = bitForwardServer.app;
    await bitForwardServer.start();
    server = bitForwardServer.server;
  });

  after(async () => {
    if (server) {
      server.close();
    }
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect(200);

      expect(res.body).to.have.property('status', 'OK');
      expect(res.body).to.have.property('version', '2.0.0');
      expect(res.body).to.have.property('service', 'BitForward API');
    });
  });

  describe('Authentication', () => {
    const testUser = {
      username: 'testuser',
      email: 'test@bitforward.com',
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!'
    };

    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body).to.have.property('success', true);
      expect(res.body.data.user).to.have.property('username', testUser.username);
      expect(res.body.data.user).to.not.have.property('password');
    });

    it('should not register user with weak password', async () => {
      const weakPasswordUser = {
        ...testUser,
        username: 'testuser2',
        email: 'test2@bitforward.com',
        password: '123',
        confirmPassword: '123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordUser)
        .expect(400);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('code', 'VALIDATION_ERROR');
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('tokens');
      expect(res.body.data.tokens).to.have.property('accessToken');
      expect(res.body.data.tokens).to.have.property('refreshToken');
    });

    it('should not login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(res.body).to.have.property('success', false);
    });
  });

  describe('Contract Validation', () => {
    let authToken;

    before(async () => {
      // Obtener token de autenticación
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'TestPassword123!'
        });

      authToken = loginRes.body.data.tokens.accessToken;
    });

    it('should validate Bitcoin address correctly', async () => {
      const validContract = {
        blockchain: 'bitcoin',
        amount: 0.1,
        strikePrice: 50000,
        counterpartyAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        executionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validContract)
        .expect(201);

      expect(res.body).to.have.property('success', true);
    });

    it('should reject invalid Bitcoin address', async () => {
      const invalidContract = {
        blockchain: 'bitcoin',
        amount: 0.1,
        strikePrice: 50000,
        counterpartyAddress: 'invalid_address',
        executionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidContract)
        .expect(400);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('code', 'VALIDATION_ERROR');
    });

    it('should reject past execution date', async () => {
      const pastDateContract = {
        blockchain: 'bitcoin',
        amount: 0.1,
        strikePrice: 50000,
        counterpartyAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        executionDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Ayer
      };

      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(pastDateContract)
        .expect(400);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('code', 'VALIDATION_ERROR');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const res = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('code', 'ROUTE_NOT_FOUND');
    });

    it('should handle malformed JSON', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('code', 'INVALID_JSON');
    });
  });
});
