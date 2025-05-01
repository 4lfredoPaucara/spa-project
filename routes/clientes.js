// routes/clientes.js (Adaptado)
const express = require('express');
const router = express.Router();

// Importar Controladores (Adaptados)
const clienteController = require('../controllers/clienteController');

// Importar Validadores (Adaptados)
const {
    validateCreateCliente,
    validateUpdateCliente,
    validateParamId
} = require('../validators/clienteValidator');

// Importar Middleware de Manejo de Errores de Validación
const { handleValidationErrors } = require('../middlewares/validationMiddleware');
// const { protect, authorize } = require('../middlewares/authMiddleware'); // Descomentar luego

// --- Definición de Rutas ---

// GET /clientes – obtener todos los usuarios con rol 'cliente'
router.get('/',
    // protect, authorize(['admin', 'recepcionista']),
    clienteController.getAllClientes
);

// GET /clientes/:id – obtener un cliente específico por ID de usuario
router.get('/:id',
    // protect, authorize(['admin', 'recepcionista']),
    validateParamId,
    handleValidationErrors,
    clienteController.getClienteById
);

// POST /clientes – agregar un nuevo cliente (crea usuario con rol 'cliente')
router.post('/',
    // protect, authorize(['admin', 'recepcionista']), // Quién puede crear clientes
    validateCreateCliente,
    handleValidationErrors,
    clienteController.createCliente
);

// PATCH /clientes/:id – actualizar parcialmente un cliente
router.patch('/:id',
    // protect, authorize(['admin', 'recepcionista']),
    validateUpdateCliente,
    handleValidationErrors,
    clienteController.updateCliente
);

// DELETE /clientes/:id – eliminar un cliente (elimina usuario con rol 'cliente')
router.delete('/:id',
    // protect, authorize(['admin']), // Solo admin borra permanentemente
    validateParamId,
    handleValidationErrors,
    clienteController.deleteCliente
);

module.exports = router;