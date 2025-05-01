// controllers/turnoController.js
const db = require('../db'); // Asegúrate que la ruta a db.js es correcta

// --- Estados válidos permitidos en la base de datos ---
// Definimos los estados válidos aquí para reutilizarlos en la lógica si es necesario
const ESTADOS_VALIDOS = ['pendiente', 'confirmado', 'cancelado', 'atendido', 'reprogramado'];

// Controlador para registrar un nuevo turno (POST /turnos)
const createTurno = async (req, res) => {
  const { id_cliente, id_servicio, fecha, hora, id_empleado } = req.body; // Añadido id_empleado
  const estadoInicialTurno = 'pendiente';
  const estadoInicialCobro = 'pendiente_adelanto';

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Obtener precio base y duración del servicio para guardarlos en el turno/cobro
    const sqlServicio = 'SELECT precio, duracion FROM servicios WHERE id = ?';
    const [servicios] = await connection.query(sqlServicio, [id_servicio]);
    if (servicios.length === 0) {
        await connection.rollback();
        // Este error debería ser atrapado por el validador, pero es una doble verificación
        return res.status(404).json({ mensaje: `Servicio con ID ${id_servicio} no encontrado.` });
    }
    const precioBaseServicio = servicios[0].precio;
    const duracionServicio = servicios[0].duracion; // Usar para `duracion_final`

    // --- INICIO: Lógica de Verificación de Disponibilidad ---
    // (ESTA LÓGICA ES FUNDAMENTAL Y DEBERÍA IMPLEMENTARSE AQUÍ)
    // Consulta para buscar turnos del empleado que se solapen
    const sqlCheckOverlap = `
        SELECT 1 FROM turnos
        WHERE id_empleado = ?
          AND fecha = ?
          AND (
              (hora < ADDTIME(?, SEC_TO_TIME(? * 60))) -- Nuevo turno empieza antes de que termine uno existente
              AND
              (ADDTIME(hora, SEC_TO_TIME(COALESCE(duracion_final, (SELECT duracion FROM servicios WHERE id = id_servicio)) * 60)) > ?) -- Uno existente termina después de que empiece el nuevo
          )
        LIMIT 1
    `;
    // Calcular hora de fin del nuevo turno (aproximada, podría ser más precisa)
    // const nuevaHoraFin = /* Calcular hora + duración */ ;
    const [overlaps] = await connection.query(sqlCheckOverlap, [
        id_empleado,
        fecha,
        hora, // Hora fin del existente
        duracionServicio, // Duración del existente (en segundos)
        hora  // Hora inicio del nuevo
    ]);

    if (overlaps.length > 0) {
        await connection.rollback();
        return res.status(409).json({ mensaje: `Conflicto: El empleado ${id_empleado} ya tiene un turno asignado en ese horario (${fecha} ${hora}).` });
    }
    // --- FIN: Lógica de Verificación de Disponibilidad ---


    // 2. Insertar el turno
    const sqlTurno = `
      INSERT INTO turnos (id_cliente, id_empleado, id_servicio, fecha, hora, duracion_final, precio_servicio_base, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [resultTurno] = await connection.query(sqlTurno, [
        id_cliente, id_empleado, id_servicio, fecha, hora, duracionServicio, precioBaseServicio, estadoInicialTurno
    ]);
    const newTurnoId = resultTurno.insertId;

    // 3. Insertar el registro de cobro inicial asociado al turno
    const sqlCobro = `
      INSERT INTO cobros (id_turno, monto_total, estado_pago)
      VALUES (?, ?, ?)
    `;
    // El monto total inicial es el precio base del servicio
    await connection.query(sqlCobro, [newTurnoId, precioBaseServicio, estadoInicialCobro]);

    // 4. Confirmar transacción
    await connection.commit();

    // 5. Responder con éxito
    res.status(201).json({
      mensaje: '✅ Turno registrado y cobro inicial creado con éxito',
      turnoId: newTurnoId
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error('❌ Error al insertar turno y/o cobro:', err);
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
       // Determinar qué FK falló (cliente, empleado o servicio)
       let missingEntity = 'cliente, empleado o servicio especificado';
       if(err.message.includes('fk_turno_cliente_usuario')) missingEntity = 'cliente';
       if(err.message.includes('fk_turno_empleado')) missingEntity = 'empleado';
       if(err.message.includes('fk_turno_servicio')) missingEntity = 'servicio';
       return res.status(404).json({ mensaje: `Error: El ${missingEntity} no existe.` });
    }
    res.status(500).json({ mensaje: 'Error del servidor al registrar el turno' });
  } finally {
    if (connection) connection.release();
  }
};

// ... (resto de controladores de turno: reprogramTurno, updateTurno, getAllTurnos, etc.)
// ¡IMPORTANTE! Cuando un turno se CANCELA (ej. en updateTurno o si creas un controlador específico),
// deberías también actualizar el estado del cobro asociado a 'cancelado'.
// Ejemplo dentro de la lógica de cancelación de turno:
// const sqlUpdateCobro = 'UPDATE cobros SET estado_pago = "cancelado" WHERE id_turno = ?';
// await connection.query(sqlUpdateCobro, [turnoId]);

// Controlador para reprogramar un turno (PUT /turnos/:id)
const reprogramTurno = async (req, res) => {
  // Se asume que el ID y el cuerpo fueron validados por un middleware anterior
  const turnoId = req.params.id;
  const { nuevaFecha, nuevaHora, costoExtraManual } = req.body;

  const sql = `
    UPDATE turnos
    SET fecha = ?, hora = ?, estado = 'reprogramado', costo_extra = ?
    WHERE id = ?
  `;

  try {
    // Ejecutamos la consulta
    const [result] = await db.query(sql, [nuevaFecha, nuevaHora, costoExtraManual || 0, turnoId]);

    // Verificamos si algún turno fue afectado (si el ID existía)
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Turno no encontrado para reprogramar' });
    }

    // Respondemos con éxito
    res.json({ mensaje: `Turno ${turnoId} reprogramado con éxito` });

  } catch (err) {
    console.error(`Error al reprogramar turno ${turnoId}:`, err);
    res.status(500).json({ mensaje: 'Error del servidor al reprogramar el turno' });
  }
};

// Controlador para actualizar parcialmente un turno (PATCH /turnos/:id)
const updateTurno = async (req, res) => {
  // Se asume que el ID y el cuerpo fueron validados por un middleware anterior
  const turnoId = req.params.id;
  const camposAActualizar = req.body;

  // Solo actualizaremos los campos permitidos y proporcionados
  // Nota: La validación de que 'estado' sea válido debería hacerse en el middleware validator
  const camposPermitidos = ['estado', 'costo_extra', 'motivo_extra', 'fecha', 'hora']; // Manteniendo 'fecha' como en tu ejemplo
  const updates = [];
  const values = [];

  for (const campo of camposPermitidos) {
    if (camposAActualizar.hasOwnProperty(campo)) {
       // Permitir establecer a null si se desea y el campo lo permite (ej. motivo_extra)
       if ((campo === 'motivo_extra') && camposAActualizar[campo] === null) {
            updates.push(`${campo} = ?`);
            values.push(null);
       } else if (camposAActualizar[campo] !== undefined) { // Evitar actualizar si el valor es undefined
            updates.push(`${campo} = ?`);
            values.push(camposAActualizar[campo]);
       }
    }
  }

  // Si no hay campos válidos para actualizar después de filtrar
  if (updates.length === 0) {
     return res.status(400).json({
         mensaje: `No se proporcionaron campos válidos para actualizar (permitidos: ${camposPermitidos.join(', ')}).`
      });
  }

  // Construir la consulta SQL final
  const sql = `UPDATE turnos SET ${updates.join(', ')} WHERE id = ?`;
  values.push(turnoId); // Añadir el ID al final de los valores

  try {
    // Ejecutar la consulta
    const [result] = await db.query(sql, values);

    // Verificar si se afectó alguna fila
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Turno no encontrado para actualizar' });
    }

    // Responder con éxito
    res.json({ mensaje: `Turno ${turnoId} actualizado correctamente.` });

  } catch (err) {
    console.error(`Error al actualizar turno ${turnoId}:`, err);
    // Aquí podrías añadir manejo específico para otros errores si fuera necesario
    res.status(500).json({ mensaje: 'Error del servidor al actualizar el turno' });
  }
};

// Controlador para obtener todos los turnos (GET /turnos)
const getAllTurnos = async (req, res) => {
  // Opcional: Implementar filtros por fecha, clienteId, empleadoId, estado desde req.query
  const { fecha, clienteId, empleadoId, estado } = req.query;

  // Consulta SQL CORREGIDA con los JOINs correctos
  let sql = `
    SELECT
      t.id AS turno_id,
      t.fecha,
      t.hora,
      t.estado,
      t.precio_servicio_base,
      t.duracion_final,
      t.notas_turno,
      t.fecha_creacion,

      -- Datos del Cliente (desde Usuarios)
      uc.id AS cliente_id,
      uc.nombre AS cliente_nombre,
      uc.telefono AS cliente_telefono,
      uc.email AS cliente_email, -- Añadido email cliente

      -- Datos del Empleado (desde Empleados y Usuarios)
      e.id AS empleado_id,
      ue.nombre AS empleado_nombre, -- Nombre del empleado (desde usuarios)
      e.especialidad AS empleado_especialidad, -- Añadido especialidad

      -- Datos del Servicio
      s.id AS servicio_id,
      s.nombre AS servicio_nombre,
      s.precio AS servicio_precio_actual, -- Precio actual del servicio (puede diferir del base guardado)
      s.duracion AS servicio_duracion_base -- Duración base del servicio

    FROM turnos t
    -- JOIN para obtener info del Cliente (Usuario con rol Cliente)
    JOIN usuarios uc ON t.id_cliente = uc.id AND uc.rol = 'cliente'
    -- JOIN para obtener info del Servicio
    JOIN servicios s ON t.id_servicio = s.id
    -- JOIN para obtener info del Empleado
    JOIN empleados e ON t.id_empleado = e.id
    -- JOIN para obtener el nombre del Empleado (desde Usuarios)
    JOIN usuarios ue ON e.id_usuario = ue.id
  `;

  const conditions = [];
  const values = [];

  // Añadir filtros basados en query params
  if (fecha) { conditions.push('t.fecha = ?'); values.push(fecha); }
  if (clienteId) { conditions.push('t.id_cliente = ?'); values.push(clienteId); }
  if (empleadoId) { conditions.push('t.id_empleado = ?'); values.push(empleadoId); }
  if (estado) { conditions.push('t.estado = ?'); values.push(estado); }
  // ... otros filtros ...

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY t.fecha DESC, t.hora DESC'; // Más reciente primero

  try {
    const [turnos] = await db.query(sql, values);
    res.json(turnos);
  } catch (err) {
    console.error('❌ Error al obtener la lista de turnos:', err); // Mostrará el error real si persiste
    res.status(500).json({ mensaje: 'Error del servidor al obtener los turnos' });
  }
};


// --- Controladores Faltantes (Ejemplos - si los necesitas) ---

// Controlador para obtener un turno específico por ID (GET /turnos/:id)
const getTurnoById = async (req, res) => {
  const { id } = req.params; // Asume validación previa
  // Consulta SQL CORREGIDA con los JOINs correctos
  const sql = `
      SELECT
          t.id AS turno_id, t.fecha, t.hora, t.estado, t.precio_servicio_base, t.duracion_final,
          t.notas_turno, t.fecha_creacion,
          uc.id AS cliente_id, uc.nombre AS cliente_nombre, uc.telefono AS cliente_telefono, uc.email AS cliente_email,
          e.id AS empleado_id, ue.nombre AS empleado_nombre, e.especialidad AS empleado_especialidad,
          s.id AS servicio_id, s.nombre AS servicio_nombre, s.precio AS servicio_precio_actual, s.duracion AS servicio_duracion_base
      FROM turnos t
      JOIN usuarios uc ON t.id_cliente = uc.id AND uc.rol = 'cliente'
      JOIN servicios s ON t.id_servicio = s.id
      JOIN empleados e ON t.id_empleado = e.id
      JOIN usuarios ue ON e.id_usuario = ue.id
      WHERE t.id = ?
  `;
  try {
      const [results] = await db.query(sql, [id]);
      if (results.length === 0) {
          return res.status(404).json({ mensaje: 'Turno no encontrado.' });
      }
      res.json(results[0]);
  } catch (err) {
      console.error(`❌ Error al obtener turno ${id}:`, err);
      res.status(500).json({ mensaje: 'Error del servidor al obtener el turno.' });
  }
};


// Controlador para eliminar un turno (DELETE /turnos/:id)
const deleteTurno = async (req, res) => {
    const { id } = req.params; // Asume validación previa
    const sql = 'DELETE FROM turnos WHERE id = ?';
    try {
        const [result] = await db.query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Turno no encontrado para eliminar.' });
        }
        res.status(200).json({ mensaje: `Turno ${id} eliminado correctamente.` });
        // o res.status(204).send();
    } catch (err) {
        console.error(`❌ Error al eliminar turno ${id}:`, err);
         // Aquí no suele haber errores de FK al borrar turnos, a menos que otra tabla dependa de turnos
        res.status(500).json({ mensaje: 'Error del servidor al eliminar el turno.' });
    }
};


// Exportar todos los controladores
module.exports = {
  createTurno,
  reprogramTurno,
  updateTurno,
  getAllTurnos,
  getTurnoById,  // Exportar si decides implementarlo
  deleteTurno    // Exportar si decides implementarlo
};