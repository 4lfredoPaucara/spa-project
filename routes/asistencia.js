// routes/asistencia.js
const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistenciaController');
const { validateRegistroAsistencia, validateGetAsistencia } = require('../validators/asistenciaValidator');
const { handleValidationErrors } = require('../middlewares/validationMiddleware');
// const { protect, authorize } = require('../middlewares/authMiddleware'); // Descomentar luego

// --- Rutas de Asistencia ---

// POST /asistencia/empleado/:empleadoId/entrada - Registrar entrada (ej. admin por empleado)
// O podrías tener POST /asistencia/entrada si el empleado está logueado y obtienes el ID del token
router.post('/empleado/:empleadoId/entrada',
    // protect, authorize(['admin', 'recepcionista']), // Quién puede registrar por otros
    validateRegistroAsistencia, // Valida :empleadoId y notas opcionales
    handleValidationErrors,
    asistenciaController.registrarEntrada
);

// POST /asistencia/empleado/:empleadoId/salida - Registrar salida (ej. admin por empleado)
// O POST /asistencia/salida si el empleado está logueado
router.post('/empleado/:empleadoId/salida',
    // protect, authorize(['admin', 'recepcionista']),
    validateRegistroAsistencia, // Valida :empleadoId y notas opcionales
    handleValidationErrors,
    asistenciaController.registrarSalida
);

// GET /asistencia/empleado/:empleadoId - Obtener registros de un empleado (admin/recepcionista)
router.get('/empleado/:empleadoId',
    // protect, authorize(['admin', 'recepcionista']),
    validateGetAsistencia, // Valida :empleadoId y opcionalmente query params de fecha
    handleValidationErrors,
    asistenciaController.getRegistrosEmpleado
);

// GET /asistencia/me - (Opcional) Ruta para que un empleado vea sus propios registros
// router.get('/me',
//    protect, authorize(['terapeuta', 'recepcionista', 'admin']), // Empleados pueden ver lo suyo
//    // Aquí el controlador obtendría el empleadoId de req.user
//    asistenciaController.getMyRegistros // Necesitarías crear este controlador
// );

module.exports = router;