// routes/promociones.js
const express = require('express');
const router = express.Router();
const promocionController = require('../controllers/promocionController');
const { validateCreatePromocion, validateUpdatePromocion, validateParamId } = require('../validators/promocionValidator');
const { handleValidationErrors } = require('../middlewares/validationMiddleware');
const { upload, handleMulterError } = require('../middlewares/uploadMiddleware'); // Importar Multer
// const { protect, authorize } = require('../middlewares/authMiddleware'); // Descomentar cuando tengas auth

// --- Rutas CRUD para Promociones (Protegidas) ---
// Nota: Añadir protect y authorize(['admin', 'recepcionista']) a estas rutas cuando implementes autenticación

router.get('/', /* protect, authorize(...), */ promocionController.getAllPromociones);

router.get('/:id',
    // protect, authorize(...),
    validateParamId,
    handleValidationErrors,
    promocionController.getPromocionById
);

router.post('/',
    // protect, authorize(...),
    upload.single('imagen'), // Middleware de Multer ANTES del validador
    handleMulterError,       // Manejar errores de Multer
    validateCreatePromocion,
    handleValidationErrors,
    promocionController.createPromocion
);

router.patch('/:id',
    // protect, authorize(...),
    upload.single('imagen'), // Multer también aquí si se puede actualizar imagen
    handleMulterError,
    validateUpdatePromocion,
    handleValidationErrors,
    promocionController.updatePromocion
);

router.delete('/:id',
    // protect, authorize(...),
    validateParamId,
    handleValidationErrors,
    promocionController.deletePromocion
);


module.exports = router;