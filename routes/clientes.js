// routes/clientes.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ mensaje: 'Ruta clientes funcionando 🔥' });
});

module.exports = router;
