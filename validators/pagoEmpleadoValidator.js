// validators/pagoEmpleadoValidator.js
const { body, param } = require('express-validator');
const db = require('../db'); // Ajusta ruta

// Reutilizar o importar helper
const empleadoExists = async (id_empleado) => {
    if (!id_empleado) return false;
    const sql = 'SELECT 1 FROM empleados WHERE id = ? LIMIT 1';
    try { const [r] = await db.query(sql, [id_empleado]); return r.length > 0; }
    catch (e) { console.error("Error verificando empleado:", e); return false; }
};

// Validación para Crear un Pago a Empleado (POST /pagos-empleados)
const validateCreatePago = [
  body('id_empleado')
    .notEmpty().withMessage('El ID del empleado es requerido.')
    .isInt({ gt: 0 }).withMessage('ID de empleado inválido.')
    .bail()
    .custom(async (value) => {
      if (!(await empleadoExists(value))) {
        throw new Error(`El empleado con ID ${value} no existe.`);
      }
      return true;
    }),
  body('fecha_pago')
    .notEmpty().withMessage('La fecha de pago es requerida.')
    .isISO8601().withMessage('La fecha de pago debe estar en formato YYYY-MM-DD.'),
    // .toDate(),
  body('periodo_inicio')
    .notEmpty().withMessage('La fecha de inicio del periodo es requerida.')
    .isISO8601().withMessage('La fecha de inicio del periodo debe ser YYYY-MM-DD.'),
    // .toDate(),
  body('periodo_fin')
    .notEmpty().withMessage('La fecha de fin del periodo es requerida.')
    .isISO8601().withMessage('La fecha de fin del periodo debe ser YYYY-MM-DD.')
    // .toDate()
    .custom((value, { req }) => { // Fecha fin >= fecha inicio
      if (value && req.body.periodo_inicio && value < req.body.periodo_inicio) {
        throw new Error('La fecha de fin del periodo no puede ser anterior a la fecha de inicio.');
      }
      return true;
    }),
  body('monto_bruto')
    .notEmpty().withMessage('El monto bruto es requerido.')
    .isDecimal({ decimal_digits: '1,2', gt: 0 }).withMessage('El monto bruto debe ser un decimal positivo.')
    .toFloat(),
  body('deducciones')
    .optional({ nullable: true })
    .isDecimal({ decimal_digits: '1,2', gte: 0 }).withMessage('Las deducciones deben ser un decimal positivo o cero.') // gte: 0 (mayor o igual)
    .toFloat()
    .custom((value, { req }) => { // Deducciones no pueden ser mayores al bruto
        if (value !== null && value !== undefined && req.body.monto_bruto && value > req.body.monto_bruto) {
            throw new Error('Las deducciones no pueden ser mayores que el monto bruto.');
        }
        return true;
    }),
  body('metodo_pago')
    .optional({ nullable: true })
    .isString().trim().isLength({ max: 50 }).withMessage('Método de pago demasiado largo (máx 50).'),
  body('referencia_pago')
    .optional({ nullable: true })
    .isString().trim().isLength({ max: 100 }).withMessage('Referencia de pago demasiado larga (máx 100).'),
  body('notas').optional({ nullable: true }).isString().trim().isLength({ max: 65535 })
];

// Validación para Obtener Pagos (GET /pagos-empleados, /pagos-empleados/empleado/:empleadoId)
const validateGetPagos = [
    param('empleadoId').optional().isInt({ gt: 0 }).withMessage('ID de empleado inválido.'),
    param('pagoId').optional().isInt({ gt: 0 }).withMessage('ID de pago inválido.'),
    // Opcional: Validar query params de fecha (periodo, fecha_pago)
    // query('fechaDesde').optional().isISO8601().toDate(),
    // query('fechaHasta').optional().isISO8601().toDate().custom(...)
];

module.exports = {
    validateCreatePago,
    validateGetPagos
};