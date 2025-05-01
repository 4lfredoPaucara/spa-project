// controllers/authController.js
const db = require('../db');      // Ajusta la ruta a db.js
const bcrypt = require('bcrypt'); // Para hashear y comparar contraseñas
const jwt = require('jsonwebtoken'); // Para generar tokens JWT
require('dotenv').config();     // Para acceder a variables de entorno como JWT_SECRET

const JWT_SECRET = process.env.JWT_SECRET; // Cargar el secreto desde .env
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET no está definida en el archivo .env");
    process.exit(1); // Detener la aplicación si no hay secreto JWT
}

// Controlador para Registrar un nuevo usuario (POST /auth/register)
const register = async (req, res) => {
    // Datos validados por el middleware authValidator
    const { nombre, username, email, password, rol } = req.body;

    try {
        // 1. Hashear la contraseña
        const saltRounds = 10; // Número de rondas de salting (costo computacional)
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 2. Crear la consulta SQL para insertar
        // Usamos COALESCE para tomar el rol enviado o el default de la tabla ('recepcionista')
        const sql = `
            INSERT INTO usuarios (nombre, username, email, password, rol)
            VALUES (?, ?, ?, ?, COALESCE(?, DEFAULT(rol)))
        `;

        // 3. Ejecutar la inserción
        const [result] = await db.query(sql, [nombre, username, email, hashedPassword, rol]);

        // 4. Responder con éxito (excluyendo la contraseña)
        res.status(201).json({
            mensaje: '✅ Usuario registrado con éxito',
            usuario: {
                id: result.insertId,
                username: username,
                nombre: nombre,
                email: email,
                rol: rol || 'recepcionista' // Devolver el rol asignado
            }
        });

    } catch (err) {
        // El validador ya debería haber capturado el email duplicado (ER_DUP_ENTRY)
        // pero podemos añadir un chequeo extra por si acaso
        if (err.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ mensaje: 'Error: El correo electrónico ya está registrado.' });
        }
        console.error('❌ Error al registrar usuario:', err);
        res.status(500).json({ mensaje: 'Error del servidor al registrar el usuario' });
    }
};

// Controlador para Iniciar Sesión (POST /auth/login)
const login = async (req, res) => {
    // Datos validados por el middleware authValidator
    const { username, password } = req.body;

    try {
        // 1. Buscar al usuario por username
        const sql = 'SELECT id, nombre, username, email, password, rol FROM usuarios WHERE username = ?';
        const [users] = await db.query(sql, [username]);

        // 2. Verificar si el usuario existe
        if (users.length === 0) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas (username no encontrado)' }); // 401 Unauthorized
        }
        const user = users[0];

        // 3. Comparar la contraseña enviada con la hasheada en la BD
        const isMatch = await bcrypt.compare(password, user.password);

        // 4. Verificar si las contraseñas coinciden
        if (!isMatch) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas (contraseña incorrecta)' }); // 401 Unauthorized
        }

        // 5. Si las credenciales son correctas, generar el token JWT
        const payload = {
            usuario: {
                id: user.id,
                username: user.username,
                email: user.email,
                rol: user.rol
                // NO incluir la contraseña aquí
            }
        };

        // Firmar el token con el secreto y establecer expiración
        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' }, // El token expira en 1 hora (puedes cambiarlo a '1d', '7d', etc.)
            (err, token) => {
                if (err) throw err; // Si hay error al firmar, lanzar excepción
                // 6. Enviar el token al cliente
                res.json({
                     mensaje: '✅ Inicio de sesión exitoso',
                     token: token, // El frontend guardará este token
                     usuario: { // Opcional: devolver info básica del usuario
                        id: user.id,
                        nombre: user.nombre,
                        username: user.username,
                        email: user.email,
                        rol: user.rol
                     }
                 });
            }
        );

    } catch (err) {
        console.error('❌ Error al iniciar sesión:', err);
        res.status(500).json({ mensaje: 'Error del servidor al iniciar sesión' });
    }
};


module.exports = {
    register,
    login
};