const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware para detectar JSON malformado o vacío
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ Error de sintaxis en JSON recibido:', err.message);
    return res.status(400).json({
      mensaje: 'El cuerpo de la solicitud no tiene un JSON válido'
    });
  }
  next(); // continuar si no hay error
});

// Rutas
app.use('/clientes', require('./routes/clientes'));
app.use('/servicios', require('./routes/servicios'));
app.use('/turnos', require('./routes/turnos'));
app.use('/historial', require('./routes/historial'));

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
