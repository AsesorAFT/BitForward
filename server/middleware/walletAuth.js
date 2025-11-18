/**
 * BitForward Wallet Authentication Middleware
 * Middleware para autenticación con wallets (Web3)
 *
 * @author BitForward Team
 * @date 2025-10-19
 */

const authService = require('../services/AuthService');
const logger = require('../utils/logger');

/**
 * Middleware para verificar access token de wallet
 */
const requireWalletAuth = (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided',
        code: 'NO_TOKEN',
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    // Verificar token
    const decoded = authService.verifyAccessToken(token);

    // Agregar datos del usuario al request
    req.wallet = {
      address: decoded.address,
      chainId: decoded.chainId,
    };

    logger.debug(`Authenticated wallet request from: ${decoded.address}`);

    next();
  } catch (error) {
    logger.warn(`Wallet authentication failed: ${error.message}`);

    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'TOKEN_INVALID',
    });
  }
};

/**
 * Middleware opcional - intenta autenticar pero no requiere
 */
const optionalWalletAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyAccessToken(token);

      req.wallet = {
        address: decoded.address,
        chainId: decoded.chainId,
      };

      logger.debug(`Optional wallet auth successful: ${decoded.address}`);
    }
  } catch (error) {
    // Ignorar errores en auth opcional
    logger.debug(`Optional wallet auth failed: ${error.message}`);
  }

  next();
};

/**
 * Middleware para verificar que la dirección coincide
 */
const requireOwnWallet = (req, res, next) => {
  const paramAddress = req.params.address || req.body.address || req.query.address;

  if (!paramAddress) {
    return res.status(400).json({
      success: false,
      error: 'Wallet address parameter required',
      code: 'ADDRESS_REQUIRED',
    });
  }

  if (paramAddress.toLowerCase() !== req.wallet.address.toLowerCase()) {
    logger.warn(`Wallet address mismatch: ${req.wallet.address} tried to access ${paramAddress}`);

    return res.status(403).json({
      success: false,
      error: 'You can only access your own wallet data',
      code: 'FORBIDDEN',
    });
  }

  next();
};

/**
 * Middleware para verificar chain ID
 */
const requireChainId = allowedChainIds => {
  return (req, res, next) => {
    const chainId = req.wallet?.chainId || req.body.chainId || req.query.chainId;

    if (!chainId) {
      return res.status(400).json({
        success: false,
        error: 'Chain ID required',
        code: 'CHAIN_ID_REQUIRED',
      });
    }

    if (!allowedChainIds.includes(parseInt(chainId))) {
      return res.status(400).json({
        success: false,
        error: 'Chain not supported',
        code: 'CHAIN_NOT_SUPPORTED',
        allowedChains: allowedChainIds,
      });
    }

    next();
  };
};

module.exports = {
  requireWalletAuth,
  optionalWalletAuth,
  requireOwnWallet,
  requireChainId,
};
