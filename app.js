// const express = require('express');
// const listEndpoints = require('express-list-endpoints');
// const app = express();

// const authRoutes = require('./routes/auth');
// const clientesRoutes = require('./routes/clientes'); 
// const empleadosRoutes = require('./routes/empleados');
// const serviciosRoutes = require('./routes/servicios');
// const turnosRoutes = require('./routes/turnos');
// const historialRoutes = require('./routes/historial');
// const promocionesRoutes = require('./routes/promociones');
// const asistenciaRoutes = require('./routes/asistencia');
// const cobrosRoutes = require('./routes/cobros');
// const pagosEmpleadosRoutes = require('./routes/pagosEmpleados');
// const reportesRoutes = require('./routes/reportes');
// const publicRoutes = require('./routes/public');

// app.use(express.json());

// // Montar las rutas
// app.use('/api/auth', authRoutes);
// app.use('/api/clientes', clientesRoutes);
// app.use('/api/empleados', empleadosRoutes);
// app.use('/api/servicios', serviciosRoutes);
// app.use('/api/turnos', turnosRoutes);
// app.use('/api/historial', historialRoutes);
// app.use('/api/promociones', promocionesRoutes);
// app.use('/api/asistencia', asistenciaRoutes);
// app.use('/api/cobros', cobrosRoutes);
// app.use('/api/pagos-empleados', pagosEmpleadosRoutes);
// app.use('/api/reportes', reportesRoutes);
// app.use('/api/public', publicRoutes);


// console.log(listEndpoints(app));
// console.log('🚀 Listado de Endpoints:')

// // Puerto de escucha
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
//   console.log(`    Imágenes servidas desde: http://localhost:${PORT}/uploads`); // Mensaje útil
// });