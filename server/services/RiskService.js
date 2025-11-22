const { db } = require('../database/database');
const config = require('../config/config');
const { v4: uuidv4 } = require('uuid');

class RiskService {
  constructor() {
    this.maxLtv = config.RISK.MAX_LTV;
    this.minHealth = config.RISK.MIN_HEALTH_FACTOR;
    this.maxForwardNotional = config.RISK.MAX_FORWARD_NOTIONAL;
  }

  async scan() {
    const alerts = [];
    const now = new Date().toISOString();

    // Revisar préstamos
    const loans = await db('loans').select('*');
    for (const loan of loans) {
      const ltv = loan.ltv_ratio ? parseFloat(loan.ltv_ratio) : null;
      const hf = loan.health_factor ? parseFloat(loan.health_factor) : null;
      if ((ltv && ltv > this.maxLtv) || (hf && hf < this.minHealth)) {
        alerts.push({
          id: uuidv4(),
          event_type: 'risk_alert',
          entity_type: 'loan',
          entity_id: loan.id,
          data: JSON.stringify({
            ltv,
            healthFactor: hf,
            status: loan.status,
            threshold: { maxLtv: this.maxLtv, minHealth: this.minHealth },
          }),
          timestamp: now,
          processed: 0,
        });
      }
    }

    // Revisar posiciones de vault
    const positions = await db('vault_positions').select('*');
    for (const pos of positions) {
      const hf = pos.health_factor ? parseFloat(pos.health_factor) : null;
      if (hf && hf < this.minHealth) {
        alerts.push({
          id: uuidv4(),
          event_type: 'risk_alert',
          entity_type: 'vault_position',
          entity_id: pos.id,
          data: JSON.stringify({
            asset: pos.asset,
            healthFactor: hf,
            threshold: { minHealth: this.minHealth },
          }),
          timestamp: now,
          processed: 0,
        });
      }
    }

    // Almacenar alertas
    if (alerts.length) {
      await db('system_events').insert(alerts);
    }

    return alerts.length;
  }

  async getAlerts(limit = 50) {
    const rows = await db('system_events')
      .where('event_type', 'risk_alert')
      .orderBy('timestamp', 'desc')
      .limit(limit);
    return rows.map(r => ({
      id: r.id,
      type: r.event_type,
      entity: { type: r.entity_type, id: r.entity_id },
      data: r.data ? JSON.parse(r.data) : {},
      timestamp: r.timestamp,
      processed: !!r.processed,
    }));
  }
}

module.exports = new RiskService();
