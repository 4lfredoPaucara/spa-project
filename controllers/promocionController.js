// controllers/promocionController.js
const db = require('../db');
const fs = require('fs'); // Para borrar archivos si es necesario
const path = require('path');

const UPLOADS_FOLDER = './uploads/'; // Debe coincidir con uploadMiddleware

// Obtener todas las promociones (Admin)
const getAllPromociones = async (req, res) => {
  const sql = 'SELECT * FROM promociones ORDER BY fecha_creacion DESC';
  try {
    const [promociones] = await db.query(sql);
    res.json(promociones);
  } catch (err) {
    console.error('❌ Error al obtener promociones:', err);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Obtener una promoción por ID (Admin)
const getPromocionById = async (req, res) => {
  const { id } = req.params; // Validado
  const sql = 'SELECT * FROM promociones WHERE id = ?';
  try {
    const [results] = await db.query(sql, [id]);
    if (results.length === 0) {
      return res.status(404).json({ mensaje: 'Promoción no encontrada.' });
    }
    res.json(results[0]);
  } catch (err) {
    console.error(`❌ Error al obtener promoción ${id}:`, err);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Crear una nueva promoción
const createPromocion = async (req, res) => {
  // Datos validados
  const { titulo, descripcion, fecha_inicio, fecha_fin, codigo_descuento, tipo_descuento, valor_descuento, aplica_a, id_servicio_aplicable, activo } = req.body;

  // Obtener la URL de la imagen si se subió
  let imagen_url = null;
  if (req.file) {
    // Guardamos la RUTA relativa accesible por el servidor estático
    imagen_url = `/uploads/${req.file.filename}`; // Asumiendo que sirves /uploads
     // Alternativa: URL completa (menos flexible si cambia el dominio/puerto)
     // imagen_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  }

  const sql = `
    INSERT INTO promociones (titulo, descripcion, imagen_url, fecha_inicio, fecha_fin, codigo_descuento, tipo_descuento, valor_descuento, aplica_a, id_servicio_aplicable, activo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  try {
    const [result] = await db.query(sql, [
      titulo, descripcion || null, imagen_url, fecha_inicio || null, fecha_fin || null,
      codigo_descuento || null, tipo_descuento || null, valor_descuento || null,
      aplica_a || 'todos', id_servicio_aplicable || null, activo !== undefined ? activo : true
    ]);
    res.status(201).json({ mensaje: '✅ Promoción creada con éxito', id: result.insertId });
  } catch (err) {
    // Si hay error en BD y se subió archivo, borrarlo para no dejar basura
     if (imagen_url) {
         try { fs.unlinkSync(path.join(__dirname, '..', UPLOADS_FOLDER, req.file.filename)); } // Borrar archivo subido
         catch (unlinkErr) { console.error("Error borrando archivo tras fallo de BD:", unlinkErr); }
     }
    console.error('❌ Error al crear promoción:', err);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Actualizar una promoción
const updatePromocion = async (req, res) => {
  const { id } = req.params; // Validado
  const camposAActualizar = req.body; // Validados

  // 1. Obtener la URL de la imagen actual para poder borrarla si se sube una nueva
  let urlImagenActual = null;
   try {
       const [currentPromo] = await db.query('SELECT imagen_url FROM promociones WHERE id = ?', [id]);
       if (currentPromo.length === 0) {
           return res.status(404).json({ mensaje: 'Promoción no encontrada para actualizar.' });
       }
       urlImagenActual = currentPromo[0].imagen_url;
   } catch (fetchErr) {
        console.error("Error buscando promo actual:", fetchErr);
        return res.status(500).json({ mensaje: 'Error del servidor al buscar promoción.' });
   }


  // 2. Determinar la nueva URL de imagen si se subió un archivo
  let nuevaImagenUrl = camposAActualizar.imagen_url; // Mantener la existente si no se sube nueva
  let archivoSubido = false;
  if (req.file) {
    nuevaImagenUrl = `/uploads/${req.file.filename}`;
    archivoSubido = true;
     // Si se subió una nueva, y había una antigua, marcar la antigua para borrar DESPUÉS de actualizar BD
  }
  // Permitir borrar la imagen enviando imagen_url: null
  if (camposAActualizar.hasOwnProperty('imagen_url') && camposAActualizar.imagen_url === null) {
      nuevaImagenUrl = null;
       // Marcar la antigua para borrar DESPUÉS de actualizar BD
  }


  // 3. Construir la consulta PATCH dinámica
  const camposPermitidos = ['titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 'codigo_descuento', 'tipo_descuento', 'valor_descuento', 'aplica_a', 'id_servicio_aplicable', 'activo'];
  const updates = [];
  const values = [];

  // Incluir imagen_url en los campos a actualizar si cambió
  if (nuevaImagenUrl !== urlImagenActual) {
       updates.push(`imagen_url = ?`);
       values.push(nuevaImagenUrl);
  }

  for (const campo of camposPermitidos) {
    if (camposAActualizar.hasOwnProperty(campo)) {
        // Manejar nulls explícitos
        if ((campo === 'descripcion' || campo === 'fecha_inicio' || campo === 'fecha_fin' || campo === 'codigo_descuento' || campo === 'tipo_descuento' || campo === 'valor_descuento' || campo === 'id_servicio_aplicable') && camposAActualizar[campo] === null) {
            updates.push(`${campo} = ?`);
            values.push(null);
        } else if (camposAActualizar[campo] !== undefined) {
            updates.push(`${campo} = ?`);
            values.push(camposAActualizar[campo]);
        }
    }
  }

  // No actualizar si no hay cambios (aparte de la imagen que ya se manejó)
  if (updates.length === 0) {
     // Si solo se subió imagen, 'updates' tendría 1 elemento.
     // Si no se subió imagen Y no hay otros campos, aquí es 0.
     return res.status(200).json({ mensaje: 'No se realizaron cambios.' }); // O 304 Not Modified
  }

  const sql = `UPDATE promociones SET ${updates.join(', ')} WHERE id = ?`;
  values.push(id);

  // 4. Ejecutar la actualización en BD
  try {
    const [result] = await db.query(sql, values);

    if (result.affectedRows === 0) {
        // Si la BD no actualizó nada, pero subimos archivo, debemos borrar el archivo nuevo
         if (archivoSubido) {
             try { fs.unlinkSync(path.join(__dirname, '..', UPLOADS_FOLDER, req.file.filename)); }
             catch (unlinkErr) { console.error("Error borrando archivo nuevo tras fallo de update:", unlinkErr); }
         }
      return res.status(404).json({ mensaje: 'Promoción no encontrada para actualizar (o no hubo cambios).' });
    }

     // 5. Si la BD se actualizó Y se subió una nueva imagen Y había una antigua diferente, borrar la antigua
     if (archivoSubido && urlImagenActual && urlImagenActual !== nuevaImagenUrl) {
         try { fs.unlinkSync(path.join(__dirname, '..', urlImagenActual)); } // Asume que urlImagenActual es ruta relativa desde raíz
         catch (unlinkErr) { console.error("Error borrando archivo antiguo tras éxito de update:", unlinkErr); }
     }
     // Borrar imagen antigua si se estableció a null
      if (nuevaImagenUrl === null && urlImagenActual) {
          try { fs.unlinkSync(path.join(__dirname, '..', urlImagenActual)); }
          catch (unlinkErr) { console.error("Error borrando archivo antiguo tras set a null:", unlinkErr); }
      }


    res.status(200).json({ mensaje: `Promoción ${id} actualizada correctamente.` });

  } catch (err) {
     // Si falló la BD, pero subimos archivo, borrar el archivo nuevo
     if (archivoSubido) {
         try { fs.unlinkSync(path.join(__dirname, '..', UPLOADS_FOLDER, req.file.filename)); }
         catch (unlinkErr) { console.error("Error borrando archivo nuevo tras fallo de BD:", unlinkErr); }
     }
    console.error(`❌ Error al actualizar promoción ${id}:`, err);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Eliminar una promoción
const deletePromocion = async (req, res) => {
  const { id } = req.params; // Validado

  // 1. Obtener la URL de la imagen para borrarla del servidor
   let imagen_url = null;
   try {
       const [promo] = await db.query('SELECT imagen_url FROM promociones WHERE id = ?', [id]);
       if (promo.length === 0) {
            return res.status(404).json({ mensaje: 'Promoción no encontrada para eliminar.' });
       }
       imagen_url = promo[0].imagen_url;
   } catch (fetchErr) {
       console.error("Error buscando promo antes de borrar:", fetchErr);
       return res.status(500).json({ mensaje: 'Error del servidor al buscar promoción.' });
   }

  // 2. Eliminar de la base de datos
  const sql = 'DELETE FROM promociones WHERE id = ?';
  try {
    const [result] = await db.query(sql, [id]);

    // affectedRows será 0 si ya se había borrado o el ID no existía (manejado arriba)
    // if (result.affectedRows === 0) {
    //   return res.status(404).json({ mensaje: 'Promoción no encontrada para eliminar.' });
    // }

    // 3. Si se eliminó de la BD y tenía imagen, borrar el archivo
    if (imagen_url) {
        try { fs.unlinkSync(path.join(__dirname, '..', imagen_url)); } // Asume ruta relativa
        catch (unlinkErr) { console.error(`Error borrando archivo ${imagen_url} tras borrar promo ${id}:`, unlinkErr); }
    }

    res.status(200).json({ mensaje: `Promoción ${id} eliminada correctamente.` });
    // o res.status(204).send();
  } catch (err) {
    // Errores inesperados de la BD
    console.error(`❌ Error al eliminar promoción ${id}:`, err);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};


module.exports = {
    getAllPromociones,
    getPromocionById,
    createPromocion,
    updatePromocion,
    deletePromocion
};