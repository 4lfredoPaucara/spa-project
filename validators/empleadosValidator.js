// validators/empleadoValidator.js
const { body, param } = require('express-validator');
const db = require('../db'); // Ajusta ruta

// --- Funciones Auxiliares (Reutilizadas/Adaptadas) ---
const emailExists = async (email, excludeUserId = null) => {
  if (!email) return false;
  let sql = 'SELECT 1 FROM usuarios WHERE email = ?';
  const params = [email];
  if (excludeUserId) {
    sql += ' AND id != ?'; // Excluir al usuario actual al verificar en actualizaciones
    params.push(excludeUserId);
  }
  sql += ' LIMIT 1';
  try {
    const [results] = await db.query(sql, params);
    return results.length > 0;
  } catch (error) { console.error("Error verificando email:", error); return false; }
};

const servicioExists = async (id_servicio) => {
  if (!id_servicio) return false;
  const sql = 'SELECT 1 FROM servicios WHERE id = ? LIMIT 1';
   try { const [r] = await db.query(sql, [id_servicio]); return r.length > 0; }
   catch (e) { console.error("Error verificando servicio:", e); return false; }
};

// --- Reglas de Validación ---

// Validación para Crear un Empleado (POST /empleados)
const validateCreateEmpleado = [
  // Campos para la tabla 'usuarios'
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido.').isLength({ max: 100 }),
  body('email')
    .trim().notEmpty().withMessage('El correo es requerido.').isEmail().withMessage('Correo inválido.')
    .normalizeEmail()
    .custom(async (value) => {
      if (await emailExists(value)) { throw new Error('El correo electrónico ya está registrado.'); }
      return true;
    }),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida.')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
  body('rol')
    .notEmpty().withMessage('El rol es requerido para un empleado.')
    .isIn(['admin', 'recepcionista', 'terapeuta']) // Roles permitidos para empleados
    .withMessage('Rol inválido para empleado (permitidos: admin, recepcionista, terapeuta).'),
  body('telefono').optional({ nullable: true }).trim().isLength({ min: 7, max: 20 }),

  // Campos para la tabla 'empleados'
  body('especialidad').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('activo').optional().isBoolean().withMessage('Activo debe ser true o false.')
];

// Validación para Actualizar un Empleado (PATCH /empleados/:id)
const validateUpdateEmpleado = [
  param('id').isInt({ gt: 0 }).withMessage('El ID del empleado en la URL debe ser un entero positivo.'),
  // Campos opcionales para 'usuarios'
  body('nombre').optional().trim().notEmpty().isLength({ max: 100 }),
  body('email').optional().trim().isEmail().normalizeEmail()
    .custom(async (value, { req }) => { // Verificar unicidad excepto para el usuario actual
        // Necesitamos obtener el id_usuario asociado a este empleado_id para excluirlo
        const empleadoId = req.params.id;
        const sqlUser = 'SELECT id_usuario FROM empleados WHERE id = ?';
        const [emp] = await db.query(sqlUser, [empleadoId]);
        const excludeUserId = emp.length > 0 ? emp[0].id_usuario : null;

        if (await emailExists(value, excludeUserId)) {
            throw new Error('El correo electrónico ya está en uso por otro usuario.');
        }
        return true;
    }),
  body('telefono').optional({ nullable: true }).trim().isLength({ min: 7, max: 20 }),
  // Nota: Cambiar password o rol usualmente requiere endpoints/lógica separada por seguridad

  // Campos opcionales para 'empleados'
  body('especialidad').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('activo').optional().isBoolean().withMessage('Activo debe ser true o false.')
];

// Validación para Asignar/Desasignar Servicio
const validateAssignServicio = [
    param('id').isInt({ gt: 0 }).withMessage('El ID del empleado debe ser un entero positivo.'),
    // Para POST, el ID del servicio viene en el body
    body('id_servicio').optional().isInt({ gt: 0 }).withMessage('El ID del servicio debe ser un entero positivo.')
        .custom(async (value) => {
            if (value && !(await servicioExists(value))) {
                throw new Error(`El servicio con ID ${value} no existe.`);
            }
            return true;
        }),
    // Para DELETE, el ID del servicio viene en el param
    param('servicioId').optional().isInt({ gt: 0 }).withMessage('El ID del servicio en la URL debe ser un entero positivo.')
        .custom(async (value) => {
            if (value && !(await servicioExists(value))) {
                 throw new Error(`El servicio con ID ${value} no existe.`);
            }
            return true;
        })
];

// Validación para parámetro de ID de empleado
const validateParamId = [
  param('id').isInt({ gt: 0 }).withMessage('El ID del empleado debe ser un entero positivo.')
];

module.exports = {
  validateCreateEmpleado,
  validateUpdateEmpleado,
  validateAssignServicio,
  validateParamId
};