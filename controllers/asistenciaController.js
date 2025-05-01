// controllers/asistenciaController.js
const db = require('../db');

// Registrar una entrada de asistencia
const registrarEntrada = async (req, res) => {
    // Obtener id_empleado:
    // Opción 1: Desde el parámetro de la ruta (si un admin registra por otro)
    const empleadoIdFromParam = req.params.empleadoId;
    // Opción 2: Desde el usuario autenticado (si el empleado se loguea)
    // const empleadoIdFromAuth = req.user?.empleadoId; // Asumiendo que tu middleware de auth añade info del empleado a req.user

    const id_empleado = empleadoIdFromParam; // || empleadoIdFromAuth; // Decide qué fuente usar o priorizar
    const { notas } = req.body; // Notas validadas

    if (!id_empleado) {
        return res.status(400).json({ mensaje: 'Falta el ID del empleado (en ruta o autenticación).' });
    }

    // Podríamos añadir lógica aquí para verificar si ya hay una entrada sin salida,
    // pero por simplicidad, solo insertamos el registro.
    const sql = `
        INSERT INTO asistencia_empleados (id_empleado, tipo_registro, notas)
        VALUES (?, 'entrada', ?)
    `;
    try {
        const [result] = await db.query(sql, [id_empleado, notas || null]);
        res.status(201).json({
             mensaje: '✅ Entrada registrada con éxito',
             registroId: result.insertId
            });
    } catch (err) {
        console.error(`❌ Error al registrar entrada para empleado ${id_empleado}:`, err);
         // Podría fallar si el empleadoId no existe (aunque el validador debería atraparlo)
         if (err.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(404).json({ mensaje: `Empleado con ID ${id_empleado} no encontrado.` });
         }
        res.status(500).json({ mensaje: 'Error del servidor al registrar entrada' });
    }
};

// Registrar una salida de asistencia
const registrarSalida = async (req, res) => {
    // Obtener id_empleado (igual que en registrarEntrada)
    const empleadoIdFromParam = req.params.empleadoId;
    // const empleadoIdFromAuth = req.user?.empleadoId;
    const id_empleado = empleadoIdFromParam; // || empleadoIdFromAuth;
    const { notas } = req.body; // Notas validadas

     if (!id_empleado) {
        return res.status(400).json({ mensaje: 'Falta el ID del empleado.' });
    }

    // Podríamos verificar si hay una entrada previa pendiente de salida.
    const sql = `
        INSERT INTO asistencia_empleados (id_empleado, tipo_registro, notas)
        VALUES (?, 'salida', ?)
    `;
    try {
        const [result] = await db.query(sql, [id_empleado, notas || null]);
        res.status(201).json({
            mensaje: '✅ Salida registrada con éxito',
            registroId: result.insertId
        });
    } catch (err) {
        console.error(`❌ Error al registrar salida para empleado ${id_empleado}:`, err);
         if (err.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(404).json({ mensaje: `Empleado con ID ${id_empleado} no encontrado.` });
         }
        res.status(500).json({ mensaje: 'Error del servidor al registrar salida' });
    }
};

// Obtener registros de asistencia para un empleado (con filtros opcionales)
const getRegistrosEmpleado = async (req, res) => {
    const { empleadoId } = req.params; // Validado
    const { fechaDesde, fechaHasta } = req.query; // Opcionales

    let sql = `
        SELECT a.*, u.nombre as nombre_empleado
        FROM asistencia_empleados a
        JOIN empleados e ON a.id_empleado = e.id
        JOIN usuarios u ON e.id_usuario = u.id
        WHERE a.id_empleado = ?
    `;
    const values = [empleadoId];

    // Añadir filtros de fecha si se proporcionan
    if (fechaDesde) {
        sql += ' AND DATE(a.fecha_hora) >= ?'; // Compara solo la parte de la fecha
        values.push(fechaDesde); // Asume formato YYYY-MM-DD
    }
    if (fechaHasta) {
        sql += ' AND DATE(a.fecha_hora) <= ?';
        values.push(fechaHasta);
    }

    sql += ' ORDER BY a.fecha_hora DESC'; // Más reciente primero

    try {
        const [registros] = await db.query(sql, values);
        res.json(registros); // Devuelve array (puede ser vacío)
    } catch (err) {
        console.error(`❌ Error al obtener asistencia para empleado ${empleadoId}:`, err);
        res.status(500).json({ mensaje: 'Error del servidor al obtener asistencia' });
    }
};


module.exports = {
  registrarEntrada,
  registrarSalida,
  getRegistrosEmpleado
};