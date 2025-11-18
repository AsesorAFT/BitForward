const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const loansDB = [];

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
      collateralTypes: ['BTC', 'ETH', 'SOL', 'USDT'],
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
    const supportedCollateral = ['BTC', 'ETH', 'SOL', 'USDT'];
    if (!supportedCollateral.includes(collateralType)) {
      return res.status(400).json({
        success: false,
        msg: `Colateral no soportado. Tipos válidos: ${supportedCollateral.join(', ')}`,
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
    if (parseInt(termDays) < 30 || parseInt(termDays) > 1825) {
      // 30 días a 5 años
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
    const aprCalculation = calculateAPR(collateralType, parseInt(termDays), parseFloat(ltvRatio));

    // Crear solicitud de préstamo
    const loanRequest = {
      id: `loan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user.id,
      userEmail: req.user.email,
      collateral: {
        type: collateralType,
        amount: parseFloat(collateralAmount),
      },
      loan: {
        amount: parseFloat(loanAmount),
        currency: 'USDT', // Por defecto préstamos en USDT
      },
      terms: {
        days: parseInt(termDays),
        apr: aprCalculation.apr,
        ltvRatio: parseFloat(ltvRatio),
      },
      calculations: {
        totalInterest: aprCalculation.totalInterest,
        totalRepayment: aprCalculation.totalRepayment,
        dailyInterest: aprCalculation.dailyInterest,
        liquidationPrice: aprCalculation.liquidationPrice,
      },
      status: 'pending_approval',
      timestamps: {
        requested: new Date().toISOString(),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h para aprobar
      },
      riskMetrics: {
        healthFactor: calculateHealthFactor(parseFloat(ltvRatio)),
        liquidationThreshold: 90,
        priceVolatility: getAssetVolatility(collateralType),
      },
    };

    // Guardar en la "base de datos"
    loansDB.push(loanRequest);

    console.log(`💰 Nueva solicitud de préstamo: ${loanRequest.id} por ${req.user.email}`);
    console.log(
      `📊 Colateral: ${collateralAmount} ${collateralType} | Préstamo: ${loanAmount} USDT`
    );

    res.status(201).json({
      success: true,
      msg: '¡Solicitud de préstamo creada exitosamente!',
      loan: {
        id: loanRequest.id,
        status: loanRequest.status,
        collateral: loanRequest.collateral,
        loan: loanRequest.loan,
        terms: loanRequest.terms,
        calculations: loanRequest.calculations,
        riskMetrics: loanRequest.riskMetrics,
        timestamps: loanRequest.timestamps,
      },
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
router.get('/loans', authMiddleware, (req, res) => {
  try {
    const userLoans = loansDB.filter(loan => loan.userId === req.user.id);

    res.json({
      success: true,
      count: userLoans.length,
      loans: userLoans.map(loan => ({
        id: loan.id,
        status: loan.status,
        collateral: loan.collateral,
        loan: loan.loan,
        terms: loan.terms,
        calculations: loan.calculations,
        riskMetrics: loan.riskMetrics,
        timestamps: loan.timestamps,
      })),
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
router.get('/loan/:id', authMiddleware, (req, res) => {
  try {
    const loan = loansDB.find(l => l.id === req.params.id && l.userId === req.user.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        msg: 'Préstamo no encontrado.',
      });
    }

    res.json({
      success: true,
      loan,
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
 * Funciones auxiliares para cálculos
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

module.exports = router;
