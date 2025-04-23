// routes/historial.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ mensaje: 'Ruta historial funcionando 🔥' });
});

module.exports = router;
