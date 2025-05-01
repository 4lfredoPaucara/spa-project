// routes/public.js
const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// --- Rutas Públicas (Sin Autenticación) ---

// GET /public/servicios-activos - Para la landing page
router.get('/servicios-activos', publicController.getServiciosActivos);

// GET /public/promociones-activas - Para la landing page
router.get('/promociones-activas', publicController.getPromocionesActivas);


module.exports = router;