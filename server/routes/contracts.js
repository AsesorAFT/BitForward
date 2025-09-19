/**
 * API Routes para Contratos BitForward
 * Maneja todas las operaciones CRUD de contratos
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const database = require('../database/database');
const { BitForwardValidator } = require('../validators/contractValidator');
const auth = require('../middleware/auth');

const router = express.Router();

// Esquemas de validación con Joi
const contractCreateSchema = Joi.object({
    blockchain: Joi.string().valid('bitcoin', 'ethereum', 'solana').required(),
    amount: Joi.number().positive().min(0.001).max(10000).required(),
    strikePrice: Joi.number().positive().min(0.01).optional(),
    counterpartyAddress: Joi.string().min(26).max(62).required(),
    executionDate: Joi.date().iso().min('now').required(),
    contractType: Joi.string().valid('forward', 'option', 'swap').default('forward'),
    metadata: Joi.object().optional()
});

const contractUpdateSchema = Joi.object({
    status: Joi.string().valid('pending', 'active', 'completed', 'cancelled', 'expired'),
    transactionHash: Joi.string().optional(),
    executedAt: Joi.date().iso().optional(),
    metadata: Joi.object().optional()
}).min(1);

/**
 * GET /api/contracts
 * Obtiene lista de contratos con filtros opcionales
 */
router.get('/', async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            blockchain,
            creator,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        // Validar parámetros
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;

        // Construir query dinámicamente
        let whereConditions = [];
        let params = [];

        if (status) {
            whereConditions.push('status = ?');
            params.push(status);
        }

        if (blockchain) {
            whereConditions.push('blockchain = ?');
            params.push(blockchain);
        }

        if (creator) {
            whereConditions.push('creator_id = ?');
            params.push(creator);
        }

        const whereClause = whereConditions.length > 0 ? 
            'WHERE ' + whereConditions.join(' AND ') : '';

        // Query principal
        const contractsQuery = `
            SELECT 
                c.*,
                COUNT(cp.id) as participant_count,
                GROUP_CONCAT(cp.participant_address) as participants
            FROM contracts c
            LEFT JOIN contract_participants cp ON c.id = cp.contract_id
            ${whereClause}
            GROUP BY c.id
            ORDER BY c.${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `;

        // Query para contar total
        const countQuery = `
            SELECT COUNT(DISTINCT c.id) as total
            FROM contracts c
            ${whereClause}
        `;

        // Ejecutar queries
        const contracts = await database.all(contractsQuery, [...params, limitNum, offset]);
        const countResult = await database.get(countQuery, params);
        const total = countResult.total;

        // Procesar resultados
        const processedContracts = contracts.map(contract => ({
            ...contract,
            metadata: contract.metadata ? JSON.parse(contract.metadata) : null,
            participants: contract.participants ? contract.participants.split(',') : [],
            participantCount: contract.participant_count
        }));

        res.json({
            success: true,
            data: {
                contracts: processedContracts,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum),
                    hasNext: pageNum * limitNum < total,
                    hasPrev: pageNum > 1
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/contracts/:id
 * Obtiene un contrato específico por ID
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validar UUID
        if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
            return res.status(400).json({
                success: false,
                error: 'ID de contrato inválido',
                code: 'INVALID_CONTRACT_ID'
            });
        }

        const contract = await database.get(`
            SELECT c.*, 
                   GROUP_CONCAT(cp.participant_address) as participants,
                   GROUP_CONCAT(cp.role) as participant_roles
            FROM contracts c
            LEFT JOIN contract_participants cp ON c.id = cp.contract_id
            WHERE c.id = ?
            GROUP BY c.id
        `, [id]);

        if (!contract) {
            return res.status(404).json({
                success: false,
                error: 'Contrato no encontrado',
                code: 'CONTRACT_NOT_FOUND'
            });
        }

        // Obtener transacciones relacionadas
        const transactions = await database.all(`
            SELECT * FROM transactions 
            WHERE contract_id = ? 
            ORDER BY timestamp DESC
        `, [id]);

        // Procesar respuesta
        const response = {
            ...contract,
            metadata: contract.metadata ? JSON.parse(contract.metadata) : null,
            participants: contract.participants ? 
                contract.participants.split(',').map((addr, idx) => ({
                    address: addr,
                    role: contract.participant_roles.split(',')[idx]
                })) : [],
            transactions
        };

        delete response.participant_roles;

        res.json({
            success: true,
            data: response,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/contracts
 * Crea un nuevo contrato
 */
router.post('/', async (req, res, next) => {
    try {
        // Validar datos de entrada
        const { error, value } = contractCreateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Datos de contrato inválidos',
                details: error.details.map(d => d.message),
                code: 'VALIDATION_ERROR'
            });
        }

        // Validación personalizada con BitForwardValidator
        const validationErrors = BitForwardValidator.validateContract(value);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validación de contrato fallida',
                details: validationErrors,
                code: 'CONTRACT_VALIDATION_ERROR'
            });
        }

        const contractId = uuidv4();
        const now = new Date().toISOString();

        await database.beginTransaction();

        try {
            // Insertar contrato
            await database.run(`
                INSERT INTO contracts (
                    id, blockchain, amount, strike_price, counterparty_address,
                    execution_date, contract_type, created_at, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                contractId,
                value.blockchain,
                value.amount,
                value.strikePrice || null,
                value.counterpartyAddress,
                value.executionDate,
                value.contractType,
                now,
                value.metadata ? JSON.stringify(value.metadata) : null
            ]);

            // Registrar evento
            await database.run(`
                INSERT INTO system_events (id, event_type, entity_type, entity_id, data)
                VALUES (?, ?, ?, ?, ?)
            `, [
                uuidv4(),
                'contract_created',
                'contract',
                contractId,
                JSON.stringify({ 
                    blockchain: value.blockchain, 
                    amount: value.amount,
                    creator_ip: req.ip 
                })
            ]);

            await database.commit();

            // Obtener contrato creado
            const createdContract = await database.get(`
                SELECT * FROM contracts WHERE id = ?
            `, [contractId]);

            res.status(201).json({
                success: true,
                data: {
                    ...createdContract,
                    metadata: createdContract.metadata ? JSON.parse(createdContract.metadata) : null,
                    shareUrl: `${req.protocol}://${req.get('host')}/contract/${contractId}`
                },
                message: 'Contrato creado exitosamente',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            await database.rollback();
            throw error;
        }

    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/contracts/:id
 * Actualiza un contrato existente
 */
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validar datos
        const { error, value } = contractUpdateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Datos de actualización inválidos',
                details: error.details.map(d => d.message),
                code: 'VALIDATION_ERROR'
            });
        }

        // Verificar que el contrato existe
        const existingContract = await database.get('SELECT * FROM contracts WHERE id = ?', [id]);
        if (!existingContract) {
            return res.status(404).json({
                success: false,
                error: 'Contrato no encontrado',
                code: 'CONTRACT_NOT_FOUND'
            });
        }

        // Construir query de actualización
        const updateFields = [];
        const updateValues = [];

        Object.entries(value).forEach(([key, val]) => {
            if (key === 'metadata') {
                updateFields.push('metadata = ?');
                updateValues.push(JSON.stringify(val));
            } else {
                const dbField = key === 'executedAt' ? 'executed_at' : 
                              key === 'transactionHash' ? 'transaction_hash' : key;
                updateFields.push(`${dbField} = ?`);
                updateValues.push(val);
            }
        });

        updateFields.push('updated_at = ?');
        updateValues.push(new Date().toISOString());
        updateValues.push(id);

        await database.run(`
            UPDATE contracts 
            SET ${updateFields.join(', ')}
            WHERE id = ?
        `, updateValues);

        // Obtener contrato actualizado
        const updatedContract = await database.get('SELECT * FROM contracts WHERE id = ?', [id]);

        res.json({
            success: true,
            data: {
                ...updatedContract,
                metadata: updatedContract.metadata ? JSON.parse(updatedContract.metadata) : null
            },
            message: 'Contrato actualizado exitosamente',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/contracts/:id/join
 * Permite a un usuario unirse a un contrato como contraparte
 */
router.post('/:id/join', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { participantAddress, signature } = req.body;

        // Validar entrada
        if (!participantAddress) {
            return res.status(400).json({
                success: false,
                error: 'Dirección de participante requerida',
                code: 'MISSING_PARTICIPANT_ADDRESS'
            });
        }

        // Verificar contrato
        const contract = await database.get('SELECT * FROM contracts WHERE id = ?', [id]);
        if (!contract) {
            return res.status(404).json({
                success: false,
                error: 'Contrato no encontrado',
                code: 'CONTRACT_NOT_FOUND'
            });
        }

        if (contract.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'El contrato no está disponible para unirse',
                code: 'CONTRACT_NOT_AVAILABLE'
            });
        }

        await database.beginTransaction();

        try {
            // Agregar participante
            await database.run(`
                INSERT INTO contract_participants (id, contract_id, participant_address, role, signature)
                VALUES (?, ?, ?, ?, ?)
            `, [uuidv4(), id, participantAddress, 'counterparty', signature]);

            // Actualizar estado del contrato
            await database.run(`
                UPDATE contracts 
                SET status = 'active', updated_at = ?
                WHERE id = ?
            `, [new Date().toISOString(), id]);

            await database.commit();

            res.json({
                success: true,
                message: 'Te has unido al contrato exitosamente',
                data: { contractId: id, status: 'active' },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            await database.rollback();
            throw error;
        }

    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/contracts/:id
 * Cancela un contrato (solo si está en estado pending)
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const contract = await database.get('SELECT * FROM contracts WHERE id = ?', [id]);
        if (!contract) {
            return res.status(404).json({
                success: false,
                error: 'Contrato no encontrado',
                code: 'CONTRACT_NOT_FOUND'
            });
        }

        if (contract.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Solo se pueden cancelar contratos pendientes',
                code: 'CONTRACT_NOT_CANCELLABLE'
            });
        }

        await database.run(`
            UPDATE contracts 
            SET status = 'cancelled', updated_at = ?
            WHERE id = ?
        `, [new Date().toISOString(), id]);

        res.json({
            success: true,
            message: 'Contrato cancelado exitosamente',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
