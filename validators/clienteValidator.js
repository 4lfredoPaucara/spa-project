// validators/clienteValidator.js (Adaptado para tabla usuarios con rol=cliente)
const { body, param } = require('express-validator');
const db = require('../db'); // Ajusta ruta

// Reutilizar helper para verificar email (excluyendo un ID específico al actualizar)
const emailExists = async (email, excludeUserId = null) => {
  // ... (código de emailExists como en empleadoValidator) ...
  if (!email) return false;
  let sql = 'SELECT 1 FROM usuarios WHERE email = ?';
  const params = [email];
  if (excludeUserId) {
    sql += ' AND id != ?';
    params.push(excludeUserId);
  }
  sql += ' LIMIT 1';
  try {
    const [results] = await db.query(sql, params);
    return results.length > 0;
  } catch (error) { console.error("Error verificando email:", error); return false; }
};

// Reutilizar helper para verificar teléfono (excluyendo un ID específico al actualizar)
const telefonoExists = async (telefono, excludeUserId = null) => {
    if (!telefono) return false;
    let sql = 'SELECT 1 FROM usuarios WHERE telefono = ?';
    const params = [telefono];
    if (excludeUserId) {
        sql += ' AND id != ?';
        params.push(excludeUserId);
    }
    sql += ' LIMIT 1';
    try {
        const [results] = await db.query(sql, params);
        return results.length > 0;
    } catch (error) { console.error("Error verificando teléfono:", error); return false; }
};


// Validación para Crear un Cliente (en tabla Usuarios)
const validateCreateCliente = [
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido.').isLength({ max: 100 }),
  body('email') // Email es requerido y único para todos los usuarios
    .trim().notEmpty().withMessage('El correo es requerido.').isEmail().normalizeEmail()
    .custom(async (value) => {
      if (await emailExists(value)) { throw new Error('El correo electrónico ya está registrado.'); }
      return true;
    }),
  body('password') // Requerido para que el cliente pueda loguearse
    .notEmpty().withMessage('La contraseña es requerida.')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
  body('telefono') // Teléfono requerido y único para clientes
    .trim().notEmpty().withMessage('El teléfono es requerido.')
    .isLength({ min: 7, max: 20 })
    .custom(async (value) => {
        if (await telefonoExists(value)) { throw new Error('El teléfono ya está registrado.'); }
        return true;
    }),
  body('fecha_nacimiento').optional({ nullable: true }).isISO8601().toDate(),
  body('sexo').optional({ nullable: true }).isIn(['Masculino', 'Femenino', 'Otro'])
  // No validamos 'rol' aquí, el controlador lo forzará a 'cliente'
];

// Validación para Actualizar un Cliente (PATCH /clientes/:id)
const validateUpdateCliente = [
  param('id').isInt({ gt: 0 }).withMessage('El ID del cliente (usuario) en la URL debe ser un entero positivo.'),
  body('nombre').optional().trim().notEmpty().isLength({ max: 100 }),
  body('email').optional().trim().isEmail().normalizeEmail()
    .custom(async (value, { req }) => {
        if (await emailExists(value, req.params.id)) { // Excluir el ID actual
            throw new Error('El correo electrónico ya está en uso por otro usuario.');
        }
        return true;
    }),
  body('telefono').optional().trim().notEmpty().isLength({ min: 7, max: 20 })
     .custom(async (value, { req }) => {
        if (await telefonoExists(value, req.params.id)) { // Excluir el ID actual
            throw new Error('El teléfono ya está registrado por otro usuario.');
        }
        return true;
    }),
  body('fecha_nacimiento').optional({ nullable: true }).isISO8601().toDate(),
  body('sexo').optional({ nullable: true }).isIn(['Masculino', 'Femenino', 'Otro', null])
  // No permitir cambiar rol o password desde aquí (requiere otra ruta/permisos)
];

// Validación para parámetro de ID de cliente (usuario)
const validateParamId = [
  param('id').isInt({ gt: 0 }).withMessage('El ID del cliente (usuario) debe ser un entero positivo.')
];

module.exports = {
  validateCreateCliente,
  validateUpdateCliente,
  validateParamId
};