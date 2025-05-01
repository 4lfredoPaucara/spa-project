// controllers/publicController.js
const db = require('../db');

// Obtener servicios activos para la Landing Page
const getServiciosActivos = async (req, res) => {
  // Seleccionar solo los campos necesarios para el público
  // Filtrar por activo = TRUE
  const sql = `
    SELECT
        s.id, s.nombre, s.descripcion, s.duracion, s.precio, s.imagen_url,
        s.parent_servicio_id, p.nombre as nombre_padre
    FROM servicios s
    LEFT JOIN servicios p ON s.parent_servicio_id = p.id
    WHERE s.activo = TRUE
    ORDER BY COALESCE(s.parent_servicio_id, s.id), s.parent_servicio_id IS NOT NULL, s.nombre ASC
    `;
  try {
    const [servicios] = await db.query(sql);
    res.json(servicios);
  } catch (err) {
    console.error('❌ Error al obtener servicios activos:', err);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

// Obtener promociones activas para la Landing Page
const getPromocionesActivas = async (req, res) => {
  // Seleccionar campos públicos
  // Filtrar por activo = TRUE Y que la fecha actual esté dentro del rango (o sin rango)
  const sql = `
    SELECT id, titulo, descripcion, imagen_url, codigo_descuento,
           tipo_descuento, valor_descuento, aplica_a, id_servicio_aplicable
    FROM promociones
    WHERE
        activo = TRUE
        AND (fecha_inicio IS NULL OR fecha_inicio <= CURDATE())
        AND (fecha_fin IS NULL OR fecha_fin >= CURDATE())
    ORDER BY fecha_creacion DESC
  `;
  try {
    const [promociones] = await db.query(sql);
    res.json(promociones);
  } catch (err) {
    console.error('❌ Error al obtener promociones activas:', err);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};

module.exports = {
  getServiciosActivos,
  getPromocionesActivas
};