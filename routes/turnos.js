const express = require('express');
const router = express.Router();
const turnoController = require('../controllers/turnoController');
const { /* reglas de validación de turno */ } = require('../validators/turnoValidator'); // Ajusta nombres
const { handleValidationErrors } = require('../middlewares/validationMiddleware');

router.post('/', /* validateCreateTurno, */ handleValidationErrors, turnoController.createTurno);
router.put('/:id', /* validateReprogramTurno, */ handleValidationErrors, turnoController.reprogramTurno);
router.patch('/:id', /* validateUpdateTurno, */ handleValidationErrors, turnoController.updateTurno);
router.get('/', turnoController.getAllTurnos);
router.get('/:id', /* validateParamId, */ handleValidationErrors, turnoController.getTurnoById);
router.delete('/:id', /* validateParamId, */ handleValidationErrors, turnoController.deleteTurno);

module.exports = router;