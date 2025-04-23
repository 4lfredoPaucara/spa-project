// routes/turnos.js
const express = require('express');
const router = express.Router();
const db = require('../db');


// POST /turnos – Registrar un nuevo turno
router.post('/', (req, res) => {
  // Extraemos los datos del cuerpo de la petición
  const { id_cliente, id_servicio, fecha, hora } = req.body;

  // Verificamos que todos los datos necesarios estén presentes
  if (!id_cliente || !id_servicio || !fecha || !hora) {
    return res.status(400).json({ mensaje: 'Faltan datos del formulario' });
  }

  // Estado por defecto para un turno nuevo
  const estado = 'pendiente';

  // Creamos la consulta SQL para insertar el nuevo turno
  const sql = `
    INSERT INTO turnos (id_cliente, id_servicio, fecha, hora, estado)
    VALUES (?, ?, ?, ?, ?)
  `;

  // Ejecutamos la consulta con los datos recibidos
  db.query(sql, [id_cliente, id_servicio, fecha, hora, estado], (err, result) => {
    if (err) {
      console.error('❌ Error al insertar turno:', err);
      return res.status(500).json({ mensaje: 'Error del servidor al registrar el turno' });
    }

    // Si todo salió bien, respondemos con un mensaje de éxito
    res.status(201).json({
      mensaje: '✅ Turno registrado con éxito',
      turnoId: result.insertId
    });
  });
});

// PUT /turnos/:id – Reprogramar un turno
router.put('/:id', (req, res) => {
  // Obtenemos el ID del turno desde la URL
  const turnoId = req.params.id;

  // Obtenemos los datos nuevos desde el cuerpo de la petición
  const { nuevaFecha, nuevaHora, costoExtraManual } = req.body;

  // Verificamos que se hayan enviado fecha y hora nuevas
  if (!nuevaFecha || !nuevaHora) {
    return res.status(400).json({ mensaje: 'Faltan la nueva fecha u hora' });
  }

  // Armamos la consulta SQL para actualizar el turno
  const sql = `
    UPDATE turnos
    SET fecha = ?, hora = ?, estado = 'reprogramado', costo_extra = ?
    WHERE id = ?
  `;

  // Ejecutamos la consulta con los valores proporcionados
  db.query(sql, [nuevaFecha, nuevaHora, costoExtraManual || 0, turnoId], (err, result) => {
    if (err) {
      console.error('Error al reprogramar turno:', err);
      return res.status(500).json({ mensaje: 'Error del servidor' });
    }

    // Verificamos si algún turno fue afectado
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Turno no encontrado' });
    }

    // Respondemos con éxito
    res.json({ mensaje: 'Turno reprogramado con éxito' });
  });
});

  // PUT /turnos/:id/cancelar – marcar un turno como cancelado
router.put('/:id/cancelar', (req, res) => {
  const { id } = req.params;

  const sql = `UPDATE turnos SET estado = 'cancelado' WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error al cancelar turno:', err);
      return res.status(500).json({ mensaje: 'Error del servidor' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Turno no encontrado' });
    }

    res.json({ mensaje: 'Turno cancelado correctamente' });
  });
});

// CANCELAR UN TURNO (marcar como cancelado)
router.delete('/:id/cancelar', (req, res) => {
  // Extrae el id del turno desde los parámetros de la URL
  const turnoId = req.params.id;

  // Verifica que el ID es válido (número)
  if (isNaN(turnoId)) {
    return res.status(400).json({ mensaje: 'ID de turno inválido' });
  }

  // Define la consulta SQL para actualizar el estado del turno a "cancelado"
  const sql = 'UPDATE turnos SET estado = ? WHERE id = ?';

  // Ejecuta la consulta con los valores: estado y ID
  db.query(sql, ['cancelado', turnoId], (err, result) => {
    if (err) {
      console.error('Error al cancelar turno:', err);
      return res.status(500).json({ mensaje: 'Error del servidor al cancelar turno' });
    }

    // Verifica si se afectó alguna fila (es decir, si el ID existía)
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Turno no encontrado' });
    }

    // Si todo salió bien, responde con éxito
    res.json({ mensaje: 'Turno cancelado correctamente' });
  });
});

// GET /turnos - Lista todos los turnos con información de cliente y servicio
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      turnos.id,
      clientes.nombre AS cliente,
      clientes.telefono AS telefono,
      servicios.nombre AS servicio,
      servicios.duracion,
      turnos.fecha,
      turnos.hora,
      turnos.estado
    FROM turnos
    JOIN clientes ON turnos.id_cliente = clientes.id
    JOIN servicios ON turnos.id_servicio = servicios.id
    ORDER BY turnos.fecha, turnos.hora
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error al obtener turnos:', err);
      return res.status(500).json({ mensaje: 'Error del servidor' });
    }

    res.json(results);
  });
});

module.exports = router;
