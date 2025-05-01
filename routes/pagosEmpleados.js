// routes/pagosEmpleados.js
const express = require('express');
const router = express.Router();
const pagoEmpleadoController = require('../controllers/pagoEmpleadoController');
const { validateCreatePago, validateGetPagos } = require('../validators/pagoEmpleadoValidator');
const { handleValidationErrors } = require('../middlewares/validationMiddleware');
// const { protect, authorize } = require('../middlewares/authMiddleware');

// --- Rutas de Pagos a Empleados (Proteger) ---

// POST /pagos-empleados - Registrar un nuevo pago
router.post('/',
    // protect, authorize(['admin', 'recepcionista']), // Roles que pueden registrar pagos
    validateCreatePago,
    handleValidationErrors,
    pagoEmpleadoController.createPagoEmpleado
);

// GET /pagos-empleados - Obtener todos los pagos (con filtros opcionales)
router.get('/',
    // protect, authorize(['admin', 'recepcionista']),
    validateGetPagos, // Valida posibles filtros si los implementas estrictamente
    handleValidationErrors,
    pagoEmpleadoController.getAllPagos
);

// GET /pagos-empleados/:pagoId - Obtener un pago específico
router.get('/:pagoId',
    // protect, authorize(['admin', 'recepcionista']),
    validateGetPagos, // Valida :pagoId
    handleValidationErrors,
    pagoEmpleadoController.getPagoById
);

// GET /pagos-empleados/empleado/:empleadoId - Obtener pagos de un empleado específico
router.get('/empleado/:empleadoId',
    // protect, authorize(['admin', 'recepcionista']), // O permitir al empleado ver los suyos
    validateGetPagos, // Valida :empleadoId
    handleValidationErrors,
    pagoEmpleadoController.getPagosByEmpleadoId
);

// --- Rutas Opcionales (Descomentar si implementas los controladores) ---
// PATCH /pagos-empleados/:pagoId - Actualizar un pago (requiere validador)
// router.patch('/:pagoId', /* protect, authorize(...), validateUpdatePago, handleValidationErrors, */ pagoEmpleadoController.updatePagoEmpleado);

// DELETE /pagos-empleados/:pagoId - Eliminar un pago (requiere validador)
// router.delete('/:pagoId', /* protect, authorize(...), validateGetPagos, handleValidationErrors, */ pagoEmpleadoController.deletePagoEmpleado);


module.exports = router;