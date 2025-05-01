// routes/reportes.js
const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { validateDateRange, validateReporteEmpleadoParams } = require('../validators/reporteValidator');
const { handleValidationErrors } = require('../middlewares/validationMiddleware');
// const { protect, authorize } = require('../middlewares/authMiddleware');

// --- Rutas de Reportes (Proteger) ---

// GET /reportes/rendimiento-empleados?fechaDesde=YYYY-MM-DD&fechaHasta=YYYY-MM-DD
router.get('/rendimiento-empleados',
    // protect, authorize(['admin', 'recepcionista']),
    validateDateRange, // Valida fechas opcionales
    handleValidationErrors,
    reporteController.getRendimientoEmpleados
);

// GET /reportes/ingresos?fechaDesde=YYYY-MM-DD&fechaHasta=YYYY-MM-DD
router.get('/ingresos',
    // protect, authorize(['admin', 'recepcionista']),
    validateDateRange,
    handleValidationErrors,
    reporteController.getIngresosResumen
);

// GET /reportes/servicios-populares?fechaDesde=YYYY-MM-DD&fechaHasta=YYYY-MM-DD&estadoTurno=atendido
router.get('/servicios-populares',
    // protect, authorize(['admin', 'recepcionista']),
    validateDateRange, // estadoTurno no se valida estrictamente aquí, se maneja en controller
    handleValidationErrors,
    reporteController.getServiciosPopulares
);

// GET /reportes/asistencia/:empleadoId?fechaDesde=YYYY-MM-DD&fechaHasta=YYYY-MM-DD
router.get('/asistencia/:empleadoId',
     // protect, authorize(['admin', 'recepcionista']), // O el propio empleado
     validateReporteEmpleadoParams, // Valida empleadoId y fechas
     handleValidationErrors,
     reporteController.getAsistenciaLog
);


module.exports = router;