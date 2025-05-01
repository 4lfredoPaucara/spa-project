// validators/asistenciaValidator.js
const { body, param } = require('express-validator');
const db = require('../db'); // Ajusta ruta

// Función auxiliar para verificar si un empleado existe (puedes moverla a utils/dbHelpers.js)
const empleadoExists = async (id_empleado) => {
    if (!id_empleado) return false;
    const sql = 'SELECT 1 FROM empleados WHERE id = ? LIMIT 1';
    try { const [r] = await db.query(sql, [id_empleado]); return r.length > 0; }
    catch (e) { console.error("Error verificando empleado:", e); return false; }
};

// Validación para Registrar Entrada/Salida
const validateRegistroAsistencia = [
    // Asumimos que id_empleado viene como parámetro en la URL (ej: /asistencia/empleado/:empleadoId/entrada)
    // O se obtiene del usuario autenticado (req.user.empleadoId - se vería en el controlador)
    param('empleadoId') // Validar el ID si viene en la URL
        .optional() // Hacerlo opcional si se obtiene del token JWT
        .isInt({ gt: 0 }).withMessage('El ID del empleado debe ser un entero positivo.')
        .custom(async (value) => {
            if (value && !(await empleadoExists(value))) {
                throw new Error(`El empleado con ID ${value} no existe.`);
            }
            return true;
        }),
    body('notas')
        .optional({ nullable: true })
        .isString().withMessage('Las notas deben ser texto.')
        .trim()
        .isLength({ max: 255 }).withMessage('Las notas no pueden exceder los 255 caracteres.')
];

// Validación para Obtener Registros (GET /asistencia/empleado/:empleadoId)
const validateGetAsistencia = [
     param('empleadoId')
        .notEmpty().withMessage('El ID del empleado es requerido en la URL.')
        .isInt({ gt: 0 }).withMessage('El ID del empleado debe ser un entero positivo.')
        .custom(async (value) => { // Opcional: verificar si el empleado existe
            if (!(await empleadoExists(value))) {
                 throw new Error(`El empleado con ID ${value} no existe.`);
            }
            return true;
        }),
    // Opcional: Validar query params de fecha si los implementas
    // query('fechaDesde').optional().isISO8601().toDate(),
    // query('fechaHasta').optional().isISO8601().toDate().custom(...)
];


module.exports = {
  validateRegistroAsistencia,
  validateGetAsistencia
};