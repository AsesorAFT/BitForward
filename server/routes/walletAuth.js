/**
 * BitForward Wallet Authentication Routes
 * Rutas para autenticación con wallets (SIWE - Sign-In with Ethereum)
 *
 * @author BitForward Team
 * @date 2025-10-19
 */

const express = require('express');
const router = express.Router();
const authService = require('../services/AuthService');
const { requireWalletAuth } = require('../middleware/walletAuth');
const { authRateLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

/**
 * POST /api/auth/wallet/nonce
 * Generar nonce para firma
 *
 * Body: { address: string, chainId?: number }
 * Response: { nonce, message, expiresAt }
 */
router.post('/nonce', authRateLimiter, async (req, res) => {
  try {
    const { address, chainId } = req.body;

    // Validar address
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    }

    // Generar nonce
    const nonceData = authService.generateNonce(address);

    res.json({
      success: true,
      data: {
        nonce: nonceData.nonce,
        message: nonceData.message,
        expiresAt: nonceData.expiresAt,
        chainId: chainId || 1
      }
    });

  } catch (error) {
    logger.error('Error generating nonce:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate nonce'
    });
  }
});

/**
 * POST /api/auth/wallet/verify
 * Verificar firma y generar tokens
 *
 * Body: { address, signature, nonce, chainId? }
 * Response: { accessToken, refreshToken, expiresIn }
 */
router.post('/verify', authRateLimiter, async (req, res) => {
  try {
    const { address, signature, nonce, chainId = 1 } = req.body;

    // Validar campos requeridos
    if (!address || !signature || !nonce) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: address, signature, nonce'
      });
    }

    // Verificar firma
    await authService.verifySignature(address, signature, nonce);

    // Generar tokens
    const accessToken = authService.generateAccessToken(address, chainId);
    const refreshToken = authService.generateRefreshToken(address, chainId);

    logger.info(`Wallet authenticated successfully: ${address}`);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: '15m',
        address: address.toLowerCase(),
        chainId
      }
    });

  } catch (error) {
    logger.error('Error verifying signature:', error);

    res.status(401).json({
      success: false,
      error: error.message || 'Signature verification failed',
      code: 'VERIFICATION_FAILED'
    });
  }
});

/**
 * POST /api/auth/wallet/refresh
 * Refrescar access token
 *
 * Body: { refreshToken }
 * Response: { accessToken, expiresIn }
 */
router.post('/refresh', authRateLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    // Refrescar token
    const result = await authService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error refreshing token:', error);

    res.status(401).json({
      success: false,
      error: error.message || 'Failed to refresh token',
      code: 'REFRESH_FAILED'
    });
  }
});

/**
 * POST /api/auth/wallet/logout
 * Cerrar sesión (revocar tokens)
 *
 * Headers: Authorization: Bearer <accessToken>
 * Body: { refreshToken? }
 */
router.post('/logout', requireWalletAuth, async (req, res) => {
  try {
    const { address } = req.wallet;
    const { refreshToken, logoutAll = false } = req.body;

    if (logoutAll) {
      // Revocar todos los refresh tokens
      authService.revokeAllRefreshTokens(address);

      logger.info(`All refresh tokens revoked for: ${address}`);

      return res.json({
        success: true,
        message: 'Logged out from all devices'
      });
    }

    if (refreshToken) {
      // Revocar refresh token específico
      try {
        const decoded = authService.verifyRefreshToken(refreshToken);
        authService.revokeRefreshToken(address, decoded.tokenId);

        logger.info(`Refresh token revoked for: ${address}`);
      } catch (error) {
        // Token inválido o expirado, continuar de todos modos
        logger.warn(`Failed to revoke refresh token: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Error during logout:', error);

    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * GET /api/auth/wallet/me
 * Obtener información del usuario autenticado
 *
 * Headers: Authorization: Bearer <accessToken>
 */
router.get('/me', requireWalletAuth, async (req, res) => {
  try {
    const { address, chainId } = req.wallet;

    res.json({
      success: true,
      data: {
        address,
        chainId,
        authenticated: true
      }
    });

  } catch (error) {
    logger.error('Error getting user info:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
});

/**
 * GET /api/auth/wallet/stats
 * Obtener estadísticas del sistema de auth (admin/debug)
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = authService.getStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error getting auth stats:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to get stats'
    });
  }
});

module.exports = router;
