const express = require('express');
const priceService = require('../services/PriceService');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/prices
 * Query: assets=bitcoin,ethereum&vs=usd
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const assets = (req.query.assets || 'bitcoin,ethereum,solana').split(',');
    const vs = (req.query.vs || require('../config/config').BASE_CURRENCY || 'usd').toLowerCase();

    const result = await priceService.getPrices(assets, vs);
    if (!result.success) {
      return res.status(502).json({ success: false, msg: result.error || 'Price feed error' });
    }

    res.json({
      success: true,
      source: result.source,
      prices: result.data,
      warning: result.warning,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ success: false, msg: 'Error interno al obtener precios' });
  }
});

module.exports = router;
