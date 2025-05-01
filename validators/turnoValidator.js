const { body, param, check } = require('express-validator');
const db = require('../db'); // Asegúrate que la ruta a db.js es correcta

// --- Constantes ---
const ESTADOS_VALIDOS = ['pendiente', 'confirmado', 'cancelado', 'atendido', 'reprogramado'];
const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/; // Formato HH:MM o HH:MM:SS

// --- Funciones Auxiliares para Validación Async ---
// (Estas verifican si los IDs existen en sus respectivas tablas)

const clienteExists = async (id_cliente) => {
  if (!id_cliente) return false;
  const sql = 'SELECT 1 FROM clientes WHERE id = ? LIMIT 1';
  try {
    const [results] = await db.query(sql, [id_cliente]);
    return results.length > 0;
  } catch (error) {
    console.error("Error verificando cliente:", error);
    return false; // Asumir que no existe si hay error de BD
  }
};

const servicioExists = async (id_servicio) => {
  if (!id_servicio) return false;
  const sql = 'SELECT 1 FROM servicios WHERE id = ? LIMIT 1';
   try {
    const [results] = await db.query(sql, [id_servicio]);
    return results.length > 0;
  } catch (error) {
    console.error("Error verificando servicio:", error);
    return false; // Asumir que no existe si hay error de BD
  }
};

// --- Reglas de Validación para cada Ruta ---

// Validación para Crear un Turno (POST /turnos)
const validateCreateTurno = [
  body('id_cliente')
    .notEmpty().withMessage('El ID del cliente es requerido.')
    .isInt({ gt: 0 }).withMessage('El ID del cliente debe ser un entero positivo.')
    .bail() // Detener si no es entero antes de consultar BD
    .custom(async (value) => {
      const exists = await clienteExists(value);
      if (!exists) {
        throw new Error(`El cliente con ID ${value} no existe.`);
      }
      return true;
    }),
  body('id_servicio')
    .notEmpty().withMessage('El ID del servicio es requerido.')
    .isInt({ gt: 0 }).withMessage('El ID del servicio debe ser un entero positivo.')
    .bail()
    .custom(async (value) => {
      const exists = await servicioExists(value);
      if (!exists) {
        throw new Error(`El servicio con ID ${value} no existe.`);
      }
      return true;
    }),
  body('fecha')
    .notEmpty().withMessage('La fecha es requerida.')
    .isISO8601().withMessage('La fecha debe estar en formato YYYY-MM-DD.'),
    // .toDate(), // Descomentar si el controlador necesita un objeto Date
  body('hora')
    .notEmpty().withMessage('La hora es requerida.')
    .matches(HORA_REGEX).withMessage('La hora debe estar en formato HH:MM o HH:MM:SS.')
];

// Validación para Reprogramar un Turno (PUT /turnos/:id)
const validateReprogramTurno = [
  param('id').isInt({ gt: 0 }).withMessage('El ID del turno en la URL debe ser un entero positivo.'),
  body('nuevaFecha') // Cambiamos el nombre aquí para coincidir con el controlador
    .notEmpty().withMessage('La nueva fecha es requerida.')
    .isISO8601().withMessage('La nueva fecha debe estar en formato YYYY-MM-DD.'),
    // .toDate(),
  body('nuevaHora') // Cambiamos el nombre aquí
    .notEmpty().withMessage('La nueva hora es requerida.')
    .matches(HORA_REGEX).withMessage('La nueva hora debe estar en formato HH:MM o HH:MM:SS.'),
  body('costoExtraManual')
    .optional({ nullable: true })
    .isDecimal({ decimal_digits: '1,2' }).withMessage('El costo extra debe ser un número decimal (ej: 50.00).')
    .toFloat()
];

// Validación para Actualizar Parcialmente un Turno (PATCH /turnos/:id)
const validateUpdateTurno = [
  param('id').isInt({ gt: 0 }).withMessage('El ID del turno en la URL debe ser un entero positivo.'),
  // Todos los campos del cuerpo son opcionales en PATCH
  body('estado')
    .optional()
    .isIn(ESTADOS_VALIDOS)
    .withMessage(`Estado inválido. Permitidos: ${ESTADOS_VALIDOS.join(', ')}`),
  body('costo_extra')
    .optional({ nullable: true })
    .isDecimal({ decimal_digits: '1,2' }).withMessage('El costo extra debe ser un número decimal (ej: 50.00).')
    .toFloat(),
  body('motivo_extra')
    .optional({ nullable: true })
    .isString().withMessage('El motivo extra debe ser texto.')
    .trim()
    .isLength({ max: 100 }).withMessage('El motivo extra no puede exceder los 100 caracteres.'),
  body('fecha') // Permitir actualizar fecha via PATCH también
    .optional()
    .isISO8601().withMessage('La fecha debe estar en formato YYYY-MM-DD.'),
    // .toDate(),
  body('hora') // Permitir actualizar hora via PATCH
    .optional()
    .matches(HORA_REGEX).withMessage('La hora debe estar en formato HH:MM o HH:MM:SS.'),
  // Añadir validación para otros campos si son actualizables via PATCH
  // body('id_cliente').optional().isInt(...).custom(clienteExists)...
  // body('id_servicio').optional().isInt(...).custom(servicioExists)...

  // Verificación extra: Asegurarse que al menos un campo válido se está enviando
  check().custom((value, { req }) => { // 'check()' revisa todo (params, body, query)
     const updates = req.body;
     const allowedFields = ['estado', 'costo_extra', 'motivo_extra', 'fecha', 'hora']; // Campos permitidos en PATCH
     const validUpdates = Object.keys(updates).some(key => allowedFields.includes(key));
     if (!validUpdates && Object.keys(updates).length > 0) { // Si se envió body pero nada válido
         throw new Error(`Campos no permitidos para actualización PATCH. Permitidos: ${allowedFields.join(', ')}`);
     } else if (Object.keys(updates).length === 0) { // Si no se envió nada en el body
        throw new Error('No se proporcionaron campos para actualizar.');
     }
     return true;
  }).withMessage('No se proporcionaron campos válidos para actualizar.') // Mensaje genérico
  // Comentado porque la lógica del controlador ya verifica si `updates.length > 0`
];

// Validación para rutas que solo necesitan el ID del parámetro (GET/:id, DELETE/:id)
const validateParamId = [
  param('id').isInt({ gt: 0 }).withMessage('El ID del turno en la URL debe ser un entero positivo.')
];


// Exportar todas las validaciones
module.exports = {
  validateCreateTurno,
  validateReprogramTurno,
  validateUpdateTurno,
  validateParamId
};
