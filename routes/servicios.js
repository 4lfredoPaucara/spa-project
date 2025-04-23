// routes/servicios.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /servicios – obtener todos los servicios
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM servicios';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error al obtener servicios:', err);
      return res.status(500).json({ mensaje: 'Error del servidor' });
    }

    res.json(results); // devolvemos los servicios como JSON
  });
});

// POST /servicios – agregar un nuevo servicio
router.post('/', (req, res) => {
  const { nombre, descripcion, precio, duracion } = req.body;

  if (!nombre || !descripcion || !precio || !duracion) {
    return res.status(400).json({ mensaje: 'Faltan datos del servicio' });
  }

  const sql = 'INSERT INTO servicios (nombre, descripcion, precio, duracion) VALUES (?, ?, ?, ?)';
  db.query(sql, [nombre, descripcion, precio, duracion], (err, result) => {
    if (err) {
      console.error('Error al agregar servicio:', err);
      return res.status(500).json({ mensaje: 'Error del servidor' });
    }

    res.status(201).json({ mensaje: 'Servicio agregado con éxito', id: result.insertId });
  });
});

// PUT /servicios/:id – actualizar un servicio existente
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, precio, duracion } = req.body;

  if (!nombre || !precio || !duracion) {
    return res.status(400).json({ mensaje: 'Faltan datos para actualizar el servicio' });
  }

  const sql = `UPDATE servicios SET nombre = ?, precio = ?, duracion = ? WHERE id = ?`;

  db.query(sql, [nombre, precio, duracion, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar el servicio:', err);
      return res.status(500).json({ mensaje: 'Error del servidor' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado' });
    }

    res.status(200).json({ mensaje: 'Servicio actualizado correctamente' });
  });
});


module.exports = router;
