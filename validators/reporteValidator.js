// validators/reporteValidator.js
const { query, param } = require('express-validator');

// Validación reutilizable para rangos de fechas en query params
const validateDateRange = [
    query('fechaDesde')
        .optional() // Hacerlo opcional
        .isISO8601().withMessage('fechaDesde debe estar en formato YYYY-MM-DD.'),
        // .toDate(), // Convertir si necesitas objeto Date en el controlador
    query('fechaHasta')
        .optional()
        .isISO8601().withMessage('fechaHasta debe estar en formato YYYY-MM-DD.')
        // .toDate()
        .custom((value, { req }) => {
            if (value && req.query.fechaDesde && value < req.query.fechaDesde) {
                throw new Error('fechaHasta no puede ser anterior a fechaDesde.');
            }
            return true;
        })
];

// Validación específica si un reporte necesita ID de empleado (como el de asistencia)
const validateReporteEmpleadoParams = [
    param('empleadoId') // Asumiendo que el ID va en la URL /reportes/asistencia/:empleadoId
        .notEmpty().withMessage('El ID del empleado es requerido en la URL.')
        .isInt({ gt: 0 }).withMessage('ID de empleado inválido.'),
    // Incluir validación de fechas si aplica a este reporte específico
    ...validateDateRange // Reutilizar la validación de fechas del query
];


module.exports = {
    validateDateRange,
    validateReporteEmpleadoParams
};