const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');
const { db } = require('../database/database');

const router = express.Router();

const POSITION_STATUS = {
  OPEN: 'open',
  CLOSING: 'closing',
  CLOSED: 'closed',
};

const HEDGE_STATUS = {
  PENDING: 'pending',
  EXECUTED: 'executed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

const LOAN_STATUSES = {
  LIQUIDATED: 'liquidated',
};

const DEFAULT_COLLATERAL_THRESHOLD = 90; // percent

function getBlockchainService(req) {
  return req.app?.locals?.blockchainService || null;
}

/**
 * GET /api/defi/positions
 * Lista posiciones de vault del usuario
 */
router.get('/positions', authMiddleware, async (req, res) => {
  try {
    const positions = await db('vault_positions')
      .where('user_id', req.user.id)
      .orderBy('created_at', 'desc');

    res.json({
      success: true,
      positions: positions.map(formatPosition),
    });
  } catch (error) {
    console.error('Error obteniendo posiciones:', error);
    res.status(500).json({ success: false, msg: 'Error al obtener posiciones.' });
  }
});

/**
 * POST /api/defi/positions
 * Crea una nueva posición en el vault (registro local + opcional depósito on-chain)
 */
router.post('/positions', authMiddleware, async (req, res) => {
  try {
    const { asset, amount, metadata = {} } = req.body || {};
    if (!asset || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, msg: 'Asset y amount son requeridos.' });
    }

    const positionId = uuidv4();
    await db('vault_positions').insert({
      id: positionId,
      user_id: req.user.id,
      asset: asset.toUpperCase(),
      amount: parseFloat(amount),
      value_usd: 0,
      health_factor: 1,
      status: POSITION_STATUS.OPEN,
      metadata: JSON.stringify(metadata),
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Intentar obtener información en vivo desde blockchain si el servicio está disponible
    const blockchainService = getBlockchainService(req);
    if (blockchainService && blockchainService.contracts?.vault) {
      const balanceResult = await blockchainService.getVaultBalance(asset);
      if (balanceResult?.success) {
        await db('vault_positions')
          .where({ id: positionId })
          .update({
            value_usd: parseFloat(balanceResult.balance || 0),
            updated_at: new Date(),
          });
      }
    }

    const created = await db('vault_positions').where({ id: positionId }).first();
    res.status(201).json({ success: true, position: formatPosition(created) });
  } catch (error) {
    console.error('Error creando posición:', error);
    res.status(500).json({ success: false, msg: 'Error al crear la posición.' });
  }
});

/**
 * GET /api/defi/hedges
 * Lista hedges del usuario
 */
router.get('/hedges', authMiddleware, async (req, res) => {
  try {
    const hedges = await db('hedges').where('user_id', req.user.id).orderBy('created_at', 'desc');

    res.json({
      success: true,
      hedges: hedges.map(formatHedge),
    });
  } catch (error) {
    console.error('Error obteniendo hedges:', error);
    res.status(500).json({ success: false, msg: 'Error al obtener hedges.' });
  }
});

/**
 * POST /api/defi/hedges
 * Ejecuta hedge on-chain (si hay servicio) y persiste el registro
 */
router.post('/hedges', authMiddleware, async (req, res) => {
  try {
    const { assetIn, assetOut, amountIn, minAmountOut } = req.body || {};
    if (!assetIn || !assetOut || !amountIn || !minAmountOut) {
      return res.status(400).json({
        success: false,
        msg: 'assetIn, assetOut, amountIn y minAmountOut son requeridos.',
      });
    }

    const hedgeId = uuidv4();
    let hedgeStatus = HEDGE_STATUS.PENDING;
    let txHash = null;
    let amountOut = null;
    let errorMessage = null;

    const blockchainService = getBlockchainService(req);
    if (blockchainService) {
      try {
        const result = await blockchainService.executeHedge(
          assetIn,
          assetOut,
          amountIn,
          minAmountOut
        );
        if (result?.success) {
          hedgeStatus = HEDGE_STATUS.EXECUTED;
          txHash = result.transactionHash || null;
        } else {
          hedgeStatus = HEDGE_STATUS.FAILED;
          errorMessage = result?.error || 'Hedge execution failed';
        }
        amountOut = result?.amountOut || null;
      } catch (error) {
        hedgeStatus = HEDGE_STATUS.FAILED;
        errorMessage = error.message;
      }
    }

    await db('hedges').insert({
      id: hedgeId,
      user_id: req.user.id,
      asset_in: assetIn.toUpperCase(),
      asset_out: assetOut.toUpperCase(),
      amount_in: parseFloat(amountIn),
      amount_out: amountOut,
      tx_hash: txHash,
      status: hedgeStatus,
      details: JSON.stringify({
        minAmountOut,
        error: errorMessage,
      }),
      created_at: new Date(),
      updated_at: new Date(),
    });

    const stored = await db('hedges').where({ id: hedgeId }).first();
    res.status(201).json({ success: true, hedge: formatHedge(stored) });
  } catch (error) {
    console.error('Error ejecutando hedge:', error);
    res.status(500).json({ success: false, msg: 'Error al ejecutar hedge.' });
  }
});

/**
 * POST /api/defi/liquidations
 * Registrar liquidación manual (loan o posición)
 */
router.post('/liquidations', authMiddleware, async (req, res) => {
  try {
    const { loanId, positionId, reason, recoveredAmount = 0, recoveredAsset } = req.body || {};
    if (!loanId && !positionId) {
      return res.status(400).json({ success: false, msg: 'loanId o positionId requerido.' });
    }

    if (loanId) {
      const loan = await db('loans').where({ id: loanId, user_id: req.user.id }).first();
      if (!loan) {
        return res.status(404).json({ success: false, msg: 'Préstamo no encontrado.' });
      }
      await db('loans')
        .where({ id: loanId })
        .update({
          status: LOAN_STATUSES.LIQUIDATED,
          liquidated_at: new Date(),
          liquidation_reason: reason || null,
          updated_at: new Date(),
        });
    }

    if (positionId) {
      const position = await db('vault_positions')
        .where({ id: positionId, user_id: req.user.id })
        .first();
      if (!position) {
        return res.status(404).json({ success: false, msg: 'Posición no encontrada.' });
      }
      await db('vault_positions').where({ id: positionId }).update({
        status: POSITION_STATUS.CLOSED,
        updated_at: new Date(),
      });
    }

    const liquidationId = uuidv4();
    await db('liquidations').insert({
      id: liquidationId,
      loan_id: loanId || null,
      user_id: req.user.id,
      recovered_amount: recoveredAmount ? parseFloat(recoveredAmount) : 0,
      recovered_asset: recoveredAsset || null,
      reason: reason || null,
      executed_at: new Date(),
      details: JSON.stringify({ positionId }),
    });

    res.status(201).json({
      success: true,
      liquidation: {
        id: liquidationId,
        loanId,
        positionId,
        recoveredAmount: recoveredAmount ? parseFloat(recoveredAmount) : 0,
        recoveredAsset: recoveredAsset || null,
        reason: reason || null,
      },
    });
  } catch (error) {
    console.error('Error registrando liquidación:', error);
    res.status(500).json({ success: false, msg: 'Error al registrar la liquidación.' });
  }
});

/**
 * GET /api/defi/liquidations
 */
router.get('/liquidations', authMiddleware, async (req, res) => {
  try {
    const rows = await db('liquidations')
      .where('user_id', req.user.id)
      .orderBy('executed_at', 'desc');
    res.json({
      success: true,
      liquidations: rows.map(formatLiquidation),
    });
  } catch (error) {
    console.error('Error obteniendo liquidaciones:', error);
    res.status(500).json({ success: false, msg: 'Error al obtener liquidaciones.' });
  }
});

/**
 * Calcula health factor estimado de una posición en base a LTV
 */
function calculateHealthFactor(ltvRatio) {
  if (!ltvRatio) return null;
  return parseFloat(
    (((DEFAULT_COLLATERAL_THRESHOLD - ltvRatio) / DEFAULT_COLLATERAL_THRESHOLD) * 100).toFixed(2)
  );
}

function formatPosition(row) {
  if (!row) return null;
  const metadata = row.metadata ? JSON.parse(row.metadata) : {};
  return {
    id: row.id,
    asset: row.asset,
    amount: row.amount !== undefined ? parseFloat(row.amount) : null,
    valueUsd: row.value_usd !== undefined ? parseFloat(row.value_usd) : null,
    healthFactor:
      row.health_factor !== undefined
        ? parseFloat(row.health_factor)
        : calculateHealthFactor(metadata.ltvRatio),
    status: row.status,
    metadata,
    timestamps: {
      created: row.created_at ? new Date(row.created_at).toISOString() : null,
      updated: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    },
  };
}

function formatHedge(row) {
  if (!row) return null;
  const details = row.details ? JSON.parse(row.details) : {};
  return {
    id: row.id,
    assetIn: row.asset_in,
    assetOut: row.asset_out,
    amountIn: row.amount_in !== undefined ? parseFloat(row.amount_in) : null,
    amountOut:
      row.amount_out !== undefined && row.amount_out !== null ? parseFloat(row.amount_out) : null,
    txHash: row.tx_hash,
    status: row.status,
    details,
    timestamps: {
      created: row.created_at ? new Date(row.created_at).toISOString() : null,
      updated: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    },
  };
}

function formatLiquidation(row) {
  if (!row) return null;
  const details = row.details ? JSON.parse(row.details) : {};
  return {
    id: row.id,
    loanId: row.loan_id,
    userId: row.user_id,
    recoveredAmount: row.recovered_amount !== undefined ? parseFloat(row.recovered_amount) : null,
    recoveredAsset: row.recovered_asset,
    reason: row.reason,
    executedAt: row.executed_at ? new Date(row.executed_at).toISOString() : null,
    details,
  };
}

module.exports = router;
