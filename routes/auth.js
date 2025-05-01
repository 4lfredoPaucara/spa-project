// routes/auth.js
const express = require('express');
const router = express.Router();

// Importar Controladores de Autenticación
const authController = require('../controllers/authController'); // Ajusta ruta

// Importar Validadores de Autenticación
const { validateRegister, validateLogin } = require('../validators/authValidator'); // Ajusta ruta

// Importar Middleware de Manejo de Errores de Validación
const { handleValidationErrors } = require('../middlewares/validationMiddleware'); // Ajusta ruta

// --- Rutas de Autenticación ---

// POST /auth/register - Ruta para registrar un nuevo usuario
router.post('/register',
    validateRegister,       // 1. Validar los datos del cuerpo
    handleValidationErrors, // 2. Manejar errores de validación
    authController.register // 3. Ejecutar el controlador de registro
);

// POST /auth/login - Ruta para iniciar sesión
router.post('/login',
    validateLogin,          // 1. Validar email y password
    handleValidationErrors, // 2. Manejar errores de validación
    authController.login    // 3. Ejecutar el controlador de login
);


module.exports = router;