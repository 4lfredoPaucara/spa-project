// controllers/empleadoController.js
const db = require('../db');
const bcrypt = require('bcrypt');

// Crear un nuevo empleado (Usuario + Empleado)
const createEmpleado = async (req, res) => {
  // Datos validados
  const { nombre, email, password, rol, telefono, especialidad } = req.body;
  // 'activo' por defecto es TRUE en la BD de empleados

  // Usar transacción para asegurar atomicidad
  let connection;
  try {
    connection = await db.getConnection(); // Obtener conexión del pool
    await connection.beginTransaction();    // Iniciar transacción

    // 1. Hashear contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 2. Insertar en 'usuarios'
    const sqlUsuario = `
      INSERT INTO usuarios (nombre, email, password, rol, telefono)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [resultUsuario] = await connection.query(sqlUsuario, [nombre, email, hashedPassword, rol, telefono || null]);
    const newUserId = resultUsuario.insertId;

    // 3. Insertar en 'empleados'
    const sqlEmpleado = `
      INSERT INTO empleados (id_usuario, especialidad)
      VALUES (?, ?)
    `;
    // No insertamos 'activo' explícitamente para usar el DEFAULT TRUE de la tabla
    const [resultEmpleado] = await connection.query(sqlEmpleado, [newUserId, especialidad || null]);
    const newEmpleadoId = resultEmpleado.insertId;

    // 4. Confirmar transacción
    await connection.commit();

    // 5. Responder con éxito
    res.status(201).json({
      mensaje: '✅ Empleado creado con éxito',
      empleado: {
        id: newEmpleadoId, // ID de empleado
        id_usuario: newUserId, // ID de usuario
        nombre, email, rol, telefono, especialidad, activo: true // Asumimos activo=true
      }
    });

  } catch (err) {
    // Si algo falla, revertir transacción
    if (connection) await connection.rollback();

    // Manejar error de email duplicado (debería ser capturado por validador, pero doble check)
    if (err.code === 'ER_DUP_ENTRY' && err.message.includes('idx_unique_email')) {
      return res.status(409).json({ mensaje: 'Error: El correo electrónico ya está registrado.' });
    }
    console.error('❌ Error al crear empleado:', err);
    res.status(500).json({ mensaje: 'Error del servidor al crear empleado' });
  } finally {
    // Siempre liberar la conexión al pool
    if (connection) connection.release();
  }
};

// Obtener todos los empleados
const getAllEmpleados = async (req, res) => {
  // Opcional: Añadir filtros por activo, especialidad, etc. desde req.query
   const { activo, especialidad } = req.query;

  let sql = `
    SELECT
      e.id AS empleado_id, e.especialidad, e.activo,
      u.id AS usuario_id, u.nombre, u.email, u.telefono, u.rol, u.fecha_registro
    FROM empleados e
    JOIN usuarios u ON e.id_usuario = u.id
  `;
   const conditions = [];
   const values = [];

   if (activo !== undefined) {
       conditions.push('e.activo = ?');
       values.push(activo === 'true' || activo === '1'); // Convertir a booleano
   }
   if (especialidad) {
        conditions.push('e.especialidad LIKE ?');
        values.push(`%${especialidad}%`);
   }
   // ... otros filtros ...

   if(conditions.length > 0) {
       sql += ' WHERE ' + conditions.join(' AND ');
   }

  sql += ' ORDER BY u.nombre ASC';

  try {
    const [empleados] = await db.query(sql, values);
    res.json(empleados);
  } catch (err) {
    console.error('❌ Error al obtener empleados:', err);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Obtener un empleado por su ID de empleado
const getEmpleadoById = async (req, res) => {
  const { id } = req.params; // ID de empleado, validado
  const sql = `
    SELECT
      e.id AS empleado_id, e.especialidad, e.activo,
      u.id AS usuario_id, u.nombre, u.email, u.telefono, u.rol, u.fecha_registro
    FROM empleados e
    JOIN usuarios u ON e.id_usuario = u.id
    WHERE e.id = ?
  `;
  try {
    const [results] = await db.query(sql, [id]);
    if (results.length === 0) {
      return res.status(404).json({ mensaje: 'Empleado no encontrado.' });
    }
    res.json(results[0]);
  } catch (err) {
    console.error(`❌ Error al obtener empleado ${id}:`, err);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Actualizar un empleado (parcialmente)
const updateEmpleado = async (req, res) => {
  const { id } = req.params; // ID de empleado, validado
  const campos = req.body; // Campos validados

  // Obtener el id_usuario asociado a este empleado_id
  let id_usuario;
   try {
       const [emp] = await db.query('SELECT id_usuario FROM empleados WHERE id = ?', [id]);
       if (emp.length === 0) {
           return res.status(404).json({ mensaje: 'Empleado no encontrado para actualizar.' });
       }
       id_usuario = emp[0].id_usuario;
   } catch (fetchErr) {
       console.error("Error buscando id_usuario:", fetchErr);
       return res.status(500).json({ mensaje: 'Error del servidor.' });
   }


  // Construir updates para tabla 'usuarios'
  const camposUsuario = ['nombre', 'email', 'telefono']; // Campos de 'usuarios' actualizables aquí
  const updatesUsuario = [];
  const valuesUsuario = [];
  for (const campo of camposUsuario) {
    if (campos.hasOwnProperty(campo)) {
        // Manejar null explícito si el campo lo permite (ej: telefono)
        if (campo === 'telefono' && campos[campo] === null) {
            updatesUsuario.push(`${campo} = ?`); valuesUsuario.push(null);
        } else if (campos[campo] !== undefined) {
            updatesUsuario.push(`${campo} = ?`); valuesUsuario.push(campos[campo]);
        }
    }
  }

  // Construir updates para tabla 'empleados'
  const camposEmpleado = ['especialidad', 'activo']; // Campos de 'empleados' actualizables aquí
  const updatesEmpleado = [];
  const valuesEmpleado = [];
  for (const campo of camposEmpleado) {
    if (campos.hasOwnProperty(campo)) {
         if (campo === 'especialidad' && campos[campo] === null) {
             updatesEmpleado.push(`${campo} = ?`); valuesEmpleado.push(null);
         } else if (campos[campo] !== undefined) {
             updatesEmpleado.push(`${campo} = ?`); valuesEmpleado.push(campos[campo]);
         }
    }
  }

  // Verificar que haya algo que actualizar
  if (updatesUsuario.length === 0 && updatesEmpleado.length === 0) {
    return res.status(400).json({ mensaje: 'No se proporcionaron campos válidos para actualizar.' });
  }

  // Usar transacción si actualizamos ambas tablas
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    let affectedRowsTotal = 0;

    // Actualizar tabla 'usuarios' si hay cambios
    if (updatesUsuario.length > 0) {
      const sqlUpdateUsuario = `UPDATE usuarios SET ${updatesUsuario.join(', ')} WHERE id = ?`;
      valuesUsuario.push(id_usuario); // Usar el id_usuario obtenido
      const [resultU] = await connection.query(sqlUpdateUsuario, valuesUsuario);
      affectedRowsTotal += resultU.affectedRows; // Contar filas afectadas (puede ser 0 si no hubo cambio real)
       if (resultU.affectedRows === 0 && resultU.changedRows === 0 && updatesUsuario.length > 0) {
           // Si intentamos actualizar pero no cambió nada y no afectó filas (el ID es correcto)
           console.log(`Update en usuarios para ${id_usuario} no resultó en cambios.`);
       }
    }

    // Actualizar tabla 'empleados' si hay cambios
    if (updatesEmpleado.length > 0) {
      const sqlUpdateEmpleado = `UPDATE empleados SET ${updatesEmpleado.join(', ')} WHERE id = ?`;
      valuesEmpleado.push(id); // Usar el id de empleado del parámetro
      const [resultE] = await connection.query(sqlUpdateEmpleado, valuesEmpleado);
       affectedRowsTotal += resultE.affectedRows; // Sumar filas afectadas
        if (resultE.affectedRows === 0 && resultE.changedRows === 0 && updatesEmpleado.length > 0) {
           console.log(`Update en empleados para ${id} no resultó en cambios.`);
       }
    }

     // Comprobar si al menos una actualización afectó alguna fila (realmente encontró el registro)
     // Nota: affectedRows puede ser 0 si los valores nuevos son iguales a los existentes.
     //       changedRows (MySQL) es más preciso para saber si hubo cambio real.
     //       Por simplicidad, aquí solo verificamos si *alguna* update afectó filas,
     //       lo que implica que al menos el empleado/usuario existía.
     //       La validación de 404 ya se hizo al buscar id_usuario.


    await connection.commit();
    res.status(200).json({ mensaje: `Empleado ${id} actualizado correctamente.` });

  } catch (err) {
    if (connection) await connection.rollback();
    // Manejar error de email duplicado
    if (err.code === 'ER_DUP_ENTRY' && err.message.includes('idx_unique_email')) {
       return res.status(409).json({ mensaje: 'Error: El correo electrónico ya está en uso por otro usuario.' });
    }
    console.error(`❌ Error al actualizar empleado ${id}:`, err);
    res.status(500).json({ mensaje: 'Error del servidor' });
  } finally {
    if (connection) connection.release();
  }
};

// Asignar un servicio a un empleado
const assignServicio = async (req, res) => {
    const { id: empleadoId } = req.params; // ID Empleado validado
    const { id_servicio: servicioId } = req.body; // ID Servicio validado

    // Usamos INSERT IGNORE para evitar error si la asignación ya existe
    const sql = 'INSERT IGNORE INTO empleados_servicios (id_empleado, id_servicio) VALUES (?, ?)';
    try {
        const [result] = await db.query(sql, [empleadoId, servicioId]);
        if (result.affectedRows > 0) {
             res.status(201).json({ mensaje: `Servicio ${servicioId} asignado al empleado ${empleadoId}.` });
        } else {
             res.status(200).json({ mensaje: `El servicio ${servicioId} ya estaba asignado al empleado ${empleadoId}.` });
        }
    } catch (err) {
         // Podría fallar si el empleadoId o servicioId se borraron justo después de validar (raro)
        console.error(`❌ Error al asignar servicio ${servicioId} a empleado ${empleadoId}:`, err);
        res.status(500).json({ mensaje: 'Error del servidor al asignar servicio.' });
    }
};

// Desasignar un servicio de un empleado
const removeServicio = async (req, res) => {
    const { id: empleadoId, servicioId } = req.params; // IDs validados

    const sql = 'DELETE FROM empleados_servicios WHERE id_empleado = ? AND id_servicio = ?';
    try {
        const [result] = await db.query(sql, [empleadoId, servicioId]);
        if (result.affectedRows > 0) {
             res.status(200).json({ mensaje: `Servicio ${servicioId} desasignado del empleado ${empleadoId}.` });
        } else {
             res.status(404).json({ mensaje: `La asignación del servicio ${servicioId} al empleado ${empleadoId} no existía.` });
        }
    } catch (err) {
        console.error(`❌ Error al desasignar servicio ${servicioId} de empleado ${empleadoId}:`, err);
        res.status(500).json({ mensaje: 'Error del servidor al desasignar servicio.' });
    }
};

// Obtener los servicios asignados a un empleado
const getAssignedServicios = async (req, res) => {
     const { id: empleadoId } = req.params; // ID Empleado validado
     const sql = `
        SELECT s.*
        FROM servicios s
        JOIN empleados_servicios es ON s.id = es.id_servicio
        WHERE es.id_empleado = ?
        ORDER BY s.nombre ASC
     `;
      try {
        const [servicios] = await db.query(sql, [empleadoId]);
        res.json(servicios); // Devolver array (puede ser vacío)
      } catch (err) {
        console.error(`❌ Error al obtener servicios para empleado ${empleadoId}:`, err);
        res.status(500).json({ mensaje: 'Error del servidor' });
      }
};

const deleteEmpleado = async (req, res) => {
    const { id } = req.params; // ID de empleado, validado
    const sql = 'DELETE FROM empleados WHERE id = ?';
    try {
        const [result] = await db.query(sql, [id]);
        if (result.affectedRows === 0) {
        return res.status(404).json({ mensaje: 'Empleado no encontrado.' });
        }
        res.status(200).json({ mensaje: `Empleado ${id} eliminado.` });
    } catch (err) {
        console.error(`❌ Error al eliminar empleado ${id}:`, err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
    }

module.exports = {
  createEmpleado,
  getAllEmpleados,
  getEmpleadoById,
  updateEmpleado,
  deleteEmpleado, // Decidimos no implementar hard delete por ahora
  assignServicio,
  removeServicio,
  getAssignedServicios
};