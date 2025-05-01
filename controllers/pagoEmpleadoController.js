// controllers/pagoEmpleadoController.js
const db = require('../db');

// Crear un nuevo registro de pago a empleado
const createPagoEmpleado = async (req, res) => {
    // Datos validados
    const {
        id_empleado, fecha_pago, periodo_inicio, periodo_fin,
        monto_bruto, deducciones, metodo_pago, referencia_pago, notas
    } = req.body;

    // monto_neto se calcula automáticamente por la BD

    const sql = `
        INSERT INTO pagos_empleados
            (id_empleado, fecha_pago, periodo_inicio, periodo_fin, monto_bruto, deducciones, metodo_pago, referencia_pago, notas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    try {
        const [result] = await db.query(sql, [
            id_empleado, fecha_pago, periodo_inicio, periodo_fin,
            monto_bruto, deducciones || 0.00, // Usar 0 si no se especifican deducciones
            metodo_pago || null, referencia_pago || null, notas || null
        ]);
        res.status(201).json({
            mensaje: '✅ Pago a empleado registrado con éxito',
            pagoId: result.insertId
        });
    } catch (err) {
        console.error('❌ Error al registrar pago a empleado:', err);
         // No debería fallar FK si el validador funcionó
        res.status(500).json({ mensaje: 'Error del servidor al registrar el pago' });
    }
};

// Obtener todos los pagos a empleados (con filtros opcionales)
const getAllPagos = async (req, res) => {
    // Opcional: Implementar filtros por empleadoId, rango de fecha_pago, rango de periodo
    const { empleadoId, fechaPagoDesde, fechaPagoHasta, periodoDesde, periodoHasta } = req.query;

    let sql = `
        SELECT p.*, u.nombre as nombre_empleado
        FROM pagos_empleados p
        JOIN empleados e ON p.id_empleado = e.id
        JOIN usuarios u ON e.id_usuario = u.id
    `;
    const conditions = [];
    const values = [];

    if (empleadoId) {
        conditions.push('p.id_empleado = ?');
        values.push(empleadoId);
    }
    if (fechaPagoDesde) {
        conditions.push('p.fecha_pago >= ?');
        values.push(fechaPagoDesde);
    }
     if (fechaPagoHasta) {
        conditions.push('p.fecha_pago <= ?');
        values.push(fechaPagoHasta);
    }
     if (periodoDesde) {
        conditions.push('p.periodo_fin >= ?'); // Pagos cuyo periodo termina después del inicio buscado
        values.push(periodoDesde);
    }
      if (periodoHasta) {
        conditions.push('p.periodo_inicio <= ?'); // Pagos cuyo periodo empieza antes del fin buscado
        values.push(periodoHasta);
    }
    //... otros filtros

    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY p.fecha_pago DESC, p.id DESC'; // Más reciente primero

    try {
        const [pagos] = await db.query(sql, values);
        res.json(pagos);
    } catch (err) {
        console.error('❌ Error al obtener pagos a empleados:', err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// Obtener un pago específico por su ID
const getPagoById = async (req, res) => {
    const { pagoId } = req.params; // Validado
    const sql = `
        SELECT p.*, u.nombre as nombre_empleado
        FROM pagos_empleados p
        JOIN empleados e ON p.id_empleado = e.id
        JOIN usuarios u ON e.id_usuario = u.id
        WHERE p.id = ?
    `;
    try {
        const [results] = await db.query(sql, [pagoId]);
        if (results.length === 0) {
            return res.status(404).json({ mensaje: `Pago con ID ${pagoId} no encontrado.` });
        }
        res.json(results[0]);
    } catch (err) {
        console.error(`❌ Error al obtener pago ${pagoId}:`, err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// Obtener todos los pagos de un empleado específico
const getPagosByEmpleadoId = async (req, res) => {
     const { empleadoId } = req.params; // Validado
     // Reutilizamos la lógica de getAllPagos añadiendo la condición fija
     let sql = `
        SELECT p.*, u.nombre as nombre_empleado
        FROM pagos_empleados p
        JOIN empleados e ON p.id_empleado = e.id
        JOIN usuarios u ON e.id_usuario = u.id
        WHERE p.id_empleado = ?
    `;
     const values = [empleadoId];
     // Podríamos añadir filtros de fecha aquí también si fuera necesario

     sql += ' ORDER BY p.fecha_pago DESC, p.id DESC';

     try {
        const [pagos] = await db.query(sql, values);
        res.json(pagos); // Devuelve array (puede ser vacío)
    } catch (err) {
        console.error(`❌ Error al obtener pagos para empleado ${empleadoId}:`, err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};


// --- Opcional: Funcionalidad de Actualizar / Eliminar Pago ---
// Generalmente, los registros de pago no se modifican ni eliminan una vez hechos,
// se crean registros de ajuste si es necesario. Pero si necesitas la funcionalidad:

// const updatePagoEmpleado = async (req, res) => { /* ... lógica PATCH ... */ };
// const deletePagoEmpleado = async (req, res) => { /* ... lógica DELETE ... */ };


module.exports = {
    createPagoEmpleado,
    getAllPagos,
    getPagoById,
    getPagosByEmpleadoId
    // updatePagoEmpleado, // Exportar si implementas
    // deletePagoEmpleado  // Exportar si implementas
};