/**
 * API Routes para Estadísticas BitForward
 * Proporciona métricas y analytics del sistema
 */

const express = require('express');
const database = require('../database/database');

const router = express.Router();

/**
 * GET /api/stats/dashboard
 * Obtiene estadísticas principales para el dashboard
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    // Estadísticas básicas de contratos
    const contractStats = await database.get(`
            SELECT 
                COUNT(*) as total_contracts,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_contracts,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_contracts,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_contracts,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_contracts,
                SUM(amount) as total_volume,
                AVG(amount) as average_amount
            FROM contracts
        `);

    // Estadísticas por blockchain
    const blockchainStats = await database.all(`
            SELECT 
                blockchain,
                COUNT(*) as contract_count,
                SUM(amount) as total_volume,
                AVG(amount) as average_amount
            FROM contracts
            GROUP BY blockchain
            ORDER BY contract_count DESC
        `);

    // Actividad reciente (últimos 30 días)
    const recentActivity = await database.all(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as contracts_created
            FROM contracts
            WHERE created_at >= datetime('now', '-30 days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

    // Contratos próximos a vencer (próximos 7 días)
    const upcomingExpirations = await database.all(`
            SELECT id, blockchain, amount, execution_date, status
            FROM contracts
            WHERE execution_date BETWEEN datetime('now') AND datetime('now', '+7 days')
            AND status IN ('pending', 'active')
            ORDER BY execution_date ASC
        `);

    // Top direcciones por volumen
    const topAddresses = await database.all(`
            SELECT 
                counterparty_address,
                COUNT(*) as contract_count,
                SUM(amount) as total_volume
            FROM contracts
            GROUP BY counterparty_address
            ORDER BY total_volume DESC
            LIMIT 10
        `);

    res.json({
      success: true,
      data: {
        overview: {
          totalContracts: contractStats.total_contracts || 0,
          pendingContracts: contractStats.pending_contracts || 0,
          activeContracts: contractStats.active_contracts || 0,
          completedContracts: contractStats.completed_contracts || 0,
          cancelledContracts: contractStats.cancelled_contracts || 0,
          totalVolume: parseFloat(contractStats.total_volume) || 0,
          averageAmount: parseFloat(contractStats.average_amount) || 0,
        },
        byBlockchain: blockchainStats.map(stat => ({
          blockchain: stat.blockchain,
          contractCount: stat.contract_count,
          totalVolume: parseFloat(stat.total_volume),
          averageAmount: parseFloat(stat.average_amount),
        })),
        recentActivity: recentActivity.map(activity => ({
          date: activity.date,
          contractsCreated: activity.contracts_created,
        })),
        upcomingExpirations: upcomingExpirations.map(contract => ({
          id: contract.id,
          blockchain: contract.blockchain,
          amount: parseFloat(contract.amount),
          executionDate: contract.execution_date,
          status: contract.status,
        })),
        topAddresses: topAddresses.map(addr => ({
          address: addr.counterparty_address,
          contractCount: addr.contract_count,
          totalVolume: parseFloat(addr.total_volume),
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stats/performance
 * Obtiene métricas de rendimiento del sistema
 */
router.get('/performance', async (req, res, next) => {
  try {
    const { timeframe = '24h' } = req.query;

    let timeCondition;
    switch (timeframe) {
      case '1h':
        timeCondition = "datetime('now', '-1 hour')";
        break;
      case '24h':
        timeCondition = "datetime('now', '-1 day')";
        break;
      case '7d':
        timeCondition = "datetime('now', '-7 days')";
        break;
      case '30d':
        timeCondition = "datetime('now', '-30 days')";
        break;
      default:
        timeCondition = "datetime('now', '-1 day')";
    }

    // Métricas de rendimiento
    const performanceMetrics = await database.get(`
            SELECT 
                COUNT(*) as total_requests,
                COUNT(CASE WHEN created_at >= ${timeCondition} THEN 1 END) as recent_requests,
                AVG(CASE WHEN status = 'completed' THEN 
                    (julianday(executed_at) - julianday(created_at)) * 24 * 60 
                END) as avg_completion_time_minutes
            FROM contracts
        `);

    // Tasa de éxito por blockchain
    const successRates = await database.all(`
            SELECT 
                blockchain,
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                ROUND(
                    (COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*)), 
                    2
                ) as success_rate
            FROM contracts
            WHERE created_at >= ${timeCondition}
            GROUP BY blockchain
        `);

    // Distribución de estados
    const statusDistribution = await database.all(`
            SELECT 
                status,
                COUNT(*) as count,
                ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contracts WHERE created_at >= ${timeCondition})), 2) as percentage
            FROM contracts
            WHERE created_at >= ${timeCondition}
            GROUP BY status
        `);

    res.json({
      success: true,
      data: {
        timeframe,
        metrics: {
          totalRequests: performanceMetrics.total_requests || 0,
          recentRequests: performanceMetrics.recent_requests || 0,
          averageCompletionTime: parseFloat(performanceMetrics.avg_completion_time_minutes) || 0,
        },
        successRates: successRates.map(rate => ({
          blockchain: rate.blockchain,
          total: rate.total,
          completed: rate.completed,
          successRate: parseFloat(rate.success_rate),
        })),
        statusDistribution: statusDistribution.map(dist => ({
          status: dist.status,
          count: dist.count,
          percentage: parseFloat(dist.percentage),
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stats/volume
 * Obtiene estadísticas de volumen transaccional
 */
router.get('/volume', async (req, res, next) => {
  try {
    const { blockchain, period = 'daily', limit = 30 } = req.query;

    let groupBy, dateFormat;
    switch (period) {
      case 'hourly':
        groupBy = "strftime('%Y-%m-%d %H', created_at)";
        dateFormat = 'hour';
        break;
      case 'daily':
        groupBy = 'DATE(created_at)';
        dateFormat = 'day';
        break;
      case 'weekly':
        groupBy = "strftime('%Y-W%W', created_at)";
        dateFormat = 'week';
        break;
      case 'monthly':
        groupBy = "strftime('%Y-%m', created_at)";
        dateFormat = 'month';
        break;
      default:
        groupBy = 'DATE(created_at)';
        dateFormat = 'day';
    }

    let whereClause = '';
    let params = [];

    if (blockchain) {
      whereClause = 'WHERE blockchain = ?';
      params.push(blockchain);
    }

    const volumeData = await database.all(
      `
            SELECT 
                ${groupBy} as period,
                COUNT(*) as transaction_count,
                SUM(amount) as total_volume,
                AVG(amount) as average_amount,
                MIN(amount) as min_amount,
                MAX(amount) as max_amount
            FROM contracts
            ${whereClause}
            GROUP BY ${groupBy}
            ORDER BY period DESC
            LIMIT ?
        `,
      [...params, parseInt(limit)]
    );

    // Totales generales
    const totals = await database.get(
      `
            SELECT 
                COUNT(*) as total_contracts,
                SUM(amount) as total_volume,
                AVG(amount) as average_amount
            FROM contracts
            ${whereClause}
        `,
      params
    );

    res.json({
      success: true,
      data: {
        period: dateFormat,
        blockchain: blockchain || 'all',
        totals: {
          totalContracts: totals.total_contracts || 0,
          totalVolume: parseFloat(totals.total_volume) || 0,
          averageAmount: parseFloat(totals.average_amount) || 0,
        },
        timeSeries: volumeData
          .map(data => ({
            period: data.period,
            transactionCount: data.transaction_count,
            totalVolume: parseFloat(data.total_volume),
            averageAmount: parseFloat(data.average_amount),
            minAmount: parseFloat(data.min_amount),
            maxAmount: parseFloat(data.max_amount),
          }))
          .reverse(), // Mostrar en orden cronológico
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stats/health
 * Obtiene el estado de salud del sistema
 */
router.get('/health', async (req, res, next) => {
  try {
    const dbConnected = database.isConnected();

    // Verificar operaciones básicas de DB
    let dbOperational = false;
    try {
      await database.get('SELECT 1 as test');
      dbOperational = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Obtener estadísticas del sistema
    const systemStats = await database.get(`
            SELECT 
                (SELECT COUNT(*) FROM contracts) as total_contracts,
                (SELECT COUNT(*) FROM contracts WHERE created_at >= datetime('now', '-1 hour')) as contracts_last_hour,
                (SELECT COUNT(*) FROM system_events WHERE processed = 0) as pending_events
        `);

    const health = {
      status: dbConnected && dbOperational ? 'healthy' : 'unhealthy',
      database: {
        connected: dbConnected,
        operational: dbOperational,
      },
      system: {
        totalContracts: systemStats.total_contracts || 0,
        contractsLastHour: systemStats.contracts_last_hour || 0,
        pendingEvents: systemStats.pending_events || 0,
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

module.exports = router;
