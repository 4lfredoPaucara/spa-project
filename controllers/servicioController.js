// controllers/servicioController.js
const db = require('../db'); // Asegúrate que la ruta a db.js es correcta

// Controlador para obtener todos los servicios (GET /servicios)
const getAllServicios = async (req, res) => {
  // Filtrado opcional por query params
  const { parentId, type } = req.query;
  let sql = `
      SELECT
          s.*,
          p.nombre AS nombre_padre
      FROM servicios s
      LEFT JOIN servicios p ON s.parent_servicio_id = p.id
  `;
  const conditions = [];
  const values = [];

  // Lógica de filtrado (main, sub, parentId)
  if (parentId === 'null' || type === 'main') {
      conditions.push('s.parent_servicio_id IS NULL');
  } else if (parentId && !isNaN(parseInt(parentId))) {
      // Asegurarse que parentId es un número antes de usarlo
      const parsedParentId = parseInt(parentId, 10);
      if (parsedParentId > 0) {
          conditions.push('s.parent_servicio_id = ?');
          values.push(parsedParentId);
      } else {
           // Podrías devolver un error 400 aquí si el parentId no es válido
           // return res.status(400).json({ mensaje: 'El parentId debe ser un entero positivo.' });
      }
  } else if (type === 'sub') {
       conditions.push('s.parent_servicio_id IS NOT NULL');
  }
  // Añadir más filtros si es necesario...

  if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY COALESCE(s.parent_servicio_id, s.id), s.parent_servicio_id IS NOT NULL, s.nombre ASC';

  try {
    const [servicios] = await db.query(sql, values);
    res.json(servicios);
  } catch (err) {
    console.error('❌ Error al obtener servicios:', err);
    res.status(500).json({ mensaje: 'Error del servidor al obtener servicios' });
  }
};

// Controlador para obtener un servicio específico por ID (GET /servicios/:id)
const getServicioById = async (req, res) => {
  // Se asume que el ID fue validado por un middleware anterior
  const { id } = req.params;
  const sql = `
    SELECT
        s.*,
        p.nombre AS nombre_padre
    FROM servicios s
    LEFT JOIN servicios p ON s.parent_servicio_id = p.id
    WHERE s.id = ?
  `;
  try {
    const [results] = await db.query(sql, [id]);

    if (results.length === 0) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado.' });
    }
    res.json(results[0]); // Devolvemos el servicio encontrado
  } catch (err) {
    console.error(`❌ Error al obtener servicio ${id}:`, err);
    res.status(500).json({ mensaje: 'Error del servidor al obtener el servicio' });
  }
};

// Controlador para crear un nuevo servicio (POST /servicios)
const createServicio = async (req, res) => {
  // Se asume que los datos fueron validados por un middleware anterior
  const { nombre, descripcion, precio, duracion, parent_servicio_id } = req.body;

  const sql = `
    INSERT INTO servicios (nombre, descripcion, precio, duracion, parent_servicio_id)
    VALUES (?, ?, ?, ?, ?)
  `;
  try {
    // Insertar usando null si los campos opcionales no vienen
    const [result] = await db.query(sql, [nombre, descripcion || null, precio, duracion, parent_servicio_id || null]);
    res.status(201).json({ mensaje: '✅ Servicio agregado con éxito', id: result.insertId });
  } catch (err) {
    // Aquí podrías añadir manejo de errores específicos como nombre duplicado si tuvieras UNIQUE constraint
    console.error('❌ Error al agregar servicio:', err);
    res.status(500).json({ mensaje: 'Error del servidor al agregar el servicio' });
  }
};

// Controlador para actualizar parcialmente un servicio (PATCH /servicios/:id)
const updateServicio = async (req, res) => {
  // Se asume que el ID y el cuerpo fueron validados por un middleware anterior
  const { id } = req.params;
  const camposAActualizar = req.body;

  // Campos permitidos para actualizar via PATCH
  const camposPermitidos = ['nombre', 'descripcion', 'precio', 'duracion', 'parent_servicio_id'];
  const updates = [];
  const values = [];

  // Construcción dinámica de la consulta
  for (const campo of camposPermitidos) {
    if (camposAActualizar.hasOwnProperty(campo)) {
       if ((campo === 'descripcion' || campo === 'parent_servicio_id') && camposAActualizar[campo] === null) {
            updates.push(`${campo} = ?`);
            values.push(null);
       } else if (camposAActualizar[campo] !== undefined) {
            updates.push(`${campo} = ?`);
            values.push(camposAActualizar[campo]);
       }
    }
  }

  if (updates.length === 0) {
     return res.status(400).json({
         mensaje: `No se proporcionaron campos válidos para actualizar (permitidos: ${camposPermitidos.join(', ')}).`
      });
  }

  const sql = `UPDATE servicios SET ${updates.join(', ')} WHERE id = ?`;
  values.push(id); // Añadir el ID al final

  try {
    const [result] = await db.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado para actualizar.' });
    }
    res.status(200).json({ mensaje: `Servicio ${id} actualizado correctamente.` });
  } catch (err) {
     // Aquí podrías añadir manejo de errores específicos como nombre duplicado si tuvieras UNIQUE constraint
    console.error(`❌ Error al actualizar servicio ${id}:`, err);
    res.status(500).json({ mensaje: 'Error del servidor al actualizar el servicio' });
  }
};

// Controlador para eliminar un servicio (DELETE /servicios/:id)
const deleteServicio = async (req, res) => {
  // Se asume que el ID fue validado por un middleware anterior
  const { id } = req.params;

  // 1. Verificar si tiene hijos antes de borrar (si no usas ON DELETE CASCADE)
  const checkChildrenSql = 'SELECT 1 FROM servicios WHERE parent_servicio_id = ? LIMIT 1';
  try {
      const [children] = await db.query(checkChildrenSql, [id]);
      if (children.length > 0) {
          return res.status(409).json({
              mensaje: `Error: No se puede eliminar el servicio ${id} porque tiene subservicios asociados. Elimine o reasigne los subservicios primero.`
          });
      }
  } catch (checkErr) {
      console.error(`❌ Error al verificar hijos del servicio ${id}:`, checkErr);
      return res.status(500).json({ mensaje: 'Error del servidor al verificar subservicios.' });
  }

  // 2. Si no tiene hijos, proceder a eliminar
  const deleteSql = 'DELETE FROM servicios WHERE id = ?';
  try {
    const [result] = await db.query(deleteSql, [id]);

    if (result.affectedRows === 0) {
      // Esto podría pasar si se eliminó justo después de la verificación de hijos (poco probable pero posible)
      return res.status(404).json({ mensaje: 'Servicio no encontrado para eliminar.' });
    }
    res.status(200).json({ mensaje: `Servicio ${id} eliminado correctamente.` });
    // Alternativa: res.status(204).send();
  } catch (err) {
    // 3. Manejar error si el servicio está en uso en turnos
    if (err.code === 'ER_ROW_IS_REFERENCED_2') { // Código de error FK constraint fail
      // Intentar determinar si la referencia es de 'turnos'
      let dependencia = 'turnos'; // Asumir turnos por defecto para servicios
       // if (err.message.includes('nombre_constraint_turnos')) dependencia = 'turnos'; // Si conoces el nombre exacto
      return res.status(409).json({
         mensaje: `Error: No se puede eliminar el servicio ${id} porque está siendo utilizado en ${dependencia}.`
       });
    }
    // Otros errores
    console.error(`❌ Error al eliminar servicio ${id}:`, err);
    res.status(500).json({ mensaje: 'Error del servidor al eliminar el servicio' });
  }
};


// Exportar todos los controladores
module.exports = {
    getAllServicios,
    getServicioById,
    createServicio,
    updateServicio,
    deleteServicio
};