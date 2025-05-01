// controllers/clienteController.js (Adaptado para tabla usuarios con rol=cliente)
const db = require('../db');
const bcrypt = require('bcrypt'); // Necesario para hashear contraseña al crear

// Obtener todos los usuarios con rol 'cliente'
const getAllClientes = async (req, res) => {
    // Filtros opcionales por nombre, email, telefono
    const { nombre, email, telefono } = req.query;
    let sql = `
        SELECT id, nombre, email, telefono, fecha_nacimiento, sexo, fecha_registro
        FROM usuarios
        WHERE rol = 'cliente'
    `;
    const values = [];
    const conditions = []; // Ya filtramos por rol, empezamos aquí

    if (nombre) { conditions.push('nombre LIKE ?'); values.push(`%${nombre}%`); }
    if (email) { conditions.push('email = ?'); values.push(email); }
    if (telefono) { conditions.push('telefono = ?'); values.push(telefono); }

    if(conditions.length > 0) {
        sql += ' AND ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY nombre ASC';

    try {
        const [clientes] = await db.query(sql, values);
        res.json(clientes);
    } catch (err) {
        console.error('❌ Error al obtener clientes (usuarios):', err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// Obtener un usuario específico (cliente) por ID
const getClienteById = async (req, res) => {
    const { id } = req.params; // ID de usuario, validado
    const sql = `
        SELECT id, nombre, email, telefono, fecha_nacimiento, sexo, fecha_registro, rol
        FROM usuarios
        WHERE id = ? AND rol = 'cliente'
    `; // Asegurarse de que sea un cliente
    try {
        const [results] = await db.query(sql, [id]);
        if (results.length === 0) {
            return res.status(404).json({ mensaje: 'Cliente (usuario) no encontrado o no tiene rol cliente.' });
        }
        // Excluir contraseña del resultado
        const { password, ...clienteData } = results[0];
        res.json(clienteData);
    } catch (err) {
        console.error(`❌ Error al obtener cliente ${id}:`, err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// Crear un nuevo cliente (registro en tabla usuarios)
const createCliente = async (req, res) => {
    // Datos validados
    const { nombre, email, password, telefono, fecha_nacimiento, sexo } = req.body;
    const rolCliente = 'cliente'; // Forzar rol

    try {
        // Hashear contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const sql = `
            INSERT INTO usuarios (nombre, email, password, rol, telefono, fecha_nacimiento, sexo)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(sql, [
            nombre, email, hashedPassword, rolCliente, telefono, fecha_nacimiento || null, sexo || null
        ]);

        res.status(201).json({
            mensaje: '✅ Cliente registrado con éxito',
            clienteId: result.insertId // ID del nuevo usuario/cliente
        });
    } catch (err) {
        // Manejar duplicados (validador debería atraparlos)
        if (err.code === 'ER_DUP_ENTRY') {
             let campo = err.message.includes('idx_unique_email') ? 'correo electrónico' :
                         err.message.includes('idx_unique_telefono') ? 'teléfono' : 'valor único';
            return res.status(409).json({ mensaje: `Error: Ya existe un usuario con ese ${campo}.` });
        }
        console.error('❌ Error al registrar cliente:', err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// Actualizar un cliente (registro en tabla usuarios)
const updateCliente = async (req, res) => {
    const { id } = req.params; // ID usuario, validado
    const campos = req.body;   // Campos validados

    // Construir query dinámica solo con los campos permitidos para clientes
    const camposPermitidos = ['nombre', 'email', 'telefono', 'fecha_nacimiento', 'sexo'];
    const updates = [];
    const values = [];

    for (const campo of camposPermitidos) {
        if (campos.hasOwnProperty(campo)) {
            if ((campo === 'telefono' || campo === 'fecha_nacimiento' || campo === 'sexo') && campos[campo] === null) {
                updates.push(`${campo} = ?`); values.push(null);
            } else if (campos[campo] !== undefined) {
                updates.push(`${campo} = ?`); values.push(campos[campo]);
            }
        }
    }

    if (updates.length === 0) {
        return res.status(400).json({ mensaje: 'No se proporcionaron campos válidos para actualizar.' });
    }

    const sql = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ? AND rol = 'cliente'`; // Asegurar que actualizamos un cliente
    values.push(id);

    try {
        const [result] = await db.query(sql, values);
        if (result.affectedRows === 0) {
            // Puede ser porque el ID no existe O porque no tenía rol 'cliente'
             // Verificar si el usuario existe pero no es cliente
             const [userCheck] = await db.query('SELECT rol FROM usuarios WHERE id = ?', [id]);
             if (userCheck.length > 0 && userCheck[0].rol !== 'cliente') {
                 return res.status(403).json({ mensaje: `El usuario ${id} existe pero no es un cliente.` }); // 403 Forbidden
             }
            return res.status(404).json({ mensaje: 'Cliente no encontrado para actualizar.' });
        }
        res.status(200).json({ mensaje: `Cliente ${id} actualizado correctamente.` });
    } catch (err) {
        // Manejar duplicados al actualizar
        if (err.code === 'ER_DUP_ENTRY') {
             let campo = err.message.includes('idx_unique_email') ? 'correo electrónico' :
                         err.message.includes('idx_unique_telefono') ? 'teléfono' : 'valor único';
            return res.status(409).json({ mensaje: `Error: Ya existe otro usuario con ese ${campo}.` });
        }
        console.error(`❌ Error al actualizar cliente ${id}:`, err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

// Eliminar un cliente (registro en tabla usuarios) - ¡CUIDADO!
const deleteCliente = async (req, res) => {
    const { id } = req.params; // ID usuario, validado

    // Recordar que ON DELETE RESTRICT en turnos/historiales impedirá esto si hay registros asociados.
    const sql = `DELETE FROM usuarios WHERE id = ? AND rol = 'cliente'`;

    try {
        const [result] = await db.query(sql, [id]);
        if (result.affectedRows === 0) {
            // Verificar si existe pero no es cliente
             const [userCheck] = await db.query('SELECT rol FROM usuarios WHERE id = ?', [id]);
             if (userCheck.length > 0 && userCheck[0].rol !== 'cliente') {
                 return res.status(403).json({ mensaje: `El usuario ${id} existe pero no es un cliente.` });
             }
            return res.status(404).json({ mensaje: 'Cliente no encontrado para eliminar.' });
        }
        res.status(200).json({ mensaje: `Cliente ${id} eliminado correctamente.` });
        // O res.status(204).send();
    } catch (err) {
        // Manejar error de FK (ER_ROW_IS_REFERENCED_2)
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            let dependencia = 'registros asociados';
            if (err.message.includes('fk_turno_cliente_usuario')) dependencia = 'turnos';
            else if (err.message.includes('fk_historial_cliente_usuario')) dependencia = 'historiales clínicos';
          return res.status(409).json({
             mensaje: `Error: No se puede eliminar el cliente ${id} porque tiene ${dependencia}. Elimine o reasigne ${dependencia} primero.`
           });
        }
        console.error(`❌ Error al eliminar cliente ${id}:`, err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};


module.exports = {
    getAllClientes,
    getClienteById,
    createCliente,
    updateCliente,
    deleteCliente
};