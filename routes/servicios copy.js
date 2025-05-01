// // routes/servicios.js
// const express = require('express');
// const router = express.Router();
// const db = require('../db');

// // GET /servicios – obtener todos los servicios
// router.get('/', (req, res) => {
//   const sql = 'SELECT * FROM servicios';
//   db.query(sql, (err, results) => {
//     if (err) {
//       console.error('Error al obtener servicios:', err);
//       return res.status(500).json({ mensaje: 'Error del servidor' });
//     }

//     res.json(results); // devolvemos los servicios como JSON
//   });
// });

// // POST /servicios – agregar un nuevo servicio
// router.post('/', (req, res) => {
//   const { nombre, descripcion, precio, duracion } = req.body;

//   if (!nombre || !descripcion || !precio || !duracion) {
//     return res.status(400).json({ mensaje: 'Faltan datos del servicio' });
//   }

//   const sql = 'INSERT INTO servicios (nombre, descripcion, precio, duracion) VALUES (?, ?, ?, ?)';
//   db.query(sql, [nombre, descripcion, precio, duracion], (err, result) => {
//     if (err) {
//       console.error('Error al agregar servicio:', err);
//       return res.status(500).json({ mensaje: 'Error del servidor' });
//     }

//     res.status(201).json({ mensaje: 'Servicio agregado con éxito', id: result.insertId });
//   });
// });

// // PUT /servicios/:id – actualizar un servicio existente
// router.put('/:id', (req, res) => {
//   const { id } = req.params;
//   const { nombre, precio, duracion } = req.body;

//   if (!nombre || !precio || !duracion) {
//     return res.status(400).json({ mensaje: 'Faltan datos para actualizar el servicio' });
//   }

//   const sql = `UPDATE servicios SET nombre = ?, precio = ?, duracion = ? WHERE id = ?`;

//   db.query(sql, [nombre, precio, duracion, id], (err, result) => {
//     if (err) {
//       console.error('Error al actualizar el servicio:', err);
//       return res.status(500).json({ mensaje: 'Error del servidor' });
//     }

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ mensaje: 'Servicio no encontrado' });
//     }

//     res.status(200).json({ mensaje: 'Servicio actualizado correctamente' });
//   });
// });


// module.exports = router;

// routes/servicios.js
const express = require('express');
const router = express.Router();
// Asegúrate que db ahora es el promisePool exportado de db.js
const db = require('../db'); // Debería ser el promisePool

// GET /servicios – obtener todos los servicios (Refactorizado con async/await)
router.get('/', async (req, res) => { // <--- Marcar como async
  const sql = 'SELECT * FROM servicios';
  try {
    // Ejecutar la consulta y esperar el resultado
    const [results] = await db.query(sql); // <--- Usar await y destructurar para obtener solo los resultados
    // 'results' contendrá el array de servicios
    // La librería mysql2 devuelve [results, fields], por eso destructuramos [results]

    res.json(results); // devolvemos los servicios como JSON

  } catch (err) {
    // Capturar cualquier error de la base de datos o del proceso
    console.error('Error al obtener servicios:', err);
    res.status(500).json({ mensaje: 'Error del servidor' }); // <--- Devolver error 500
  }
});

// POST /servicios – agregar un nuevo servicio (Refactorizado con async/await)
router.post('/', async (req, res) => { // <--- Marcar como async
  const { nombre, descripcion, precio, duracion } = req.body;

  // Verificación inicial de datos
  if (!nombre || !descripcion || !precio || !duracion) {
    return res.status(400).json({ mensaje: 'Faltan datos del servicio' });
  }

  // Consulta SQL (los '?' son manejados por mysql2 para prevenir inyección SQL)
  const sql = 'INSERT INTO servicios (nombre, descripcion, precio, duracion) VALUES (?, ?, ?, ?)';

  try {
    // Ejecutar la consulta con los datos y esperar el resultado
    const [result] = await db.query(sql, [nombre, descripcion, precio, duracion]); // <--- Usar await

    // 'result' contendrá información sobre la inserción, como el ID generado
    // En mysql2, el objeto result tiene propiedades como insertId

    // Respondemos con éxito y el ID del nuevo servicio
    res.status(201).json({ mensaje: 'Servicio agregado con éxito', id: result.insertId });

  } catch (err) {
    // Capturar cualquier error
    console.error('Error al agregar servicio:', err);
    res.status(500).json({ mensaje: 'Error del servidor' }); // <--- Devolver error 500
  }
});

// PUT /servicios/:id – actualizar un servicio existente (Refactorizado con async/await)
router.put('/:id', async (req, res) => { // <--- Marcar como async
  const { id } = req.params;
  const { nombre, precio, duracion } = req.body; // Nota: descripción no está aquí, ¿intencional?

  // Verificación inicial
  if (!nombre || !precio || !duracion) {
    return res.status(400).json({ mensaje: 'Faltan datos para actualizar el servicio' });
  }

  // Consulta SQL para actualizar
  const sql = `UPDATE servicios SET nombre = ?, precio = ?, duracion = ? WHERE id = ?`;

  try {
    // Ejecutar la consulta con los datos y esperar el resultado
    const [result] = await db.query(sql, [nombre, precio, duracion, id]); // <--- Usar await

    // 'result' contiene información como cuántas filas fueron afectadas (affectedRows)

    // Verificar si se actualizó alguna fila (si el ID existía)
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado' }); // <--- Error 404 si no se encontró
    }

    // Responder con éxito
    res.status(200).json({ mensaje: 'Servicio actualizado correctamente' });

  } catch (err) {
    // Capturar cualquier error
    console.error('Error al actualizar el servicio:', err);
    res.status(500).json({ mensaje: 'Error del servidor' }); // <--- Devolver error 500
  }
});

module.exports = router;

