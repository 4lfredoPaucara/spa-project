// routes/historial.js
const express = require('express');
const router = express.Router();

// --- Importaciones ---
const historialController = require('../controllers/historialController'); // Ajusta ruta
const {
  validateCreateHistorial,
  validateUpdateHistorial,
  validateHistorialParamId,
  validateClienteParamId // Validador para el ID de cliente en la ruta
} = require('../validators/historialValidator'); // Ajusta ruta
const { handleValidationErrors } = require('../middlewares/validationMiddleware'); // Ajusta ruta

// --- Definición de Rutas ---

// POST /historiales - Crear nueva entrada de historial
router.post('/',
  validateCreateHistorial,
  handleValidationErrors,
  historialController.createHistorial
);

// GET /historiales/cliente/:clienteId - Obtener historial por ID de cliente
router.get('/cliente/:clienteId',
  validateClienteParamId, // Validar el ID del cliente en la URL
  handleValidationErrors,
  historialController.getHistorialByCliente
);

// GET /historiales/:id - Obtener una entrada de historial por su ID
router.get('/:id',
  validateHistorialParamId, // Validar el ID del historial en la URL
  handleValidationErrors,
  historialController.getHistorialById
);

// PATCH /historiales/:id - Actualizar una entrada de historial
router.patch('/:id',
  validateUpdateHistorial, // Valida ID en URL y cuerpo opcional
  handleValidationErrors,
  historialController.updateHistorial
);

// DELETE /historiales/:id - Eliminar una entrada de historial
router.delete('/:id',
  validateHistorialParamId, // Validar el ID del historial en la URL
  handleValidationErrors,
  historialController.deleteHistorial
);

module.exports = router;