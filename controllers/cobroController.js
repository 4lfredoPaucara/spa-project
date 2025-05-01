// controllers/cobroController.js
const db = require('../db');

/**
 * @description Registra un pago (adelanto o final) para un cobro existente.
 * Actualiza los montos, fechas y estado del cobro.
 * @route PATCH /cobros/:id/registrar-pago
 */
const registrarPago = async (req, res) => {
  const { id: cobroId } = req.params; // ID del cobro, validado
  // Datos del pago, validados
  const { tipo_pago, monto_pagado, metodo_pago, fecha_pago, notas } = req.body;

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Obtener el estado actual del cobro y montos
    const sqlSelect = 'SELECT id_turno, monto_total, monto_adelanto, monto_pendiente, estado_pago FROM cobros WHERE id = ? FOR UPDATE'; // FOR UPDATE para bloquear la fila
    const [cobrosActuales] = await connection.query(sqlSelect, [cobroId]);

    if (cobrosActuales.length === 0) {
      await connection.rollback(); // No es necesario pero buena práctica
      return res.status(404).json({ mensaje: `Registro de cobro con ID ${cobroId} no encontrado.` });
    }
    const cobro = cobrosActuales[0];

    // 2. Validaciones de Lógica de Negocio
    if (cobro.estado_pago === 'pagado_completo' || cobro.estado_pago === 'cancelado') {
       await connection.rollback();
       return res.status(409).json({ mensaje: `El cobro ya está '${cobro.estado_pago}' y no acepta más pagos.` }); // 409 Conflict
    }
    if (tipo_pago === 'adelanto' && cobro.estado_pago !== 'pendiente_adelanto') {
        await connection.rollback();
        return res.status(409).json({ mensaje: `Ya se registró un adelanto para este cobro (estado actual: ${cobro.estado_pago}).` });
    }
     if (tipo_pago === 'final' && cobro.estado_pago === 'pendiente_adelanto') {
        await connection.rollback();
        return res.status(409).json({ mensaje: `Se debe registrar el adelanto primero antes del pago final.` });
    }
    // Validar que el monto pagado no exceda lo pendiente (considerando tipo)
    if (tipo_pago === 'adelanto' && monto_pagado > cobro.monto_total) {
        // Podrías permitir sobrepago de adelanto si quieres, pero generalmente no
        await connection.rollback();
        return res.status(400).json({ mensaje: `El monto del adelanto (${monto_pagado}) no puede exceder el monto total (${cobro.monto_total}).` });
    }
    if (tipo_pago === 'final' && monto_pagado > cobro.monto_pendiente) {
        // Permitir sobrepago final podría tener sentido (ej. propina), o no. Lo restringimos por ahora.
         await connection.rollback();
         return res.status(400).json({ mensaje: `El monto final pagado (${monto_pagado}) excede el monto pendiente (${cobro.monto_pendiente}).` });
    }
     if (tipo_pago === 'final' && monto_pagado < cobro.monto_pendiente) {
         // Opcional: ¿Permitir pagos parciales del monto final? Lo restringimos por ahora.
         await connection.rollback();
         return res.status(400).json({ mensaje: `El monto final pagado (${monto_pagado}) es menor al monto pendiente (${cobro.monto_pendiente}). Se requiere el pago completo.` });
    }


    // 3. Preparar la actualización
    const updates = [];
    const values = [];
    let nuevoEstadoPago = cobro.estado_pago; // Empezar con el estado actual

    const fechaPagoReal = fecha_pago ? new Date(fecha_pago) : new Date(); // Usar fecha enviada o actual

    if (tipo_pago === 'adelanto') {
      updates.push('monto_adelanto = ?');
      values.push(monto_pagado);
      updates.push('metodo_pago_adelanto = ?');
      values.push(metodo_pago);
      updates.push('fecha_adelanto = ?');
      values.push(fechaPagoReal);
      // Verificar si con este adelanto se completa el pago total
      if (monto_pagado >= cobro.monto_total) { // Usamos >= por si paga exacto o más
        nuevoEstadoPago = 'pagado_completo';
      } else {
        nuevoEstadoPago = 'adelanto_pagado';
      }
    } else { // tipo_pago === 'final'
      // Asumimos que monto_pagado es igual a monto_pendiente por validación anterior
      updates.push('metodo_pago_final = ?');
      values.push(metodo_pago);
      updates.push('fecha_cobro_final = ?');
      values.push(fechaPagoReal);
      nuevoEstadoPago = 'pagado_completo'; // El pago final siempre completa el cobro
    }

    // Actualizar estado y notas si cambiaron o se proporcionaron
    updates.push('estado_pago = ?');
    values.push(nuevoEstadoPago);
    if (notas !== undefined) { // Permitir actualizar notas con cadena vacía o null
         updates.push('notas = ?');
         values.push(notas);
    }

    // Añadir ID al final para la cláusula WHERE
    values.push(cobroId);

    // 4. Ejecutar la actualización
    const sqlUpdate = `UPDATE cobros SET ${updates.join(', ')} WHERE id = ?`;
    await connection.query(sqlUpdate, values);

    // 5. Confirmar transacción
    await connection.commit();

    // 6. Responder con éxito
    res.status(200).json({
      mensaje: `✅ Pago de tipo '${tipo_pago}' registrado correctamente.`,
      nuevo_estado: nuevoEstadoPago
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error(`❌ Error al registrar pago para cobro ${cobroId}:`, err);
    res.status(500).json({ mensaje: 'Error del servidor al registrar el pago' });
  } finally {
    if (connection) connection.release();
  }
};


// Obtener detalles de un cobro específico (GET /cobros/:id)
const getCobroById = async (req, res) => {
    const { id } = req.params; // Validado
    const sql = `
        SELECT c.*, t.fecha as fecha_turno, t.hora as hora_turno,
               u.nombre as nombre_cliente, s.nombre as nombre_servicio
        FROM cobros c
        JOIN turnos t ON c.id_turno = t.id
        JOIN usuarios u ON t.id_cliente = u.id
        JOIN servicios s ON t.id_servicio = s.id
        WHERE c.id = ?
    `;
    try {
        const [results] = await db.query(sql, [id]);
        if (results.length === 0) {
            return res.status(404).json({ mensaje: `Registro de cobro con ID ${id} no encontrado.` });
        }
        res.json(results[0]);
    } catch (err) {
        console.error(`❌ Error al obtener cobro ${id}:`, err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// Obtener cobros por ID de Turno (GET /cobros/turno/:turnoId)
const getCobroByTurnoId = async (req, res) => {
    const { turnoId } = req.params; // Validado
     const sql = `SELECT c.* FROM cobros c WHERE c.id_turno = ?`; // Simple, o con JOINs como getCobroById
    try {
        const [results] = await db.query(sql, [turnoId]);
        if (results.length === 0) {
            // Podría significar que el turno existe pero el cobro aún no se creó (si la creación es separada)
            return res.status(404).json({ mensaje: `No se encontró registro de cobro para el turno ${turnoId}.` });
        }
        res.json(results[0]); // Debería haber solo uno por turno
    } catch (err) {
        console.error(`❌ Error al obtener cobro para turno ${turnoId}:`, err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};


// (Opcional) Obtener todos los cobros con filtros (GET /cobros)
const getAllCobros = async (req, res) => {
    // Implementar filtros por estado_pago, cliente, rango de fechas, etc.
    let sql = `
        SELECT c.*, t.fecha as fecha_turno, u.nombre as nombre_cliente, s.nombre as nombre_servicio
        FROM cobros c
        JOIN turnos t ON c.id_turno = t.id
        JOIN usuarios u ON t.id_cliente = u.id
        JOIN servicios s ON t.id_servicio = s.id
        /* WHERE ... filtros ... */
        ORDER BY t.fecha DESC, c.id DESC
    `;
    try {
        const [cobros] = await db.query(sql /*, [valores_filtros]*/);
        res.json(cobros);
    } catch (err) {
        console.error('❌ Error al obtener lista de cobros:', err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};


module.exports = {
  registrarPago,
  getCobroById,
  getCobroByTurnoId,
  getAllCobros // Exportar si la implementas
  // createCobroManual // Si lo implementas
};