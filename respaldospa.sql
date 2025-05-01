-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 23-04-2025 a las 12:29:45
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `spa_consultorio_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `sexo` enum('Masculino','Femenino','Otro') DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id`, `nombre`, `telefono`, `correo`, `fecha_nacimiento`, `sexo`, `fecha_registro`) VALUES
(21, 'Juana Pérez', '78945612', NULL, NULL, NULL, '2025-04-20 03:11:52'),
(22, 'Antonio Pérez', '78945612', NULL, NULL, NULL, '2025-04-20 03:31:01'),
(23, 'Mamerto Pérez', '78945612', NULL, NULL, NULL, '2025-04-20 03:33:35'),
(24, 'Mabbbbmerto Pérez', '78945612', NULL, NULL, NULL, '2025-04-20 03:38:00'),
(25, 'Juana Pérez', '71234567', 'juana.perez@example.com', '1990-05-12', 'Femenino', '2025-04-20 03:45:02'),
(26, 'Carlos Gutiérrez', '72345678', 'carlos.g@example.com', '1985-08-22', 'Masculino', '2025-04-20 03:45:02'),
(27, 'Ana Morales', '73456789', 'ana.morales@example.com', '1992-03-15', 'Femenino', '2025-04-20 03:45:02'),
(28, 'Luis Fernando Ríos', '74567890', 'luis.rios@example.com', '1988-11-05', 'Masculino', '2025-04-20 03:45:02'),
(29, 'María Luisa Quiroga', '75678901', 'maria.quiroga@example.com', '1995-02-28', 'Femenino', '2025-04-20 03:45:02'),
(30, 'José Antonio Vargas', '76789012', 'jose.vargas@example.com', '1983-07-10', 'Masculino', '2025-04-20 03:45:02'),
(31, 'Daniela Flores', '77890123', 'daniela.flores@example.com', '1996-12-19', 'Femenino', '2025-04-20 03:45:02'),
(32, 'Rodrigo Chávez', '78901234', 'rodrigo.chavez@example.com', '1991-01-30', 'Masculino', '2025-04-20 03:45:02');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historiales_clinicos`
--

CREATE TABLE `historiales_clinicos` (
  `id` int(11) NOT NULL,
  `id_cliente` int(11) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `diagnostico` text DEFAULT NULL,
  `tratamiento` text DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `archivo_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicios`
--

CREATE TABLE `servicios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `duracion` int(11) DEFAULT NULL,
  `precio` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `servicios`
--

INSERT INTO `servicios` (`id`, `nombre`, `descripcion`, `duracion`, `precio`) VALUES
(1, 'Masaje terapéutico avanzado', 'Masaje con aceites esenciales y música suave', 60, 6000.00),
(2, 'Limpieza Facial', 'Limpieza profunda del rostro con vapor y extracción', 45, 80.00),
(3, 'Reflexología Podal', 'Terapia en pies para equilibrar el cuerpo', 50, 90.00),
(4, 'Masaje Descontracturante', 'Masaje fuerte para aliviar tensiones musculares', 60, 110.00),
(5, 'Spa de Manos', 'Tratamiento hidratante y exfoliante para manos', 30, 50.00),
(6, 'Tratamiento Capilar', 'Hidratación y masaje para cuero cabelludo', 40, 70.00),
(7, 'Exfoliación Corporal', 'Eliminación de células muertas y revitalización', 45, 85.00),
(8, 'Terapia con Piedras Calientes', 'Masaje con piedras volcánicas', 70, 120.00),
(9, 'Masaje relajante', 'Relaja los músculos y reduce el estrés.', 15, 150.00),
(10, 'Masaje relajante', 'Relaja los músculos y reduce el estrés.', NULL, 150.00),
(11, 'Masaje relajante en la cara', 'Relaja los músculos y reduce el estrés.', NULL, 150.00),
(12, 'Masaje terapéutico cerebral', 'Relaja los músculos y reduce el estrés.', 60, 600.00),
(13, 'Masaje relajante', 'Relaja los músculos y reduce el estrés.', 20, 150.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `turnos`
--

CREATE TABLE `turnos` (
  `id` int(11) NOT NULL,
  `id_cliente` int(11) DEFAULT NULL,
  `id_servicio` int(11) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `hora` time DEFAULT NULL,
  `estado` enum('pendiente','confirmado','cancelado','atendido','reprogramado') DEFAULT 'pendiente',
  `costo_extra` decimal(10,2) DEFAULT 0.00,
  `motivo_extra` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `turnos`
--

INSERT INTO `turnos` (`id`, `id_cliente`, `id_servicio`, `fecha`, `hora`, `estado`, `costo_extra`, `motivo_extra`) VALUES
(4, 21, 1, '2025-04-28', '15:00:00', 'reprogramado', 50.00, NULL),
(5, 21, 1, '2025-04-30', '21:00:00', 'cancelado', 1500.00, NULL),
(6, 21, 1, '2025-04-25', '10:30:00', 'pendiente', 0.00, NULL),
(8, 22, 7, '2025-04-28', '15:00:00', 'reprogramado', 50.00, NULL),
(23, 28, 1, '2025-04-25', '14:00:00', 'pendiente', 0.00, NULL),
(24, 28, 1, '2025-04-29', '15:30:00', 'cancelado', 200.00, NULL),
(28, 23, 2, '2025-04-26', '15:30:00', 'pendiente', 0.00, NULL),
(29, 24, 2, '2025-05-02', '14:30:00', 'cancelado', 15.50, NULL),
(30, 30, 1, '2025-05-01', '11:00:00', 'cancelado', 0.00, NULL),
(31, 27, 2, '2025-04-30', '10:00:00', 'pendiente', 0.00, NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `historiales_clinicos`
--
ALTER TABLE `historiales_clinicos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_cliente` (`id_cliente`);

--
-- Indices de la tabla `servicios`
--
ALTER TABLE `servicios`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `turnos`
--
ALTER TABLE `turnos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_cliente` (`id_cliente`),
  ADD KEY `id_servicio` (`id_servicio`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT de la tabla `historiales_clinicos`
--
ALTER TABLE `historiales_clinicos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `servicios`
--
ALTER TABLE `servicios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `turnos`
--
ALTER TABLE `turnos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `historiales_clinicos`
--
ALTER TABLE `historiales_clinicos`
  ADD CONSTRAINT `historiales_clinicos_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id`);

--
-- Filtros para la tabla `turnos`
--
ALTER TABLE `turnos`
  ADD CONSTRAINT `turnos_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id`),
  ADD CONSTRAINT `turnos_ibfk_2` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
