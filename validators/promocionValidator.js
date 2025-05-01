// validators/promocionValidator.js
const { body, param } = require('express-validator');
const db = require('../db'); // Ajusta ruta

// Reutilizar o importar helper si existe
const servicioExists = async (id_servicio) => {
  if (!id_servicio) return true; // Es opcional, si no viene, es válido
  const sql = 'SELECT 1 FROM servicios WHERE id = ? LIMIT 1';
  try { const [r] = await db.query(sql, [id_servicio]); return r.length > 0; }
  catch (e) { console.error(e); return false; }
};

const validateCreatePromocion = [
  body('titulo').trim().notEmpty().withMessage('El título es requerido.').isLength({ max: 150 }),
  body('descripcion').optional({ nullable: true }).trim().isLength({ max: 65535 }),
  // imagen_url se maneja en el controlador después de la subida
  body('fecha_inicio').optional({ nullable: true }).isISO8601().withMessage('Formato YYYY-MM-DD.'),
  body('fecha_fin').optional({ nullable: true }).isISO8601().withMessage('Formato YYYY-MM-DD.')
    .custom((value, { req }) => { // Fecha fin debe ser >= fecha inicio si ambas existen
      if (value && req.body.fecha_inicio && value < req.body.fecha_inicio) {
        throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio.');
      }
      return true;
    }),
  body('codigo_descuento').optional({ nullable: true }).trim().isLength({ max: 50 }),
  body('tipo_descuento').optional({ nullable: true }).isIn(['porcentaje', 'fijo']).withMessage("Tipo de descuento inválido ('porcentaje' o 'fijo')."),
  body('valor_descuento').optional({ nullable: true })
    .isDecimal({ decimal_digits: '1,2' }).withMessage('Valor de descuento debe ser decimal.')
    .toFloat()
    .custom((value, { req }) => { // Validar valor según tipo
      if (req.body.tipo_descuento === 'porcentaje' && (value <= 0 || value > 100)) {
        throw new Error('El descuento porcentual debe estar entre 0 (exclusivo) y 100.');
      }
      if (req.body.tipo_descuento === 'fijo' && value <= 0) {
         throw new Error('El descuento fijo debe ser mayor a 0.');
      }
      // Requerir valor si se especifica tipo
      if (req.body.tipo_descuento && (value === null || value === undefined)) {
          throw new Error('Se requiere un valor de descuento si se especifica el tipo.');
      }
      // Requerir tipo si se especifica valor
       if (!req.body.tipo_descuento && value !== null && value !== undefined) {
          throw new Error('Se requiere un tipo de descuento (porcentaje/fijo) si se especifica un valor.');
      }
      return true;
    }),
  body('aplica_a').optional().isIn(['todos', 'servicio_especifico', 'categoria', 'cumpleanos']) // Ajusta según necesites
    .withMessage("Valor inválido para 'aplica_a'."),
  body('id_servicio_aplicable').optional({ nullable: true })
    .isInt({ gt: 0 }).withMessage('ID de servicio aplicable inválido.')
    .bail()
    .custom(async (value, { req }) => {
      if (req.body.aplica_a === 'servicio_especifico' && !value) {
        throw new Error('Se requiere id_servicio_aplicable si aplica_a es "servicio_especifico".');
      }
      if (value && !(await servicioExists(value))) {
        throw new Error(`El servicio aplicable con ID ${value} no existe.`);
      }
      // Asegurar que no se envíe si no aplica
      if (req.body.aplica_a !== 'servicio_especifico' && value) {
           throw new Error('No se debe enviar id_servicio_aplicable si aplica_a no es "servicio_especifico".');
      }
      return true;
    }),
  body('activo').optional().isBoolean().withMessage('Activo debe ser true o false.')
];

const validateUpdatePromocion = [
  param('id').isInt({ gt: 0 }).withMessage('El ID de la promoción debe ser un entero positivo.'),
  // Validaciones opcionales (similares a create pero con .optional())
  body('titulo').optional().trim().notEmpty().isLength({ max: 150 }),
  body('descripcion').optional({ nullable: true }).trim().isLength({ max: 65535 }),
  body('fecha_inicio').optional({ nullable: true }).isISO8601(),
  body('fecha_fin').optional({ nullable: true }).isISO8601().custom((value, { req }) => { /* ... validación fecha fin >= fecha inicio ... */ return true; }),
  body('codigo_descuento').optional({ nullable: true }).trim().isLength({ max: 50 }),
  body('tipo_descuento').optional({ nullable: true }).isIn(['porcentaje', 'fijo']),
  body('valor_descuento').optional({ nullable: true }).isDecimal().toFloat().custom((value, { req }) => { /* ... validación valor vs tipo ... */ return true; }),
  body('aplica_a').optional().isIn(['todos', 'servicio_especifico', 'categoria', 'cumpleanos']),
  body('id_servicio_aplicable').optional({ nullable: true }).isInt({ gt: 0 }).custom(async (value, { req }) => { /* ... validación existencia y coherencia con aplica_a ... */ return true; }),
  body('activo').optional().isBoolean()
];

const validateParamId = [
  param('id').isInt({ gt: 0 }).withMessage('El ID de la promoción debe ser un entero positivo.')
];

module.exports = {
  validateCreatePromocion,
  validateUpdatePromocion,
  validateParamId
};