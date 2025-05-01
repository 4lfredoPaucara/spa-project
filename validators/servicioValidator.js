const { body, param, validationResult, check } = require('express-validator'); // Importar check para validación personalizada

// Reglas para crear un servicio (con parent_servicio_id opcional)
const validateCreateServicio = [
    body('nombre').trim().notEmpty().withMessage('El nombre es requerido.').isLength({ max: 100 }),
    body('descripcion').trim().optional().isLength({ max: 1000 }),
    body('precio').notEmpty().isDecimal({ decimal_digits: '1,2' }).toFloat(),
    body('duracion').notEmpty().isInt({ gt: 0 }).toInt(),
    // Validación para parent_servicio_id: opcional, entero positivo, y debe existir en la BD
    body('parent_servicio_id')
      .optional({ nullable: true }) // Permite que sea null o no esté presente
      .isInt({ gt: 0 }).withMessage('El ID del servicio padre debe ser un entero positivo.')
      .bail() // Detener si no es entero positivo antes de consultar la BD
      .custom(async (value) => {
        if (value) { // Solo validar si se proporcionó un valor
          const exists = await servicioExists(value);
          if (!exists) {
            throw new Error(`El servicio padre con ID ${value} no existe.`);
          }
        }
        return true; // Indica que la validación pasó
      })
      .toInt() // Convertir a número entero si pasa
  ];
  
  // Reglas para actualizar un servicio (PATCH - con parent_servicio_id opcional)
  const validateUpdateServicio = [
    param('id').isInt({ gt: 0 }).withMessage('El ID del servicio en la URL debe ser un entero positivo.'),
    body('nombre').optional().trim().notEmpty().isLength({ max: 100 }),
    body('descripcion').optional({ nullable: true }).trim().isLength({ max: 1000 }), // Permitir null
    body('precio').optional().isDecimal({ decimal_digits: '1,2' }).toFloat(),
    body('duracion').optional().isInt({ gt: 0 }).toInt(),
    // Validación para parent_servicio_id al actualizar:
    body('parent_servicio_id')
      .optional({ nullable: true }) // Puede ser null (hacerlo principal) o un ID
      .custom(async (value, { req }) => { // Custom validator
        if (value === null) return true; // Permitir establecer a null explícitamente
  
        // Si no es null, debe ser un entero positivo
        if (!Number.isInteger(value) || value <= 0) {
          throw new Error('El ID del servicio padre debe ser un entero positivo o null.');
        }
        // Asegurarse que no se está haciendo padre de sí mismo
        if (value === parseInt(req.params.id, 10)) {
           throw new Error('Un servicio no puede ser su propio padre.');
        }
        // Verificar que el ID del padre existe
        const exists = await servicioExists(value);
        if (!exists) {
          throw new Error(`El servicio padre con ID ${value} no existe.`);
        }
        return true;
      })
      // Convertir a null si se envía explícitamente, o a int si es un número válido
      .customSanitizer(value => (value === null ? null : parseInt(value, 10)))
  ];
  
  // Regla para validar solo el ID en la URL
  const validateParamId = [
    param('id').isInt({ gt: 0 }).withMessage('El ID del servicio en la URL debe ser un entero positivo.')
  ];

  module.exports = {
    validateCreateServicio,
    validateUpdateServicio,
    validateParamId
  };