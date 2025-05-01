// routes/cobros.js
const express = require('express');
const router = express.Router();
const cobroController = require('../controllers/cobroController');
const { validateRegistrarPago, validateGetCobros /*, validateCreateCobroManual */ } = require('../validators/cobroValidator');
const { handleValidationErrors } = require('../middlewares/validationMiddleware');
// const { protect, authorize } = require('../middlewares/authMiddleware');

// --- Rutas de Cobros (Proteger) ---

// PATCH /cobros/:id/registrar-pago - Ruta principal para registrar adelanto o pago final
router.patch('/:id/registrar-pago',
    // protect, authorize(['admin', 'recepcionista']),
    validateRegistrarPago,
    handleValidationErrors,
    cobroController.registrarPago
);

// GET /cobros/:id - Obtener detalles de un cobro específico
router.get('/:id',
    // protect, authorize(['admin', 'recepcionista']),
    // No necesita validateParamId aquí porque ya está en validateRegistrarPago
    // Pero sí lo necesitaría si esta ruta fuera independiente
    cobroController.getCobroById
);

// GET /cobros/turno/:turnoId - Obtener el cobro asociado a un turno
router.get('/turno/:turnoId',
    // protect, authorize(['admin', 'recepcionista']),
    validateGetCobros, // Valida :turnoId
    handleValidationErrors,
    cobroController.getCobroByTurnoId
);

// GET /cobros - Obtener lista de todos los cobros (con filtros opcionales)
router.get('/',
     // protect, authorize(['admin', 'recepcionista']),
    cobroController.getAllCobros // Asume que el controlador maneja query params sin validación estricta por ahora
);

// POST /cobros - (Opcional) Crear cobro manualmente si no se hace con el turno
// router.post('/',
//     // protect, authorize(['admin']),
//     validateCreateCobroManual,
//     handleValidationErrors,
//     cobroController.createCobroManual
// );


module.exports = router;