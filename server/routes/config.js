const express = require('express');
const config = require('../config/config');

const router = express.Router();

/**
 * GET /api/config/networks
 * Devuelve redes soportadas y red por defecto (sin exponer secrets)
 */
router.get('/networks', (req, res) => {
  const networks = Object.entries(config.CHAINS || {}).map(([key, value]) => ({
    key,
    name: value.name,
    chainId: value.chainId,
    rpc: value.rpc,
    explorer: value.explorer,
    nativeSymbol: value.nativeSymbol,
  }));

  res.json({
    success: true,
    default: config.DEFAULT_CHAIN,
    networks,
  });
});

module.exports = router;
