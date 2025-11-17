/**
 * API Routes para Contratos BitForward
 * Maneja la creación, gestión y consulta de contratos forward con persistencia SQLite
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { db } = require('../database/config');

const router = express.Router();

/**
 * @route   GET /api/contracts
 * @desc    Obtener todos los contratos del usuario autenticado
 * @access  Privado (requiere token)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const contracts = await db('contracts')
      .where('user_id', userId)
      .orderBy('created_at', 'desc');

    // Calcular métricas adicionales para cada contrato
    const contractsWithMetrics = contracts.map(contract => {
      const currentPrice = parseFloat(contract.current_price) || 0;
      const strikePrice = parseFloat(contract.strike_price);
      const amount = parseFloat(contract.amount);

      // Calcular P&L
      const unrealizedPnL = contract.status === 'active'
        ? (currentPrice - strikePrice) * amount
        : 0;

      // Calcular días hasta vencimiento
      const expirationDate = new Date(contract.expiration_date);
      const today = new Date();
      const daysToExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));

      return {
        ...contract,
        amount: parseFloat(contract.amount),
        strike_price: parseFloat(contract.strike_price),
        current_price: currentPrice,
        collateral_amount: parseFloat(contract.collateral_amount) || 0,
        metadata: contract.metadata ? JSON.parse(contract.metadata) : {},
        metrics: {
          unrealizedPnL,
          daysToExpiration,
          isExpiring: daysToExpiration <= 7 && daysToExpiration > 0,
          isExpired: daysToExpiration <= 0
        }
      };
    });

    console.log(`📋 Consultando contratos para usuario ${userId}: ${contracts.length} encontrados`);

    res.json({
      success: true,
      contracts: contractsWithMetrics,
      summary: {
        total: contracts.length,
        active: contracts.filter(c => c.status === 'active').length,
        expired: contracts.filter(c => c.status === 'expired').length,
        totalValue: contractsWithMetrics.reduce((sum, c) => sum + c.amount * c.strike_price, 0)
      }
    });

  } catch (error) {
    console.error('Error obteniendo contratos:', error);
    res.status(500).json({
      success: false,
      msg: 'Error interno del servidor al obtener contratos.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/contracts/:id
 * @desc    Obtener detalles de un contrato específico
 * @access  Privado (requiere token y ownership)
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const contractId = req.params.id;
    const userId = req.user.id;

    const contract = await db('contracts')
      .where({ id: contractId, user_id: userId })
      .first();

    if (!contract) {
      return res.status(404).json({
        success: false,
        msg: 'Contrato no encontrado o no tienes permisos para verlo.'
      });
    }

    // Calcular métricas detalladas
    const currentPrice = parseFloat(contract.current_price) || 0;
    const strikePrice = parseFloat(contract.strike_price);
    const amount = parseFloat(contract.amount);

    const unrealizedPnL = contract.status === 'active'
      ? (currentPrice - strikePrice) * amount
      : 0;

    const expirationDate = new Date(contract.expiration_date);
    const createdDate = new Date(contract.created_at);
    const today = new Date();

    const daysToExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
    const contractAge = Math.ceil((today - createdDate) / (1000 * 60 * 60 * 24));

    // Obtener historial de transacciones relacionadas
    const transactions = await db('transactions')
      .where('reference_id', contractId)
      .orderBy('created_at', 'desc');

    const contractDetails = {
      ...contract,
      amount: parseFloat(contract.amount),
      strike_price: parseFloat(contract.strike_price),
      current_price: currentPrice,
      collateral_amount: parseFloat(contract.collateral_amount) || 0,
      metadata: contract.metadata ? JSON.parse(contract.metadata) : {},
      metrics: {
        unrealizedPnL,
        unrealizedPnLPercentage: strikePrice > 0 ? ((currentPrice - strikePrice) / strikePrice) * 100 : 0,
        daysToExpiration,
        contractAge,
        isExpiring: daysToExpiration <= 7 && daysToExpiration > 0,
        isExpired: daysToExpiration <= 0,
        totalValue: amount * strikePrice,
        currentValue: amount * currentPrice
      },
      transactions: transactions.map(t => ({
        ...t,
        amount: parseFloat(t.amount),
        details: t.details ? JSON.parse(t.details) : {}
      }))
    };

    console.log(`📄 Detalles del contrato ${contractId} consultados por usuario ${userId}`);

    res.json({
      success: true,
      contract: contractDetails
    });

  } catch (error) {
    console.error('Error obteniendo detalles del contrato:', error);
    res.status(500).json({
      success: false,
      msg: 'Error interno del servidor al obtener detalles del contrato.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/contracts
 * @desc    Crear un nuevo contrato forward
 * @access  Privado (requiere token)
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      asset,
      amount,
      strikePrice,
      expirationDate,
      contractType = 'forward',
      collateralAmount,
      collateralAsset
    } = req.body;

    // Validaciones
    if (!asset || !amount || !strikePrice || !expirationDate) {
      return res.status(400).json({
        success: false,
        msg: 'Todos los campos requeridos deben ser proporcionados.',
        required: ['asset', 'amount', 'strikePrice', 'expirationDate']
      });
    }

    if (amount <= 0 || strikePrice <= 0) {
      return res.status(400).json({
        success: false,
        msg: 'El monto y precio strike deben ser mayores a cero.'
      });
    }

    const expDate = new Date(expirationDate);
    const today = new Date();
    if (expDate <= today) {
      return res.status(400).json({
        success: false,
        msg: 'La fecha de vencimiento debe ser futura.'
      });
    }

    // Generar ID único del contrato
    const contractId = `BF_${asset}_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Crear el contrato en la base de datos
    await db('contracts').insert({
      id: contractId,
      user_id: userId,
      asset: asset.toUpperCase(),
      amount: parseFloat(amount),
      strike_price: parseFloat(strikePrice),
      current_price: parseFloat(strikePrice), // Inicialmente igual al strike
      expiration_date: expDate,
      status: 'active',
      contract_type: contractType,
      collateral_amount: collateralAmount ? parseFloat(collateralAmount) : null,
      collateral_asset: collateralAsset || null,
      metadata: JSON.stringify({
        createdBy: req.user.username,
        platform: 'BitForward',
        version: '2.0.0'
      })
    });

    // Registrar la transacción
    await db('transactions').insert({
      id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      user_id: userId,
      type: 'contract_creation',
      reference_id: contractId,
      amount: parseFloat(amount),
      asset: asset.toUpperCase(),
      status: 'confirmed',
      details: JSON.stringify({
        action: 'create_forward_contract',
        strike_price: parseFloat(strikePrice),
        expiration_date: expDate,
        collateral: collateralAmount ? {
          amount: parseFloat(collateralAmount),
          asset: collateralAsset
        } : null
      })
    });

    console.log(`✅ Nuevo contrato creado: ${contractId} por usuario ${userId}`);
    console.log(`📊 Detalles: ${amount} ${asset} @ $${strikePrice} (exp: ${expDate.toISOString().split('T')[0]})`);

    res.status(201).json({
      success: true,
      msg: 'Contrato forward creado exitosamente.',
      contract: {
        id: contractId,
        asset: asset.toUpperCase(),
        amount: parseFloat(amount),
        strikePrice: parseFloat(strikePrice),
        expirationDate: expDate,
        status: 'active',
        contractType
      }
    });

  } catch (error) {
    console.error('Error creando contrato:', error);
    res.status(500).json({
      success: false,
      msg: 'Error interno del servidor al crear el contrato.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/contracts/:id
 * @desc    Cancelar un contrato (solo si está activo)
 * @access  Privado (requiere token y ownership)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const contractId = req.params.id;
    const userId = req.user.id;

    // Verificar que el contrato existe y pertenece al usuario
    const contract = await db('contracts')
      .where({ id: contractId, user_id: userId })
      .first();

    if (!contract) {
      return res.status(404).json({
        success: false,
        msg: 'Contrato no encontrado o no tienes permisos para cancelarlo.'
      });
    }

    if (contract.status !== 'active') {
      return res.status(400).json({
        success: false,
        msg: 'Solo se pueden cancelar contratos activos.'
      });
    }

    // Actualizar estado del contrato
    await db('contracts')
      .where('id', contractId)
      .update({
        status: 'cancelled',
        updated_at: new Date()
      });

    // Registrar la transacción de cancelación
    await db('transactions').insert({
      id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      user_id: userId,
      type: 'contract_cancellation',
      reference_id: contractId,
      amount: parseFloat(contract.amount),
      asset: contract.asset,
      status: 'confirmed',
      details: JSON.stringify({
        action: 'cancel_forward_contract',
        reason: 'user_requested',
        original_strike: parseFloat(contract.strike_price),
        cancellation_date: new Date()
      })
    });

    console.log(`❌ Contrato cancelado: ${contractId} por usuario ${userId}`);

    res.json({
      success: true,
      msg: 'Contrato cancelado exitosamente.',
      contractId
    });

  } catch (error) {
    console.error('Error cancelando contrato:', error);
    res.status(500).json({
      success: false,
      msg: 'Error interno del servidor al cancelar el contrato.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
