// En index.js
const express = require('express');
const listEndpoints = require('express-list-endpoints');

const cors = require('cors');
const path = require('path'); // Necesario para servir archivos estáticos
require('dotenv').config();
require('express-async-errors');

const app = express();

// Middlewares generales
app.use(cors());
app.use(express.json());
// Middleware para detectar JSON malformado... (el que ya tenías)

// --- Middleware para Servir Archivos Estáticos desde 'uploads' ---
// Esto hace que los archivos en ./uploads/ sean accesibles desde http://tu_dominio/uploads/nombre_archivo.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
//const turnosRoutes = require('./routes/turnos');

// --- Rutas ---
app.use('/auth', require('./routes/auth'));
app.use('/clientes', require('./routes/clientes')); // Asumiendo que lo adaptaste a usuarios o lo mantienes
app.use('/empleados', require('./routes/empleados')); // Necesitarás crear este
app.use('/servicios', require('./routes/servicios'));
app.use('/turnos', require('./routes/turnos'));
app.use('/historiales', require('./routes/historial'));
app.use('/promociones', require('./routes/promociones')); // Rutas de admin (proteger luego)
app.use('/asistencia', require('./routes/asistencia')); // Necesitarás crear este
app.use('/cobros', require('./routes/cobros'));       // Necesitarás crear este
app.use('/pagos-empleados', require('./routes/pagosEmpleados')); // Necesitarás crear este
app.use('/reportes', require('./routes/reportes'));   // Necesitarás crear este
app.use('/public', require('./routes/public'));     // Rutas públicas para la landing
// app.use('/api/turnos', turnosRoutes);

// console.log(listEndpoints(app));
// console.log('🚀 Listado de Endpoints:')


// Middleware de Manejo de Errores GENERAL (al final)
app.use((err, req, res, next) => {
    // ... (tu manejador de errores) ...
     console.error('❌ Error no controlado:', err);
     res.status(err.status || 500).json({
        mensaje: err.message || 'Ocurrió un error inesperado en el servidor.'
     });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
  console.log(`    Imágenes servidas desde: http://localhost:${PORT}/uploads`); // Mensaje útil
});