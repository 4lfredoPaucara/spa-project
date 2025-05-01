// controllers/reporteController.js
const db = require('../db');

// Reporte: Rendimiento de Empleados (Turnos Atendidos)
const getRendimientoEmpleados = async (req, res) => {
    const { fechaDesde, fechaHasta } = req.query; // Validadas

    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);

    const startDate = fechaDesde || defaultStartDate.toISOString().split('T')[0];
    const endDate = fechaHasta || defaultEndDate.toISOString().split('T')[0];

    // --- Consulta SQL Modificada ---
    const sql = `
        SELECT
            e.id AS empleado_id,
            u.nombre AS nombre_empleado,
            u.rol AS rol_empleado, -- Seleccionamos el rol para confirmar
            e.especialidad,
            COUNT(t.id) AS turnos_atendidos
        FROM turnos t
        JOIN empleados e ON t.id_empleado = e.id
        JOIN usuarios u ON e.id_usuario = u.id  -- Join con usuarios para obtener nombre Y ROL
        WHERE
            t.estado = 'atendido'       -- Solo turnos atendidos
            AND t.fecha BETWEEN ? AND ? -- Dentro del rango de fechas
            AND u.rol = 'terapeuta'     -- <<<--- FILTRO CLAVE: Incluir solo usuarios con rol 'terapeuta'
            -- Si quisieras incluir más roles que atienden (ej. recepcionista si a veces ayuda):
            -- AND u.rol IN ('terapeuta', 'recepcionista')
        GROUP BY
            e.id, u.nombre, u.rol, e.especialidad -- Agrupar también por rol si lo seleccionaste
        ORDER BY
            turnos_atendidos DESC;
    `;
    // --- Fin Consulta Modificada ---

    try {
        const [results] = await db.query(sql, [startDate, endDate]);
        res.json({
            periodo: { inicio: startDate, fin: endDate },
            rendimiento_terapeutas: results // Cambiamos el nombre de la clave para reflejar el filtro
        });
    } catch (err) {
        console.error('❌ Error en reporte rendimiento terapeutas:', err);
        res.status(500).json({ mensaje: 'Error del servidor al generar reporte.' });
    }
};

// Reporte: Resumen de Ingresos (Basado en Cobros Completados)
const getIngresosResumen = async (req, res) => {
    const { fechaDesde, fechaHasta } = req.query; // Validadas

    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);

    const startDate = fechaDesde || defaultStartDate.toISOString().split('T')[0];
    const endDate = fechaHasta || defaultEndDate.toISOString().split('T')[0];

    // Sumar montos de cobros completados dentro del rango de fechas de PAGO FINAL
    const sql = `
        SELECT
            COUNT(*) as cantidad_cobros_completados,
            SUM(monto_total) as ingreso_total,
            SUM(monto_adelanto) as total_adelantos_recibidos,
            AVG(monto_total) as promedio_por_cobro
        FROM cobros
        WHERE
            estado_pago = 'pagado_completo'
            AND DATE(fecha_cobro_final) BETWEEN ? AND ?
            -- Nota: Se usa DATE() para ignorar la hora si fecha_cobro_final es DATETIME
    `;
    try {
        const [results] = await db.query(sql, [startDate, endDate]);
        // results[0] contendrá las sumas y promedios (o NULLs si no hay datos)
        res.json({
            periodo: { inicio: startDate, fin: endDate },
            resumen_ingresos: {
                cantidad_cobros: results[0].cantidad_cobros_completados || 0,
                total_recaudado: results[0].ingreso_total || 0.00,
                total_en_adelantos: results[0].total_adelantos_recibidos || 0.00, // De esos cobros completados
                ingreso_promedio_por_turno: results[0].promedio_por_cobro || 0.00
            }
        });
    } catch (err) {
        console.error('❌ Error en reporte resumen ingresos:', err);
        res.status(500).json({ mensaje: 'Error del servidor al generar reporte.' });
    }
};

// Reporte: Servicios Más Populares (Basado en Turnos Creados o Atendidos)
const getServiciosPopulares = async (req, res) => {
    const { fechaDesde, fechaHasta, estadoTurno } = req.query; // estadoTurno opcional: 'atendido', 'confirmado', etc.

    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);

    const startDate = fechaDesde || defaultStartDate.toISOString().split('T')[0];
    const endDate = fechaHasta || defaultEndDate.toISOString().split('T')[0];

    let sql = `
        SELECT
            s.id AS servicio_id,
            s.nombre AS nombre_servicio,
            COUNT(t.id) AS cantidad_reservas
        FROM turnos t
        JOIN servicios s ON t.id_servicio = s.id
        WHERE
            t.fecha BETWEEN ? AND ?
    `;
    const values = [startDate, endDate];

    // Filtrar por estado si se especifica
    const estadosValidosTurno = ['pendiente','confirmado','cancelado','atendido','ausente','reprogramado'];
    if (estadoTurno && estadosValidosTurno.includes(estadoTurno)) {
        sql += ' AND t.estado = ?';
        values.push(estadoTurno);
    } else {
         // Por defecto, quizás no contar cancelados o ausentes? O contarlos todos?
         // Contaremos todos excepto cancelados/ausentes por defecto
         sql += ' AND t.estado NOT IN (?, ?)';
         values.push('cancelado', 'ausente');
    }


    sql += `
        GROUP BY
            s.id, s.nombre
        ORDER BY
            cantidad_reservas DESC;
    `;

    try {
        const [results] = await db.query(sql, values);
        res.json({
            periodo: { inicio: startDate, fin: endDate },
            filtro_estado: estadoTurno || 'Todos (excepto cancelado/ausente)',
            popularidad: results
        });
    } catch (err) {
        console.error('❌ Error en reporte servicios populares:', err);
        res.status(500).json({ mensaje: 'Error del servidor al generar reporte.' });
    }
};

// Reporte: Log de Asistencia de un Empleado
const getAsistenciaLog = async (req, res) => {
    // empleadoId validado por middleware
    const { empleadoId } = req.params;
    const { fechaDesde, fechaHasta } = req.query; // Validadas

    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 7); // Últimos 7 días por defecto

    const startDate = fechaDesde || defaultStartDate.toISOString().split('T')[0];
    const endDate = fechaHasta || defaultEndDate.toISOString().split('T')[0];


    const sql = `
        SELECT a.id, a.fecha_hora, a.tipo_registro, a.notas, u.nombre as nombre_empleado
        FROM asistencia_empleados a
        JOIN empleados e ON a.id_empleado = e.id
        JOIN usuarios u ON e.id_usuario = u.id
        WHERE a.id_empleado = ?
          AND DATE(a.fecha_hora) BETWEEN ? AND ?
        ORDER BY a.fecha_hora ASC -- Orden cronológico
    `;
    try {
        const [registros] = await db.query(sql, [empleadoId, startDate, endDate]);
        res.json({
             periodo: { inicio: startDate, fin: endDate },
             empleado_id: empleadoId,
             log_asistencia: registros
        });
    } catch (err) {
        console.error(`❌ Error al obtener log asistencia empleado ${empleadoId}:`, err);
        res.status(500).json({ mensaje: 'Error del servidor.' });
    }
};

// --- Otros Reportes Posibles ---
// - Reporte de Horas Trabajadas (requiere lógica de emparejar entrada/salida)
// - Reporte de Clientes Más Frecuentes
// - Reporte de Pagos a Empleados por Periodo


module.exports = {
    getRendimientoEmpleados,
    getIngresosResumen,
    getServiciosPopulares,
    getAsistenciaLog
};