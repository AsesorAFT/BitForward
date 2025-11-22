const express = require('express');
const riskService = require('../services/RiskService');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/risk/alerts
 * Lista alertas de riesgo recientes
 */
router.get('/alerts', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const alerts = await riskService.getAlerts(limit);
    res.json({ success: true, alerts, count: alerts.length });
  } catch (error) {
    console.error('Error fetching risk alerts:', error);
    res.status(500).json({ success: false, msg: 'Error al obtener alertas de riesgo.' });
  }
});

/**
 * POST /api/risk/scan
 * Ejecuta un escaneo inmediato de riesgo (admin only idealmente, aquí con auth básica)
 */
router.post('/scan', authMiddleware, async (req, res) => {
  try {
    const count = await riskService.scan();
    res.json({ success: true, alertsCreated: count });
  } catch (error) {
    console.error('Error running risk scan:', error);
    res.status(500).json({ success: false, msg: 'Error al ejecutar escaneo de riesgo.' });
  }
});

module.exports = router;
