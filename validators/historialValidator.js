// validators/historialValidator.js
const { body, param } = require('express-validator');
const db = require('../db'); // Ajusta la ruta

// Reutilizar la función auxiliar (o moverla a un archivo utils/dbHelpers.js)
const clienteExists = async (id_cliente) => {
  if (!id_cliente) return false;
  const sql = 'SELECT 1 FROM clientes WHERE id = ? LIMIT 1';
  try {
    const [results] = await db.query(sql, [id_cliente]);
    return results.length > 0;
  } catch (error) { console.error("Error verificando cliente:", error); return false; }
};

// Validación para Crear un Historial (POST)
const validateCreateHistorial = [
  body('id_cliente')
    .notEmpty().withMessage('El ID del cliente es requerido.')
    .isInt({ gt: 0 }).withMessage('ID de cliente inválido.')
    .bail()
    .custom(async (value) => {
      if (!(await clienteExists(value))) {
        throw new Error(`El cliente con ID ${value} no existe.`);
      }
      return true;
    }),
  body('fecha')
    .notEmpty().withMessage('La fecha es requerida.')
    .isISO8601().withMessage('La fecha debe estar en formato YYYY-MM-DD.'),
    // .toDate(),
  body('diagnostico') // Hacerlo requerido si es necesario para tu lógica
    .optional({ nullable: true })
    .isString().withMessage('El diagnóstico debe ser texto.')
    .trim()
    .isLength({ max: 65535 }).withMessage('Diagnóstico demasiado largo.'), // Límite de TEXT
  body('tratamiento') // Hacerlo requerido si es necesario
    .optional({ nullable: true })
    .isString().withMessage('El tratamiento debe ser texto.')
    .trim()
    .isLength({ max: 65535 }),
  body('notas')
    .optional({ nullable: true })
    .isString().withMessage('Las notas deben ser texto.')
    .trim()
    .isLength({ max: 65535 }),
  body('archivo_url')
    .optional({ nullable: true })
    .isURL().withMessage('La URL del archivo no es válida.')
    .isLength({ max: 255 })
];

// Validación para Actualizar un Historial (PATCH /:id)
const validateUpdateHistorial = [
  param('id').isInt({ gt: 0 }).withMessage('El ID del historial en la URL debe ser un entero positivo.'),
  // Validaciones opcionales para los campos actualizables
  // NO permitir cambiar id_cliente normalmente
  body('fecha').optional().isISO8601().withMessage('Formato YYYY-MM-DD.'),
  body('diagnostico').optional({ nullable: true }).isString().trim().isLength({ max: 65535 }),
  body('tratamiento').optional({ nullable: true }).isString().trim().isLength({ max: 65535 }),
  body('notas').optional({ nullable: true }).isString().trim().isLength({ max: 65535 }),
  body('archivo_url').optional({ nullable: true }).isURL().isLength({ max: 255 })
  // Asegurarse que al menos un campo se envía (se puede hacer en el controlador o aquí)
];

// Validación para parámetros de ID (GET /:id, DELETE /:id)
const validateHistorialParamId = [
  param('id').isInt({ gt: 0 }).withMessage('El ID del historial debe ser un entero positivo.')
];

// Validación para parámetro de ID de cliente (GET /cliente/:clienteId)
const validateClienteParamId = [
  param('clienteId').isInt({ gt: 0 }).withMessage('El ID del cliente debe ser un entero positivo.')
];

module.exports = {
  validateCreateHistorial,
  validateUpdateHistorial,
  validateHistorialParamId,
  validateClienteParamId
};