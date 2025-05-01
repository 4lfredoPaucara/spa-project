// middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Directorio donde se guardarán las imágenes
const UPLOADS_FOLDER = './uploads/';

// Asegurarse de que la carpeta uploads exista
if (!fs.existsSync(UPLOADS_FOLDER)){
    fs.mkdirSync(UPLOADS_FOLDER, { recursive: true });
}

// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_FOLDER); // Usar la carpeta definida
  },
  filename: function (req, file, cb) {
    // Crear un nombre de archivo único para evitar colisiones
    // timestamp-nombreoriginal.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Filtro para aceptar solo imágenes (opcional pero recomendado)
const fileFilter = (req, file, cb) => {
  // Aceptar solo ciertos tipos MIME
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif' || file.mimetype === 'image/webp') {
    cb(null, true); // Aceptar archivo
  } else {
    cb(new Error('Tipo de archivo no soportado. Solo se permiten imágenes (jpeg, png, gif, webp).'), false); // Rechazar archivo
  }
};

// Configurar Multer con el almacenamiento y el filtro
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // Limitar tamaño a 5MB (opcional)
    },
    fileFilter: fileFilter
});

// Middleware para manejar errores específicos de Multer (como tamaño de archivo)
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Un error conocido de Multer ocurrió (ej. tamaño excedido)
        if (err.code === 'LIMIT_FILE_SIZE') {
             return res.status(400).json({ mensaje: 'Error: El archivo es demasiado grande (Máximo 5MB).' });
        }
        // Otros errores de Multer
         return res.status(400).json({ mensaje: `Error de Multer: ${err.message}` });
    } else if (err) {
        // Un error desconocido ocurrió (ej. tipo de archivo no soportado por nuestro filtro)
        return res.status(400).json({ mensaje: err.message || 'Error al subir el archivo.' });
    }
    // Si todo fue bien, continuar
    next();
};


// Exportar el middleware configurado para usar en las rutas
// Usaremos upload.single('nombreDelCampo') donde 'nombreDelCampo' es el name del input file en el form
module.exports = {
    upload,
    handleMulterError
};