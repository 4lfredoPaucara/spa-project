// routes/servicios.js (Refactorizado para usar Controladores y Validadores)
const express = require('express');
const router = express.Router();

// --- Importar Controladores ---
const servicioController = require('../controllers/servicioController'); // Ajusta la ruta si es necesario

// --- Importar Validadores ---
// Asegúrate de que los nombres coincidan con los exportados en servicioValidator.js
const {
    validateCreateServicio,
    validateUpdateServicio,
    validateParamId
    // Importa otros validadores si los creaste (ej. para query params)
} = require('../validators/servicioValidator'); // Ajusta la ruta si es necesario

// --- Importar Middleware de Manejo de Errores de Validación ---
const { handleValidationErrors } = require('../middlewares/validationMiddleware'); // Ajusta la ruta si es necesario

// --- Definición de Rutas ---

// GET /servicios – obtener todos los servicios (con filtros opcionales)
// No necesita validación específica aquí a menos que valides los query params
router.get('/', servicioController.getAllServicios);

// GET /servicios/:id – obtener un servicio específico por ID
router.get('/:id',
    validateParamId,          // 1. Validar que el ID en la URL sea un entero positivo
    handleValidationErrors,   // 2. Manejar errores si la validación falla
    servicioController.getServicioById // 3. Ejecutar el controlador si el ID es válido
);

// POST /servicios – agregar un nuevo servicio (con posible subservicio)
router.post('/',
    validateCreateServicio,   // 1. Validar el cuerpo (nombre, precio, parent_id, etc.)
    handleValidationErrors,   // 2. Manejar errores de validación
    servicioController.createServicio // 3. Ejecutar el controlador
);

// PATCH /servicios/:id – actualizar parcialmente un servicio existente
router.patch('/:id',
    validateUpdateServicio,   // 1. Validar ID de param y campos opcionales del cuerpo
    handleValidationErrors,   // 2. Manejar errores de validación
    servicioController.updateServicio // 3. Ejecutar el controlador
);

// DELETE /servicios/:id – eliminar un servicio
router.delete('/:id',
    validateParamId,          // 1. Validar que el ID en la URL sea un entero positivo
    handleValidationErrors,   // 2. Manejar errores si la validación falla
    servicioController.deleteServicio // 3. Ejecutar el controlador (que tiene lógica adicional de verificación)
);


module.exports = router;