const express = require('express');
const router = express.Router();
const empleadosController = require('../controllers/empleadosController');
const { /* reglas de validación de empleados */ } = require('../validators/empleadosValidator'); // Ajusta nombres
const { handleValidationErrors } = require('../middlewares/validationMiddleware');

router.post('/', /* validateCreateEmpleado, */ handleValidationErrors, empleadosController.createEmpleado);
router.put('/:id', /* validateUpdateEmpleado, */ handleValidationErrors, empleadosController.updateEmpleado);
router.patch('/:id', /* validateUpdateEmpleado, */ handleValidationErrors, empleadosController.updateEmpleado);
router.get('/', empleadosController.getAllEmpleados);
router.get('/:id', /* validateParamId, */ handleValidationErrors, empleadosController.getEmpleadoById);
router.delete('/:id', /* validateParamId, */ handleValidationErrors, empleadosController.deleteEmpleado);
//router.get('/search', empleadosController.searchEmpleados); // Para buscar empleados por nombre, etc.
//router.get('/search/:id', /* validateParamId, */ handleValidationErrors, empleadosController.searchEmpleadoById); // Para buscar un empleado específico por ID

module.exports = router;