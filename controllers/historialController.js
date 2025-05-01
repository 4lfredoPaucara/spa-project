// controllers/historialController.js
const db = require('../db'); // Ajusta la ruta

// Crear una nueva entrada de historial (POST /)
const createHistorial = async (req, res) => {
  // Datos validados
  const { id_cliente, fecha, diagnostico, tratamiento, notas, archivo_url } = req.body;
  const sql = `
    INSERT INTO historiales_clinicos (id_cliente, fecha, diagnostico, tratamiento, notas, archivo_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  try {
    const [result] = await db.query(sql, [
      id_cliente, fecha, diagnostico || null, tratamiento || null, notas || null, archivo_url || null
    ]);
    res.status(201).json({ mensaje: '✅ Entrada de historial creada con éxito', id: result.insertId });
  } catch (err) {
    console.error('❌ Error al crear historial:', err);
    // No debería haber error de FK aquí porque ya validamos id_cliente
    res.status(500).json({ mensaje: 'Error del servidor al crear historial' });
  }
};

// Obtener todos los historiales de un cliente específico (GET /cliente/:clienteId)
const getHistorialByCliente = async (req, res) => {
  // ID de cliente validado
  const { clienteId } = req.params;
  // Opcional: verificar si el cliente existe antes de buscar (aunque el validador ya podría hacerlo)
  const sql = `
    SELECT hc.*, c.nombre as nombre_cliente
    FROM historiales_clinicos hc
    JOIN clientes c ON hc.id_cliente = c.id
    WHERE hc.id_cliente = ?
    ORDER BY hc.fecha DESC, hc.id DESC
  `; // Ordenar por fecha descendente
  try {
    const [historiales] = await db.query(sql, [clienteId]);
    // Devolver array vacío si el cliente no tiene historiales, no es un error
    res.json(historiales);
  } catch (err) {
    console.error(`❌ Error al obtener historial para cliente ${clienteId}:`, err);
    res.status(500).json({ mensaje: 'Error del servidor al obtener historial' });
  }
};

// Obtener una entrada de historial específica por su ID (GET /:id)
const getHistorialById = async (req, res) => {
  // ID de historial validado
  const { id } = req.params;
  const sql = `
    SELECT hc.*, c.nombre as nombre_cliente
    FROM historiales_clinicos hc
    JOIN clientes c ON hc.id_cliente = c.id
    WHERE hc.id = ?
  `;
  try {
    const [results] = await db.query(sql, [id]);
    if (results.length === 0) {
      return res.status(404).json({ mensaje: 'Entrada de historial no encontrada.' });
    }
    res.json(results[0]);
  } catch (err) {
    console.error(`❌ Error al obtener historial ${id}:`, err);
    res.status(500).json({ mensaje: 'Error del servidor al obtener historial' });
  }
};

// Actualizar parcialmente una entrada de historial (PATCH /:id)
const updateHistorial = async (req, res) => {
  // ID y cuerpo validados
  const { id } = req.params;
  const camposAActualizar = req.body;

  const camposPermitidos = ['fecha', 'diagnostico', 'tratamiento', 'notas', 'archivo_url'];
  const updates = [];
  const values = [];

  for (const campo of camposPermitidos) {
    if (camposAActualizar.hasOwnProperty(campo)) {
      if (camposAActualizar[campo] === null && ['diagnostico', 'tratamiento', 'notas', 'archivo_url'].includes(campo)) {
        updates.push(`${campo} = ?`);
        values.push(null);
      } else if (camposAActualizar[campo] !== undefined) {
        updates.push(`${campo} = ?`);
        values.push(camposAActualizar[campo]);
      }
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ mensaje: `No se proporcionaron campos válidos para actualizar (permitidos: ${camposPermitidos.join(', ')}).` });
  }

  const sql = `UPDATE historiales_clinicos SET ${updates.join(', ')} WHERE id = ?`;
  values.push(id);

  try {
    const [result] = await db.query(sql, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Entrada de historial no encontrada para actualizar.' });
    }
    res.status(200).json({ mensaje: `Entrada de historial ${id} actualizada correctamente.` });
  } catch (err) {
    console.error(`❌ Error al actualizar historial ${id}:`, err);
    res.status(500).json({ mensaje: 'Error del servidor al actualizar historial' });
  }
};

// Eliminar una entrada de historial (DELETE /:id)
const deleteHistorial = async (req, res) => {
  // ID validado
  const { id } = req.params;
  const sql = 'DELETE FROM historiales_clinicos WHERE id = ?';
  try {
    const [result] = await db.query(sql, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Entrada de historial no encontrada para eliminar.' });
    }
    res.status(200).json({ mensaje: `Entrada de historial ${id} eliminada correctamente.` });
    // o res.status(204).send();
  } catch (err) {
    // Errores FK no deberían ocurrir aquí al borrar un historial
    console.error(`❌ Error al eliminar historial ${id}:`, err);
    res.status(500).json({ mensaje: 'Error del servidor al eliminar historial' });
  }
};

module.exports = {
  createHistorial,
  getHistorialByCliente,
  getHistorialById,
  updateHistorial,
  deleteHistorial
};