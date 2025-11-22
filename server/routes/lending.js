const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const SUPPORTED_COLLATERAL = ['BTC', 'ETH', 'SOL', 'USDT'];
const LOAN_STATUSES = {
  PENDING: 'pending_approval',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  REPAID: 'repaid',
  LIQUIDATED: 'liquidated',
};

/**
 * @route   GET /api/lending/health
 * @desc    Health check para el servicio de préstamos
 * @access  Público
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'BitForward Lending API',
    status: 'operational',
    timestamp: new Date().toISOString(),
    features: {
      collateralTypes: SUPPORTED_COLLATERAL,
      maxLTV: 85,
      minAPR: 3.5,
      liquidationThreshold: 90,
    },
  });
});

/**
 * @route   POST /api/lending/request
 * @desc    Solicitar un préstamo con colateral
 * @access  Privado (requiere autenticación)
 */
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { collateralType, collateralAmount, loanAmount, termDays, ltvRatio } = req.body;

    // Validaciones básicas
    if (!collateralType || !collateralAmount || !loanAmount || !termDays) {
      return res.status(400).json({
        success: false,
        msg: 'Todos los campos son requeridos: collateralType, collateralAmount, loanAmount, termDays',
        missingFields: {
          collateralType: !collateralType,
          collateralAmount: !collateralAmount,
          loanAmount: !loanAmount,
          termDays: !termDays,
        },
      });
    }

    // Validar colateral soportado
    if (!SUPPORTED_COLLATERAL.includes(collateralType)) {
      return res.status(400).json({
        success: false,
        msg: `Colateral no soportado. Tipos válidos: ${SUPPORTED_COLLATERAL.join(', ')}`,
        field: 'collateralType',
      });
    }

    // Validar montos
    if (parseFloat(collateralAmount) <= 0 || parseFloat(loanAmount) <= 0) {
      return res.status(400).json({
        success: false,
        msg: 'Los montos deben ser mayores a 0',
        field: parseFloat(collateralAmount) <= 0 ? 'collateralAmount' : 'loanAmount',
      });
    }

    // Validar plazo
    if (parseInt(termDays, 10) < 30 || parseInt(termDays, 10) > 1825) {
      return res.status(400).json({
        success: false,
        msg: 'El plazo debe estar entre 30 y 1825 días (5 años)',
        field: 'termDays',
      });
    }

    // Validar LTV (Loan-to-Value ratio)
    const maxLTV = 85;
    if (parseFloat(ltvRatio) > maxLTV) {
      return res.status(400).json({
        success: false,
        msg: `LTV ratio no puede exceder ${maxLTV}%`,
        field: 'ltvRatio',
        maxAllowed: maxLTV,
      });
    }

    // Calcular APR basado en colateral y plazo
    const aprCalculation = calculateAPR(
      collateralType,
      parseInt(termDays, 10),
      parseFloat(ltvRatio)
    );

    // Crear solicitud de préstamo persistente
    const loanId = `loan_${uuidv4()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h para aprobar
    const dueDate = new Date(Date.now() + parseInt(termDays, 10) * 24 * 60 * 60 * 1000);

    await db('loans').insert({
      id: loanId,
      user_id: req.user.id,
      principal_amount: parseFloat(loanAmount),
      principal_asset: 'USDT',
      collateral_amount: parseFloat(collateralAmount),
      collateral_asset: collateralType,
      interest_rate: aprCalculation.apr,
      ltv_ratio: parseFloat(ltvRatio),
      due_date: dueDate,
      status: LOAN_STATUSES.PENDING,
      terms: JSON.stringify({
        days: parseInt(termDays, 10),
        apr: aprCalculation.apr,
        ltvRatio: parseFloat(ltvRatio),
        totalInterest: aprCalculation.totalInterest,
        totalRepayment: aprCalculation.totalRepayment,
        dailyInterest: aprCalculation.dailyInterest,
        liquidationPrice: aprCalculation.liquidationPrice,
        expiresAt: expiresAt.toISOString(),
      }),
      created_at: new Date(),
      updated_at: new Date(),
    });

    const storedLoan = await db('loans').where({ id: loanId }).first();
    const formattedLoan = formatLoan(storedLoan);

    console.log(`💰 Nueva solicitud de préstamo: ${loanId} por ${req.user.email}`);
    console.log(
      `📊 Colateral: ${collateralAmount} ${collateralType} | Préstamo: ${loanAmount} USDT`
    );

    res.status(201).json({
      success: true,
      msg: '¡Solicitud de préstamo creada exitosamente!',
      loan: formattedLoan,
    });
  } catch (error) {
    console.error('Error en solicitud de préstamo:', error);
    res.status(500).json({
      success: false,
      msg: 'Error interno del servidor al procesar la solicitud de préstamo.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * @route   GET /api/lending/loans
 * @desc    Obtener préstamos del usuario autenticado
 * @access  Privado
 */
router.get('/loans', authMiddleware, async (req, res) => {
  try {
    const userLoans = await db('loans').where('user_id', req.user.id).orderBy('created_at', 'desc');

    res.json({
      success: true,
      count: userLoans.length,
      loans: userLoans.map(formatLoan),
    });
  } catch (error) {
    console.error('Error obteniendo préstamos:', error);
    res.status(500).json({
      success: false,
      msg: 'Error al obtener los préstamos del usuario.',
    });
  }
});

/**
 * @route   GET /api/lending/loan/:id
 * @desc    Obtener detalles de un préstamo específico
 * @access  Privado
 */
router.get('/loan/:id', authMiddleware, async (req, res) => {
  try {
    const loan = await db('loans').where({ id: req.params.id, user_id: req.user.id }).first();

    if (!loan) {
      return res.status(404).json({
        success: false,
        msg: 'Préstamo no encontrado.',
      });
    }

    res.json({
      success: true,
      loan: formatLoan(loan),
    });
  } catch (error) {
    console.error('Error obteniendo detalles del préstamo:', error);
    res.status(500).json({
      success: false,
      msg: 'Error al obtener los detalles del préstamo.',
    });
  }
});

/**
 * @route   POST /api/lending/loan/:id/approve
 * @desc    Aprobar un préstamo pendiente
 * @access  Privado (usuario dueño)
 */
router.post('/loan/:id/approve', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await db('loans').where({ id, user_id: req.user.id }).first();
    if (!loan) {
      return res.status(404).json({ success: false, msg: 'Préstamo no encontrado.' });
    }
    if (loan.status !== LOAN_STATUSES.PENDING) {
      return res
        .status(400)
        .json({ success: false, msg: 'Solo se pueden aprobar préstamos pendientes.' });
    }

    await db('loans')
      .where({ id })
      .update({
        status: LOAN_STATUSES.ACTIVE,
        approved_at: new Date(),
        approval_notes: req.body?.notes || null,
        updated_at: new Date(),
      });

    await recordTransaction(
      req.user.id,
      id,
      'loan_approval',
      loan.principal_amount,
      loan.principal_asset,
      {
        notes: req.body?.notes || null,
      }
    );

    const updated = await db('loans').where({ id }).first();
    res.json({ success: true, loan: formatLoan(updated) });
  } catch (error) {
    console.error('Error aprobando préstamo:', error);
    res.status(500).json({ success: false, msg: 'Error al aprobar el préstamo.' });
  }
});

/**
 * @route   POST /api/lending/loan/:id/reject
 * @desc    Rechazar un préstamo pendiente
 * @access  Privado (usuario dueño)
 */
router.post('/loan/:id/reject', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const loan = await db('loans').where({ id, user_id: req.user.id }).first();
    if (!loan) {
      return res.status(404).json({ success: false, msg: 'Préstamo no encontrado.' });
    }
    if (loan.status !== LOAN_STATUSES.PENDING) {
      return res
        .status(400)
        .json({ success: false, msg: 'Solo se pueden rechazar préstamos pendientes.' });
    }

    await db('loans')
      .where({ id })
      .update({
        status: LOAN_STATUSES.REJECTED,
        rejected_at: new Date(),
        rejection_reason: reason || null,
        updated_at: new Date(),
      });

    const updated = await db('loans').where({ id }).first();
    res.json({ success: true, loan: formatLoan(updated) });
  } catch (error) {
    console.error('Error rechazando préstamo:', error);
    res.status(500).json({ success: false, msg: 'Error al rechazar el préstamo.' });
  }
});

/**
 * @route   POST /api/lending/loan/:id/repay
 * @desc    Registrar pago de préstamo
 * @access  Privado (usuario dueño)
 */
router.post('/loan/:id/repay', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const amount = parseFloat(req.body?.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, msg: 'Monto de pago inválido.' });
    }

    const loan = await db('loans').where({ id, user_id: req.user.id }).first();
    if (!loan) {
      return res.status(404).json({ success: false, msg: 'Préstamo no encontrado.' });
    }
    if (![LOAN_STATUSES.ACTIVE, LOAN_STATUSES.PENDING].includes(loan.status)) {
      return res
        .status(400)
        .json({ success: false, msg: 'Solo se pueden pagar préstamos activos/pending.' });
    }

    const newRepaid = parseFloat(loan.repaid_amount || 0) + amount;
    const fullyRepaid = newRepaid >= parseFloat(loan.principal_amount || 0);

    await db('loans')
      .where({ id })
      .update({
        repaid_amount: newRepaid,
        status: fullyRepaid ? LOAN_STATUSES.REPAID : LOAN_STATUSES.ACTIVE,
        last_payment_at: new Date(),
        updated_at: new Date(),
      });

    await recordTransaction(req.user.id, id, 'loan_payment', amount, loan.principal_asset, {
      fullyRepaid,
    });

    const updated = await db('loans').where({ id }).first();
    res.json({ success: true, loan: formatLoan(updated) });
  } catch (error) {
    console.error('Error registrando pago:', error);
    res.status(500).json({ success: false, msg: 'Error al registrar el pago.' });
  }
});

/**
 * @route   POST /api/lending/loan/:id/liquidate
 * @desc    Liquidar un préstamo
 * @access  Privado (usuario dueño)
 */
router.post('/loan/:id/liquidate', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, recoveredAmount, recoveredAsset } = req.body || {};
    const loan = await db('loans').where({ id, user_id: req.user.id }).first();
    if (!loan) {
      return res.status(404).json({ success: false, msg: 'Préstamo no encontrado.' });
    }

    await db('loans')
      .where({ id })
      .update({
        status: LOAN_STATUSES.LIQUIDATED,
        liquidated_at: new Date(),
        liquidation_reason: reason || null,
        updated_at: new Date(),
      });

    const liquidationId = uuidv4();
    await db('liquidations').insert({
      id: liquidationId,
      loan_id: id,
      user_id: req.user.id,
      recovered_amount: recoveredAmount ? parseFloat(recoveredAmount) : 0,
      recovered_asset: recoveredAsset || loan.collateral_asset,
      reason: reason || null,
      executed_at: new Date(),
      details: JSON.stringify({ initiatedBy: req.user.id }),
    });

    await recordTransaction(
      req.user.id,
      id,
      'loan_liquidation',
      recoveredAmount ? parseFloat(recoveredAmount) : 0,
      recoveredAsset || loan.collateral_asset,
      { reason }
    );

    const updated = await db('loans').where({ id }).first();
    res.json({ success: true, loan: formatLoan(updated) });
  } catch (error) {
    console.error('Error liquidando préstamo:', error);
    res.status(500).json({ success: false, msg: 'Error al liquidar el préstamo.' });
  }
});

/**
 * Funciones auxiliares para cálculos y formateo
 */

function calculateAPR(collateralType, termDays, ltvRatio) {
  // Base APR por tipo de colateral
  const baseAPR = {
    BTC: 3.5,
    ETH: 4.0,
    SOL: 5.5,
    USDT: 3.0,
  };

  // Ajustes por plazo
  const termMultiplier = termDays > 365 ? 1.2 : termDays > 180 ? 1.1 : 1.0;

  // Ajustes por LTV (más riesgo = mayor APR)
  const ltvMultiplier = ltvRatio > 70 ? 1.3 : ltvRatio > 50 ? 1.15 : 1.0;

  const finalAPR = baseAPR[collateralType] * termMultiplier * ltvMultiplier;

  return {
    apr: parseFloat(finalAPR.toFixed(2)),
    totalInterest: parseFloat(((finalAPR / 100) * (termDays / 365)).toFixed(4)),
    totalRepayment: parseFloat((1 + (finalAPR / 100) * (termDays / 365)).toFixed(4)),
    dailyInterest: parseFloat((finalAPR / 365 / 100).toFixed(6)),
    liquidationPrice: parseFloat((1 / 0.9).toFixed(4)), // 90% threshold
  };
}

function calculateHealthFactor(ltvRatio) {
  if (ltvRatio === undefined || ltvRatio === null) {
    return null;
  }
  const liquidationThreshold = 90;
  return parseFloat((((liquidationThreshold - ltvRatio) / liquidationThreshold) * 100).toFixed(1));
}

function getAssetVolatility(asset) {
  const volatility = {
    BTC: 'medium',
    ETH: 'medium-high',
    SOL: 'high',
    USDT: 'low',
  };
  return volatility[asset] || 'unknown';
}

function formatLoan(row) {
  if (!row) return null;

  const terms = row.terms ? JSON.parse(row.terms) : {};
  const ltvRatio =
    row.ltv_ratio !== undefined && row.ltv_ratio !== null ? parseFloat(row.ltv_ratio) : null;
  const createdAt = row.created_at ? new Date(row.created_at).toISOString() : null;
  const dueDate = row.due_date ? new Date(row.due_date).toISOString() : null;

  return {
    id: row.id,
    status: row.status,
    collateral: {
      type: row.collateral_asset,
      amount: row.collateral_amount !== undefined ? parseFloat(row.collateral_amount) : null,
    },
    loan: {
      amount: row.principal_amount !== undefined ? parseFloat(row.principal_amount) : null,
      currency: row.principal_asset,
    },
    terms: {
      days: terms.days ?? terms.termDays ?? null,
      apr: row.interest_rate !== undefined ? parseFloat(row.interest_rate) : terms.apr,
      ltvRatio,
    },
    calculations: {
      totalInterest: terms.totalInterest ?? null,
      totalRepayment: terms.totalRepayment ?? null,
      dailyInterest: terms.dailyInterest ?? null,
      liquidationPrice: terms.liquidationPrice ?? null,
    },
    riskMetrics: {
      healthFactor: calculateHealthFactor(ltvRatio),
      liquidationThreshold: 90,
      priceVolatility: getAssetVolatility(row.collateral_asset),
    },
    timestamps: {
      requested: createdAt,
      updated: row.updated_at ? new Date(row.updated_at).toISOString() : null,
      dueDate,
      expires: terms.expiresAt || terms.expires || null,
    },
  };
}

async function recordTransaction(userId, referenceId, type, amount, asset, details = {}) {
  const txId = `TXN_${uuidv4()}`;
  await db('transactions').insert({
    id: txId,
    user_id: userId,
    type,
    reference_id: referenceId,
    amount: amount || 0,
    asset: asset || 'USDT',
    status: 'confirmed',
    transaction_hash: null,
    details: JSON.stringify(details),
    created_at: new Date(),
    updated_at: new Date(),
  });
  return txId;
}

module.exports = router;
