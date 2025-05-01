// const mysql = require('mysql2');
// require('dotenv').config();

// const conexion = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME
// });

// conexion.connect((err) => {
//   if (err) {
//     console.error('❌ Error de conexión: ', err);
//   } else {
//     console.log('✅ Conectado a la base de datos MySQL');
//   }
// });

//module.exports = conexion;



// db.js (Modificado para usar Pool y Promesas)
const mysql = require('mysql2');
require('dotenv').config(); // Carga las variables de .env

// Crear un POOL de conexiones en lugar de una única conexión
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost', // Lee del .env o usa 'localhost'
  user: process.env.DB_USER,             // Lee del .env
  password: process.env.DB_PASSWORD,       // Lee del .env
  database: process.env.DB_NAME,           // Lee del .env
  waitForConnections: true, // Esperar si todas las conexiones están en uso
  connectionLimit: 10,     // Número máximo de conexiones en el pool (ajusta según necesites)
  queueLimit: 0            // Sin límite en la cola de espera por conexiones
});

// ¡IMPORTANTE! Envolver el pool para que use Promesas
// Esto permite usar async/await con pool.query(), pool.execute(), etc.
const promisePool = pool.promise();

// Opcional: Probar la conexión al iniciar la aplicación
// Esto verifica que las credenciales y la conexión funcionan
// Puedes quitarlo en producción si prefieres
promisePool.getConnection()
  .then(connection => {
    console.log('✅ Conectado a la base de datos MySQL (usando pool) correctamente.');
    connection.release(); // ¡Importante! Liberar la conexión obtenida para la prueba
  })
  .catch(err => {
    console.error('❌ Error al obtener conexión del pool MySQL:', err);
    // Considera terminar la aplicación si la conexión inicial falla gravemente
    // process.exit(1);
  });

// Exportar el POOL con soporte para Promesas
// Tus archivos de rutas (clientes.js, servicios.js, etc.) ahora importarán este promisePool
module.exports = promisePool;