// validators/authValidator.js
const { body } = require('express-validator');
const db = require('../db'); // Ajusta la ruta

// --- Funciones Auxiliares ---
// (Podrías mover esto a utils/dbHelpers.js si lo usas en varios validadores)

// Verificar si el email ya existe en la base de datos
const emailExists = async (email) => {
  if (!email) return false;
  const sql = 'SELECT 1 FROM usuarios WHERE email = ? LIMIT 1';
  try {
    const [results] = await db.query(sql, [email]);
    return results.length > 0;
  } catch (error) { console.error("Error verificando email:", error); return false; }
};


// Verificar si el username ya existe en la base de datos
const usernameExists = async (username) => {
  if (!username) return false;
  const sql = 'SELECT 1 FROM usuarios WHERE username = ? LIMIT 1';
  try {
    const [results] = await db.query(sql, [username]);
    return results.length > 0;
  } catch (error) { console.error("Error verificando username:", error); return false; }
};

// --- Reglas de Validación ---

// Validación para el Registro (POST /auth/register)
const validateRegister = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido.')
    .isLength({ max: 100 }).withMessage('El nombre no puede exceder los 100 caracteres.'),
  body('username')
    .trim()
    .notEmpty().withMessage('El usuario es requerido.')
    .isLength({ max: 100 }).withMessage('El usuario no puede exceder los 100 caracteres.')
    .custom(async (value) => { // Verificar si el usuario ya está en uso
      if (await usernameExists(value)) {
        throw new Error('El nombre de usuario ya está registrado.');
      }
      return true;
    }),
  body('email')
    .trim()
    .notEmpty().withMessage('El correo electrónico es requerido.')
    .isEmail().withMessage('Debe ser un correo electrónico válido.')
    .normalizeEmail()
    .custom(async (value) => { // Verificar si el email ya está en uso
      if (await emailExists(value)) {
        throw new Error('El correo electrónico ya está registrado.');
      }
      return true;
    }),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida.')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
    // Podrías añadir más complejidad aquí (mayúsculas, números, símbolos) si lo deseas
    // .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)
    // .withMessage('La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número.'),
  body('rol')
    .optional() // Hacer el rol opcional, usará el DEFAULT de la BD si no se envía
    .isIn(['admin', 'recepcionista', 'terapeuta']) // Asegurar que el rol sea uno de los válidos
    .withMessage('Rol inválido.')
];

// Validación para el Login (POST /auth/login)
const validateLogin = [
  // body('email')
  //   .trim()
  //   .notEmpty().withMessage('El correo electrónico es requerido.')
  //   .isEmail().withMessage('Debe ser un correo electrónico válido.')
  //   .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida.')
];

module.exports = {
  validateRegister,
  validateLogin
};