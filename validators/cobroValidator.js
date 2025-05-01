// validators/cobroValidator.js
const { body, param } = require('express-validator');
const db = require('../db'); // Ajusta ruta

// --- Funciones Auxiliares ---
const turnoExistsAndPending = async (id_turno) => {
  if (!id_turno) return false;
  // Verificar si el turno existe y si su cobro asociado aún no está completo o cancelado
  const sql = `
    SELECT 1 FROM turnos t
    LEFT JOIN cobros c ON t.id = c.id_turno
    WHERE t.id = ? AND (c.estado_pago IS NULL OR c.estado_pago NOT IN ('pagado_completo', 'cancelado'))
    LIMIT 1
    `;
  try {
    const [results] = await db.query(sql, [id_turno]);
    return results.length > 0;
  } catch (error) { console.error("Error verificando turno para cobro:", error); return false; }
};

const cobroExists = async (id_cobro) => {
     if (!id_cobro) return false;
     const sql = 'SELECT 1 FROM cobros WHERE id = ? LIMIT 1';
     try { const [r] = await db.query(sql, [id_cobro]); return r.length > 0; }
     catch (e) { console.error("Error verificando cobro:", e); return false; }
};


// --- Reglas de Validación ---

// Validación para Registrar un Pago (Adelanto o Final) - Usaremos PATCH
const validateRegistrarPago = [
  param('id').isInt({ gt: 0 }).withMessage('El ID del cobro debe ser un entero positivo.')
      .custom(async (value) => { // Verificar que el cobro exista
          if (!(await cobroExists(value))) {
              throw new Error(`El registro de cobro con ID ${value} no existe.`);
          }
          return true;
      }),
  body('tipo_pago').isIn(['adelanto', 'final']).withMessage("El tipo de pago debe ser 'adelanto' o 'final'."),
  body('monto_pagado')
    .notEmpty().withMessage('El monto pagado es requerido.')
    .isDecimal({ decimal_digits: '1,2', gt: 0 }).withMessage('El monto pagado debe ser un número decimal positivo.')
    .toFloat(),
  body('metodo_pago')
    .notEmpty().withMessage('El método de pago es requerido.')
    .isString().trim().isLength({ min: 1, max: 50 }).withMessage('Método de pago inválido o demasiado largo.'),
  body('fecha_pago').optional({ nullable: true }).isISO8601().withMessage('Formato YYYY-MM-DD HH:MM:SS o YYYY-MM-DD.'),
  body('notas').optional({ nullable: true }).isString().trim().isLength({ max: 65535 })
];

// Validación para Crear Manualmente un Cobro (si es necesario, aunque se recomienda crearlo con el turno)
// const validateCreateCobroManual = [
//     body('id_turno').notEmpty().isInt({ gt: 0 })
//         .custom(async (value) => {
//             // Verificar que el turno exista y no tenga ya un cobro asociado
//         }),
//     body('monto_total').notEmpty().isDecimal({ decimal_digits: '1,2', gt: 0 }),
//     // Podrías añadir más campos aquí si permites crearlo manualmente
// ];

// Validación para obtener cobros por Turno o Cliente (GET /cobros/turno/:turnoId, /cobros/cliente/:clienteId)
const validateGetCobros = [
    // Validar param turnoId o clienteId según la ruta
     param('turnoId').optional().isInt({ gt: 0 }).withMessage('ID de turno inválido.'),
     param('clienteId').optional().isInt({ gt: 0 }).withMessage('ID de cliente inválido.'),
    // Opcional: Validar query params de fecha
];

module.exports = {
  validateRegistrarPago,
  // validateCreateCobroManual, // Si lo implementas
  validateGetCobros
};