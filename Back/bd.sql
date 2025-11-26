DROP DATABASE IF EXISTS Airlink;
CREATE DATABASE Airlink;
USE Airlink;
-- Estados de pago
CREATE TABLE estado_pago (
  idEstadoPago INT AUTO_INCREMENT PRIMARY KEY,
  nombreEstadoPago VARCHAR(40) UNIQUE NOT NULL
);

-- Estados de ticket
CREATE TABLE estado_ticket (
  idEstadoTicket INT AUTO_INCREMENT PRIMARY KEY,
  nombreEstadoTicket VARCHAR(40) UNIQUE NOT NULL
);

-- Estados de notificación
CREATE TABLE estado_notificacion (
  idEstadoNotificacion INT AUTO_INCREMENT PRIMARY KEY,
  nombreEstadoNotificacion VARCHAR(40) UNIQUE NOT NULL
);

-- Tipos de notificación
CREATE TABLE tipo_notificacion (
  idTipoNotificacion INT AUTO_INCREMENT PRIMARY KEY,
  nombreTipoNotificacion VARCHAR(40) UNIQUE NOT NULL
);

-- Tipos de terminal
CREATE TABLE tipo_terminal (
  idTipoTerminal INT AUTO_INCREMENT PRIMARY KEY,
  nombreTipoTerminal VARCHAR(40) UNIQUE NOT NULL
);

-- Tipos de equipo (avión/bus)
CREATE TABLE tipo_equipo (
  idTipoEquipo INT AUTO_INCREMENT PRIMARY KEY,
  nombreTipoEquipo VARCHAR(40) UNIQUE NOT NULL
);

-- Tipos de cupón
CREATE TABLE tipo_cupon (
  idTipoCupon INT AUTO_INCREMENT PRIMARY KEY,
  nombreTipoCupon VARCHAR(40) UNIQUE NOT NULL
);

-- Estados generales
CREATE TABLE estado (
  idEstado INT AUTO_INCREMENT PRIMARY KEY,
  nombreEstado VARCHAR(120) NOT NULL
);

-- Tipos de categoría
CREATE TABLE tipo_categoria (
  idTipoCategoria INT AUTO_INCREMENT PRIMARY KEY,
  nombreTipoCategoria VARCHAR(120) NOT NULL
);

-- Roles de usuario
CREATE TABLE rol (
  idRol INT AUTO_INCREMENT PRIMARY KEY,
  nombreRol VARCHAR(50) UNIQUE NOT NULL
);

/* ==============================
   TABLAS PRINCIPALES
============================== */

CREATE TABLE usuario (
  idUsuario INT AUTO_INCREMENT PRIMARY KEY,
  nombreUsuario VARCHAR(120) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  contrasena VARCHAR(255),
  googleId VARCHAR(255),
  avatar VARCHAR(255) DEFAULT '/uploads/avatars/default-avatar.png',
  verificado BOOLEAN DEFAULT FALSE,
  idRol INT NOT NULL,
  creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultima_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (idRol) REFERENCES rol(idRol),
  INDEX idx_email (email),
  INDEX idx_googleId (googleId)
);

CREATE TABLE empresa (
  idEmpresa INT AUTO_INCREMENT PRIMARY KEY,
  nombreEmpresa VARCHAR(120) NOT NULL,
  tipoEmpresa VARCHAR(20) NOT NULL,
  logo VARCHAR(255),
  descripcion TEXT,
  sitio_web VARCHAR(255),
  activo TINYINT(1) DEFAULT 1,
  creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tipo (tipoEmpresa),
  INDEX idx_activo (activo)
);

CREATE TABLE terminal (
  idTerminal INT AUTO_INCREMENT PRIMARY KEY,
  nombreTerminal VARCHAR(120) NOT NULL,
  codigo VARCHAR(30) UNIQUE NOT NULL,
  ciudad VARCHAR(120) NOT NULL,
  imagen VARCHAR(255),
  direccion VARCHAR(255),
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  idTipoTerminal INT NOT NULL,
  activo TINYINT(1) DEFAULT 1,
  FOREIGN KEY (idTipoTerminal) REFERENCES tipo_terminal(idTipoTerminal),
  INDEX idx_codigo (codigo),
  INDEX idx_ciudad (ciudad)
);

CREATE TABLE cabina_clase (
  idCabinaClase INT AUTO_INCREMENT PRIMARY KEY,
  nombreCabinaClase VARCHAR(50) NOT NULL,
  prioridad INT DEFAULT 1,
  descripcion TEXT
);

CREATE TABLE tarifa (
  idTarifa INT AUTO_INCREMENT PRIMARY KEY,
  codigoTarifa VARCHAR(20) UNIQUE NOT NULL,
  nombreTarifa VARCHAR(100) NOT NULL,
  idCabinaClase INT NOT NULL,
  equipaje_incl_kg INT DEFAULT 0,
  cambios TINYINT(1) DEFAULT 0,
  reembolsable TINYINT(1) DEFAULT 0,
  condiciones TEXT,
  activo TINYINT(1) DEFAULT 1,
  FOREIGN KEY (idCabinaClase) REFERENCES cabina_clase(idCabinaClase)
);

CREATE TABLE empresa_equipo (
  idEquipo INT AUTO_INCREMENT PRIMARY KEY,
  idEmpresa INT NOT NULL,
  modelo VARCHAR(120) NOT NULL,
  matricula VARCHAR(40) UNIQUE NOT NULL,
  imagen VARCHAR(255),
  capacidad INT NOT NULL,
  idTipoEquipo INT NOT NULL,
  anio_fabricacion YEAR,
  activo TINYINT(1) DEFAULT 1,
  FOREIGN KEY (idEmpresa) REFERENCES empresa(idEmpresa),
  FOREIGN KEY (idTipoEquipo) REFERENCES tipo_equipo(idTipoEquipo),
  INDEX idx_matricula (matricula)
);

CREATE TABLE ruta (
  idRuta INT AUTO_INCREMENT PRIMARY KEY,
  idTerminalOrigen INT NOT NULL,
  idTerminalDestino INT NOT NULL,
  distanciaKm DECIMAL(7,2),
  duracionEstimadaMin INT,
  activo TINYINT(1) DEFAULT 1,
  FOREIGN KEY (idTerminalOrigen) REFERENCES terminal(idTerminal),
  FOREIGN KEY (idTerminalDestino) REFERENCES terminal(idTerminal),
  INDEX idx_origen (idTerminalOrigen),
  INDEX idx_destino (idTerminalDestino)
);

CREATE TABLE viaje (
  idViaje INT AUTO_INCREMENT PRIMARY KEY,
  idRuta INT NOT NULL,
  salida DATETIME NOT NULL,
  llegada DATETIME NOT NULL,
  idEquipo INT NOT NULL,
  estado VARCHAR(30) DEFAULT 'programado',
  creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idRuta) REFERENCES ruta(idRuta),
  FOREIGN KEY (idEquipo) REFERENCES empresa_equipo(idEquipo),
  INDEX idx_salida (salida),
  INDEX idx_estado (estado)
);

CREATE TABLE viaje_tramo (
  idViajeTramo INT AUTO_INCREMENT PRIMARY KEY,
  idViaje INT NOT NULL,
  orden INT NOT NULL,
  idTerminalSalida INT NOT NULL,
  idTerminalLlegada INT NOT NULL,
  hora_salida DATETIME NOT NULL,
  hora_llegada DATETIME NOT NULL,
  FOREIGN KEY (idViaje) REFERENCES viaje(idViaje),
  FOREIGN KEY (idTerminalSalida) REFERENCES terminal(idTerminal),
  FOREIGN KEY (idTerminalLlegada) REFERENCES terminal(idTerminal),
  INDEX idx_viaje (idViaje)
);

CREATE TABLE asiento (
  idAsiento INT AUTO_INCREMENT PRIMARY KEY,
  idViaje INT NOT NULL,
  numero VARCHAR(10) NOT NULL,
  idCabinaClase INT NOT NULL,
  disponible TINYINT(1) DEFAULT 1,
  FOREIGN KEY (idViaje) REFERENCES viaje(idViaje),
  FOREIGN KEY (idCabinaClase) REFERENCES cabina_clase(idCabinaClase),
  UNIQUE KEY unique_asiento_viaje (idViaje, numero),
  INDEX idx_disponible (disponible)
);

CREATE TABLE reserva (
  idReserva INT AUTO_INCREMENT PRIMARY KEY,
  codigo_reserva VARCHAR(20) UNIQUE NOT NULL,
  idUsuario INT NOT NULL,
  idViaje INT NOT NULL,
  fecha_reserva DATETIME DEFAULT CURRENT_TIMESTAMP,
  idTipoCategoria INT NOT NULL,
  estado VARCHAR(30) DEFAULT 'pendiente',
  monto_total DECIMAL(10,2),
  moneda VARCHAR(10) DEFAULT 'CLP',
  FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario),
  FOREIGN KEY (idViaje) REFERENCES viaje(idViaje),
  FOREIGN KEY (idTipoCategoria) REFERENCES tipo_categoria(idTipoCategoria),
  INDEX idx_codigo (codigo_reserva),
  INDEX idx_usuario (idUsuario),
  INDEX idx_estado (estado)
);

CREATE TABLE pasajero (
  idPasajero INT AUTO_INCREMENT PRIMARY KEY,
  idReserva INT NOT NULL,
  nombrePasajero VARCHAR(120) NOT NULL,
  apellidoPasajero VARCHAR(120) NOT NULL,
  documento VARCHAR(50) NOT NULL,
  tipo_documento VARCHAR(20) DEFAULT 'DNI',
  fecha_nacimiento DATE,
  nacionalidad VARCHAR(80),
  FOREIGN KEY (idReserva) REFERENCES reserva(idReserva),
  INDEX idx_reserva (idReserva),
  INDEX idx_documento (documento)
);

CREATE TABLE pasajero_asiento (
  idPasajeroAsiento INT AUTO_INCREMENT PRIMARY KEY,
  idPasajero INT NOT NULL,
  idAsiento INT NOT NULL,
  fecha_seleccion DATETIME DEFAULT CURRENT_TIMESTAMP,
  cargo_extra DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (idPasajero) REFERENCES pasajero(idPasajero),
  FOREIGN KEY (idAsiento) REFERENCES asiento(idAsiento),
  UNIQUE KEY unique_asiento_pasajero (idAsiento)
);

CREATE TABLE equipaje (
  idEquipaje INT AUTO_INCREMENT PRIMARY KEY,
  idPasajero INT NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  peso_kg DECIMAL(5,2),
  largo_cm INT,
  ancho_cm INT,
  alto_cm INT,
  cargo_extra DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (idPasajero) REFERENCES pasajero(idPasajero),
  INDEX idx_pasajero (idPasajero)
);

CREATE TABLE metodo_pago (
  idMetodoPago INT AUTO_INCREMENT PRIMARY KEY,
  nombreMetodoPago VARCHAR(50) NOT NULL,
  descripcion TEXT,
  activo TINYINT(1) DEFAULT 1
);

CREATE TABLE pago (
  idPago INT AUTO_INCREMENT PRIMARY KEY,
  idReserva INT NOT NULL,
  idMetodoPago INT NOT NULL,
  idEstadoPago INT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  moneda VARCHAR(10) DEFAULT 'CLP',
  referencia_externa VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idReserva) REFERENCES reserva(idReserva),
  FOREIGN KEY (idMetodoPago) REFERENCES metodo_pago(idMetodoPago),
  FOREIGN KEY (idEstadoPago) REFERENCES estado_pago(idEstadoPago),
  INDEX idx_reserva (idReserva),
  INDEX idx_estado (idEstadoPago)
);

CREATE TABLE ticket (
  idTicket INT AUTO_INCREMENT PRIMARY KEY,
  idReserva INT NOT NULL,
  idEstadoTicket INT NOT NULL,
  numero_ticket VARCHAR(50) UNIQUE NOT NULL,
  codigo_qr VARCHAR(255) UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_uso TIMESTAMP NULL,
  FOREIGN KEY (idReserva) REFERENCES reserva(idReserva),
  FOREIGN KEY (idEstadoTicket) REFERENCES estado_ticket(idEstadoTicket),
  INDEX idx_numero (numero_ticket),
  INDEX idx_qr (codigo_qr)
);

CREATE TABLE impuesto (
  idImpuesto INT AUTO_INCREMENT PRIMARY KEY,
  nombreImpuesto VARCHAR(120) NOT NULL,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  porcentaje DECIMAL(6,3),
  fijo_monto DECIMAL(10,2),
  moneda VARCHAR(10) DEFAULT 'CLP',
  activo TINYINT(1) DEFAULT 1
);

CREATE TABLE cupon_descuento (
  idCuponDescuento INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(40) UNIQUE NOT NULL,
  idTipoCupon INT NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  uso_maximo INT DEFAULT 1,
  uso_actual INT DEFAULT 0,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  activo TINYINT(1) DEFAULT 1,
  FOREIGN KEY (idTipoCupon) REFERENCES tipo_cupon(idTipoCupon),
  INDEX idx_codigo (codigo),
  INDEX idx_activo (activo)
);

CREATE TABLE viaje_tarifa (
  idViajeTarifa INT AUTO_INCREMENT PRIMARY KEY,
  idViaje INT NOT NULL,
  idTarifa INT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  moneda VARCHAR(10) DEFAULT 'CLP',
  cupos INT NOT NULL,
  FOREIGN KEY (idViaje) REFERENCES viaje(idViaje),
  FOREIGN KEY (idTarifa) REFERENCES tarifa(idTarifa),
  INDEX idx_viaje (idViaje)
);

CREATE TABLE reserva_impuesto (
  idReservaImpuesto INT AUTO_INCREMENT PRIMARY KEY,
  idReserva INT NOT NULL,
  idImpuesto INT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (idReserva) REFERENCES reserva(idReserva),
  FOREIGN KEY (idImpuesto) REFERENCES impuesto(idImpuesto)
);

CREATE TABLE factura (
  idFactura INT AUTO_INCREMENT PRIMARY KEY,
  idReserva INT NOT NULL,
  numeroFactura VARCHAR(30) UNIQUE NOT NULL,
  razonSocial VARCHAR(150),
  rucNif VARCHAR(30),
  direccionFiscal VARCHAR(200),
  fechaEmision DATETIME DEFAULT CURRENT_TIMESTAMP,
  moneda VARCHAR(10) DEFAULT 'CLP',
  montoTotal DECIMAL(10,2) NOT NULL,
  pdfUrl VARCHAR(255),
  FOREIGN KEY (idReserva) REFERENCES reserva(idReserva),
  INDEX idx_numero (numeroFactura)
);

CREATE TABLE reserva_cupon (
  idReservaCupon INT AUTO_INCREMENT PRIMARY KEY,
  idReserva INT NOT NULL,
  idCuponDescuento INT NOT NULL,
  montoAplicado DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (idReserva) REFERENCES reserva(idReserva),
  FOREIGN KEY (idCuponDescuento) REFERENCES cupon_descuento(idCuponDescuento)
);

CREATE TABLE perfil_viajero (
  idPerfilViajero INT AUTO_INCREMENT PRIMARY KEY,
  idUsuario INT NOT NULL,
  documento VARCHAR(50) NOT NULL,
  tipo_documento VARCHAR(20) DEFAULT 'DNI',
  nacionalidad VARCHAR(80),
  fechaNacimiento DATE,
  frecuenteCodigo VARCHAR(50),
  FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario),
  INDEX idx_usuario (idUsuario)
);

CREATE TABLE direccion (
  idDireccion INT AUTO_INCREMENT PRIMARY KEY,
  idUsuario INT NOT NULL,
  linea1 VARCHAR(120) NOT NULL,
  linea2 VARCHAR(120),
  ciudad VARCHAR(120) NOT NULL,
  region VARCHAR(120),
  pais VARCHAR(120) NOT NULL,
  zip VARCHAR(20),
  predeterminada TINYINT(1) DEFAULT 0,
  FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario),
  INDEX idx_usuario (idUsuario)
);

-- Favoritos (rutas guardadas)
CREATE TABLE favorito (
  idFavorito INT AUTO_INCREMENT PRIMARY KEY,
  idUsuario INT NOT NULL,
  idRuta INT NOT NULL,
  alias VARCHAR(120),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario),
  FOREIGN KEY (idRuta) REFERENCES ruta(idRuta),
  UNIQUE KEY unique_favorito (idUsuario, idRuta)
);

CREATE TABLE resena (
  idResena INT AUTO_INCREMENT PRIMARY KEY,
  idUsuario INT NOT NULL,
  idEmpresa INT NOT NULL,
  puntaje INT NOT NULL CHECK (puntaje BETWEEN 1 AND 5),
  comentario TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario),
  FOREIGN KEY (idEmpresa) REFERENCES empresa(idEmpresa),
  INDEX idx_empresa (idEmpresa),
  INDEX idx_puntaje (puntaje)
);

CREATE TABLE soporte_ticket (
  idSoporteTicket INT AUTO_INCREMENT PRIMARY KEY,
  idUsuario INT NOT NULL,
  idReserva INT,
  asunto VARCHAR(150) NOT NULL,
  descripcion TEXT NOT NULL,
  idEstado INT NOT NULL,
  prioridad VARCHAR(20) DEFAULT 'media',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario),
  FOREIGN KEY (idReserva) REFERENCES reserva(idReserva),
  FOREIGN KEY (idEstado) REFERENCES estado(idEstado),
  INDEX idx_usuario (idUsuario),
  INDEX idx_estado (idEstado)
);

CREATE TABLE notificacion (
  idNotificacion INT AUTO_INCREMENT PRIMARY KEY,
  idUsuario INT NOT NULL,
  idEstadoNotificacion INT NOT NULL,
  idTipoNotificacion INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  mensaje TEXT NOT NULL,
  leida TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario),
  FOREIGN KEY (idEstadoNotificacion) REFERENCES estado_notificacion(idEstadoNotificacion),
  FOREIGN KEY (idTipoNotificacion) REFERENCES tipo_notificacion(idTipoNotificacion),
  INDEX idx_usuario (idUsuario),
  INDEX idx_leida (leida)
);

CREATE TABLE auditoria (
  idAuditoria INT AUTO_INCREMENT PRIMARY KEY,
  idUsuario INT,
  entidad VARCHAR(50) NOT NULL,
  idEntidad INT NOT NULL,
  accion VARCHAR(20) NOT NULL,
  cambios_json TEXT,
  ip VARCHAR(45),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario),
  INDEX idx_entidad (entidad, idEntidad),
  INDEX idx_usuario (idUsuario)
);

CREATE TABLE sesion (
  idSesion INT AUTO_INCREMENT PRIMARY KEY,
  idUsuario INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  refresh_token VARCHAR(255),
  ip VARCHAR(45),
  user_agent VARCHAR(255),
  expira_en DATETIME NOT NULL,
  revocada TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (idUsuario) REFERENCES usuario(idUsuario),
  INDEX idx_token (token),
  INDEX idx_usuario (idUsuario)
);

CREATE TABLE destino (
  idDestino INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  precio DECIMAL(12,2) NOT NULL,
  ciudad VARCHAR(120) NOT NULL,
  pais VARCHAR(120) NOT NULL,
  imagen VARCHAR(255) NOT NULL,
  descripcion TEXT,
  destacado TINYINT(1) DEFAULT 0,
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_destacado (destacado),
  INDEX idx_activo (activo)
);

INSERT INTO rol (nombreRol) VALUES 
('Cliente'),
('Usuario'),
('Administrador');

INSERT INTO estado_pago (nombreEstadoPago) VALUES 
('Pendiente'),
('Aprobado'),
('Rechazado'),
('Reembolsado');

INSERT INTO estado_ticket (nombreEstadoTicket) VALUES 
('Activo'),
('Usado'),
('Cancelado'),
('Vencido');

INSERT INTO estado_notificacion (nombreEstadoNotificacion) VALUES 
('Enviada'),
('Leída'),
('Eliminada');

INSERT INTO tipo_notificacion (nombreTipoNotificacion) VALUES 
('Confirmación de Reserva'),
('Cambio de Vuelo'),
('Recordatorio'),
('Promoción'),
('Alerta');

INSERT INTO tipo_terminal (nombreTipoTerminal) VALUES 
('Aeropuerto Internacional'),
('Aeropuerto Nacional'),
('Terminal Terrestre');

INSERT INTO tipo_equipo (nombreTipoEquipo) VALUES 
('Avión'),
('Bus'),
('Bus Cama');

INSERT INTO tipo_cupon (nombreTipoCupon) VALUES 
('Porcentaje'),
('Monto Fijo');

INSERT INTO estado (nombreEstado) VALUES 
('Abierto'),
('En Proceso'),
('Resuelto'),
('Cerrado');

INSERT INTO tipo_categoria (nombreTipoCategoria) VALUES 
('Solo Ida'),
('Ida y Vuelta'),
('Multi-destino');

INSERT INTO cabina_clase (nombreCabinaClase, prioridad, descripcion) VALUES 
('Económica', 3, 'Asiento estándar con servicios básicos'),
('Económica Premium', 2, 'Mayor espacio para piernas y servicios mejorados'),
('Ejecutiva', 1, 'Asientos reclinables con servicios premium');

INSERT INTO metodo_pago (nombreMetodoPago, descripcion) VALUES 
('Tarjeta de Crédito', 'Visa, Mastercard, American Express'),
('Tarjeta de Débito', 'Débito bancario'),
('WebPay', 'Plataforma de pagos Transbank'),
('PayPal', 'Pago mediante cuenta PayPal'),
('Transferencia', 'Transferencia bancaria');

INSERT INTO impuesto (nombreImpuesto, codigo, porcentaje, fijo_monto) VALUES 
('IVA', 'IVA', 19.000, NULL),
('Tasa Aeroportuaria', 'TAE', NULL, 5000);

INSERT INTO empresa (nombreEmpresa, tipoEmpresa, activo, logo) VALUES 
('LATAM Airlines', 'Aerolinea',1, '/uploads/empresas/latam-logo.png'),
('Sky Airline', 'Aerolinea',1, '/uploads/empresas/sky-logo.png'),
('JetSmart', 'Aerolinea',1, '/uploads/empresas/jetsmart-logo.png'),
('Turbus', 'bus', 1, '/uploads/logos/turbus.png'),
('Pullman Bus', 'bus', 1, '/uploads/logos/pullman.png'),
('Condor Bus', 'bus', 1, '/uploads/logos/condor.png'),
('Cruz del Sur', 'bus', 1, '/uploads/logos/cruzdelSur.png');

INSERT INTO tarifa (codigoTarifa, nombreTarifa, idCabinaClase, equipaje_incl_kg, cambios, reembolsable, condiciones) VALUES 
('ECO-LIGHT', 'Económica Light', 1, 0, 0, 0, 'Sin equipaje incluido, sin cambios'),
('ECO-FULL', 'Económica Full', 1, 23, 1, 0, 'Equipaje incluido, cambios con cargo'),
('PREMIUM', 'Premium Economy', 2, 32, 1, 1, 'Equipaje premium, cambios y reembolsos'),
('EJEC', 'Ejecutiva', 3, 32, 1, 1, 'Clase ejecutiva con todos los beneficios');

INSERT INTO empresa_equipo (idEmpresa, modelo, matricula, capacidad, idTipoEquipo, anio_fabricacion) VALUES 
(1, 'Boeing 787-9', 'CC-BGA', 280, 1, 2018),
(1, 'Airbus A320', 'CC-BAE', 174, 1, 2019),
(1, 'Boeing 767-300', 'CC-CWZ', 252, 1, 2015),
(2, 'Airbus A320neo', 'CC-AZA', 186, 1, 2020),
(2, 'Airbus A321', 'CC-AZB', 220, 1, 2021),
(3, 'Airbus A320', 'CC-AWA', 186, 1, 2019),
(3, 'Airbus A320', 'CC-AWB', 186, 1, 2020),
(4, 'Mercedes-Benz O500', 'BBXZ12', 45, 2, 1),
(5, 'Marcopolo Paradiso', 'CCXY34', 42, 2, 1),
(6, 'Mercedes-Benz P600', 'BBXX07', 45, 2, 1),
(7, 'Marcopolo Paradise', 'PYXZ15', 42, 2, 1);

-- Terminales de Aeropuertos
INSERT INTO terminal (nombreTerminal, codigo, ciudad, imagen, direccion, idTipoTerminal, activo) VALUES 
('Aeropuerto Arturo Merino Benítez', 'SCL', 'Santiago', NULL, 'Av. Armando Cortínez Ote. 1704, Pudahuel', 1, 1),
('Aeropuerto Diego Aracena', 'IQQ', 'Iquique', NULL, 'Av. Diego Aracena 2950, Alto Hospicio', 2, 1),
('Aeropuerto El Tepual', 'PMC', 'Puerto Montt', NULL, 'Camino al Aeropuerto s/n', 2, 1),
('Aeropuerto Alejandro Velasco Astete', 'CUZ', 'Cusco', NULL, 'Av. Velasco Astete s/n', 1, 1),
('Aeropuerto Internacional Ezeiza', 'EZE', 'Buenos Aires', NULL, 'Autopista Riccheri', 1, 1),
('Aeropuerto Internacional CDMX', 'MEX', 'Ciudad de México', NULL, 'Av. Capitán Carlos León s/n', 1, 1),
('Aeropuerto La Florida', 'LSC', 'Coquimbo', NULL, 'Ruta D-43, La Serena', 2, 1),
('Aeropuerto Cerro Moreno', 'ANF', 'Antofagasta', NULL, 'Ruta 1, Antofagasta', 2, 1),
('Aeropuerto Carlos Ibáñez', 'PUQ', 'Puerto Natales', NULL, 'Ruta 9 Norte Km 7', 2, 1),
('Aeropuerto Mataveri', 'IPC', 'Hanga Roa', NULL, 'Isla de Pascua', 2, 1),
('Aeropuerto Punta Cana', 'PUJ', 'Punta Cana', NULL, 'Carretera Higüey', 1, 1),
('Aeropuerto Galeão', 'GIG', 'Río de Janeiro', NULL, 'Av. Vinte de Janeiro', 1, 1),
('Aeropuerto Jorge Chávez', 'LIM', 'Lima', NULL, 'Av. Elmer Faucett', 1, 1),
('Aeropuerto JFK', 'JFK', 'Nueva York', NULL, 'Queens, NY 11430', 1, 1),
('Aeropuerto El Dorado', 'BOG', 'Cartagena de Indias', NULL, 'Av. El Dorado', 1, 1),
('Aeropuerto Barajas', 'MAD', 'Madrid', NULL, 'Av. de la Hispanidad', 1, 1),
('Aeropuerto Teniente Candelaria', 'BRC', 'San Carlos de Bariloche', NULL, 'RN 237 Km 14', 2, 1);

-- Terminales de Bus
INSERT INTO terminal (nombreTerminal, codigo, ciudad, idTipoTerminal, activo) VALUES
('Terminal Santiago', 'SCL-BUS', 'Santiago', 3, 1),
('Terminal Temuco', 'TMC-BUS', 'Temuco', 3, 1),
('Terminal Valparaíso', 'VLP-BUS', 'Valparaíso', 3, 1),
('Terminal Concepción', 'CCP-BUS', 'Concepción', 3, 1),
('Terminal La Serena', 'LSC-BUS', 'La Serena', 3, 1);

INSERT INTO destino (nombre, precio, ciudad, pais, imagen, descripcion, destacado) VALUES 
('Puerto Montt city', 259990, 'Puerto Montt', 'Chile', '/uploads/puertomontt.jpg', 'Descubre la cultura chilena. Incluye vuelo + hotel 2 noches', 1),
('Machu Picchu Express', 599990, 'Cusco', 'Perú', '/uploads/lima.jpg', 'Descubre la maravilla del mundo. Incluye vuelo + hotel 3 noches', 1),
('Coquimbo city', 129900, 'Coquimbo', 'Chile', '/uploads/coquimbo.jpg', 'Playas paradisíacas y todo incluido. Vuelo + hotel 5 noches', 1),
('Buenos Aires Cultural', 239990, 'Buenos Aires', 'Argentina', '/uploads/buenos-aires.jpeg', 'La ciudad que nunca duerme. Vuelo + hotel 4 noches', 1),
('Ciudad de México', 499900, 'Ciudad de Mexico', 'Mexico', '/uploads/mexico-city.jpg', 'Aventura en el fin del mundo. Tour completo 7 días', 1),
('San Pedro de Atacama Experience', 349990, 'San Pedro de Atacama', 'Chile', '/uploads/atacama.jpg', 'Desierto, salares y géiseres. Paquete con tour Valle de la Luna + hotel 3 noches', 1),
('Punta Cana All Inclusive', 999990, 'Punta Cana', 'República Dominicana', '/uploads/punta-cana.jpg', 'Caribe total: playas, comidas y bebidas ilimitadas por 5 noches', 1),
('Río de Janeiro Aventura', 699990, 'Río de Janeiro', 'Brasil', '/uploads/rio.jpg', 'Conoce el Cristo Redentor y Copacabana. Vuelo + hotel 4 noches', 1),
('Torres del Paine Natural', 799990, 'Puerto Natales', 'Chile', '/uploads/torres-del-paine.jpg', 'Aventura en la Patagonia con trekking y guía incluido', 1),
('Lima Gourmet', 459990, 'Lima', 'Perú', '/uploads/lima-gourmet.jpg', 'Gastronomía peruana + city tour y 3 noches de alojamiento', 1),
('Nueva York City Lights', 1249990, 'Nueva York', 'Estados Unidos', '/uploads/new-york.jpg', 'Tour urbano por Manhattan, Broadway y Central Park', 1),
('Isla de Pascua Mística', 899990, 'Hanga Roa', 'Chile', '/uploads/isla-pascua.jpg', 'Descubre los moáis, playas y cultura ancestral. 4 noches + tour', 1),
('Cartagena Colonial', 749990, 'Cartagena de Indias', 'Colombia', '/uploads/cartagena.jpg', 'Recorrido histórico, playa y hotel 3 estrellas. Vuelo + 5 noches', 1),
('Madrid Cultural', 1399990, 'Madrid', 'España', '/uploads/madrid.jpg', 'Tour por museos, plazas y tapas. Vuelo + hotel 6 noches', 1),
('Bariloche Nieve y Lago', 549990, 'San Carlos de Bariloche', 'Argentina', '/uploads/bariloche.jpg', 'Ideal para invierno: esquí, chocolate y paisajes del sur', 1);

-- =====================================================
-- RUTAS DE AVIONES
-- =====================================================

-- Rutas desde Santiago (originales)
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) VALUES 
(1, 2, 1850, 135, 1),  -- SCL -> IQQ
(1, 3, 1015, 105, 1),  -- SCL -> PMC
(1, 4, 3370, 210, 1),  -- SCL -> CUZ
(1, 5, 1400, 125, 1),  -- SCL -> EZE
(1, 6, 7010, 540, 1),  -- SCL -> MEX

-- Rutas de regreso originales
(2, 1, 1850, 135, 1),  -- IQQ -> SCL
(3, 1, 1015, 105, 1),  -- PMC -> SCL
(4, 1, 3370, 210, 1),  -- CUZ -> SCL
(5, 1, 1400, 125, 1),  -- EZE -> SCL
(6, 1, 7010, 540, 1);  -- MEX -> SCL

-- Rutas nuevas desde Santiago
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) VALUES 
(1, 7, 470, 65, 1),    -- SCL -> LSC (Coquimbo)
(1, 8, 1370, 120, 1),  -- SCL -> ANF (Antofagasta)
(1, 9, 3100, 240, 1),  -- SCL -> PUQ (Puerto Natales)
(1, 10, 3760, 330, 1), -- SCL -> IPC (Isla de Pascua)
(1, 11, 8260, 600, 1), -- SCL -> PUJ (Punta Cana)
(1, 12, 3140, 240, 1), -- SCL -> GIG (Río de Janeiro)
(1, 13, 2700, 210, 1), -- SCL -> LIM (Lima)
(1, 14, 8630, 660, 1), -- SCL -> JFK (Nueva York)
(1, 15, 5180, 420, 1), -- SCL -> BOG (Cartagena)
(1, 16, 10450, 840, 1),-- SCL -> MAD (Madrid)
(1, 17, 1420, 130, 1); -- SCL -> BRC (Bariloche)

-- Rutas de regreso nuevas
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) VALUES 
(7, 1, 470, 65, 1),    -- LSC -> SCL
(8, 1, 1370, 120, 1),  -- ANF -> SCL
(9, 1, 3100, 240, 1),  -- PUQ -> SCL
(10, 1, 3760, 330, 1), -- IPC -> SCL
(11, 1, 8260, 600, 1), -- PUJ -> SCL
(12, 1, 3140, 240, 1), -- GIG -> SCL
(13, 1, 2700, 210, 1), -- LIM -> SCL
(14, 1, 8630, 660, 1), -- JFK -> SCL
(15, 1, 5180, 420, 1), -- BOG -> SCL
(16, 1, 10450, 840, 1),-- MAD -> SCL
(17, 1, 1420, 130, 1); -- BRC -> SCL

-- =====================================================
-- VIAJES DE AVIÓN - FECHAS ACTUALIZADAS (06, 07, 08 NOV 2025)
-- =====================================================

-- VUELOS SANTIAGO -> PUERTO MONTT (06 NOV)
INSERT INTO viaje (idRuta, salida, llegada, idEquipo, estado) VALUES 
(2, '2025-11-06 08:00:00', '2025-11-06 09:45:00', 2, 'programado'),
(2, '2025-11-06 12:30:00', '2025-11-06 14:15:00', 4, 'programado'),
(2, '2025-11-06 18:00:00', '2025-11-06 19:45:00', 6, 'programado'),

-- VUELOS SANTIAGO -> PUERTO MONTT (07 NOV)
(2, '2025-11-07 09:00:00', '2025-11-07 10:45:00', 2, 'programado'),
(2, '2025-11-07 15:00:00', '2025-11-07 16:45:00', 5, 'programado'),

-- VUELOS SANTIAGO -> IQUIQUE (06 NOV)
(1, '2025-11-06 10:00:00', '2025-11-06 12:15:00', 1, 'programado'),
(1, '2025-11-06 16:30:00', '2025-11-06 18:45:00', 7, 'programado'),

-- VUELOS SANTIAGO -> IQUIQUE (07 NOV)
(1, '2025-11-07 07:30:00', '2025-11-07 09:45:00', 3, 'programado'),
(1, '2025-11-07 14:00:00', '2025-11-07 16:15:00', 6, 'programado'),

-- VUELOS SANTIAGO -> CUSCO (06-08 NOV)
(3, '2025-11-06 11:00:00', '2025-11-06 14:30:00', 1, 'programado'),
(3, '2025-11-07 11:00:00', '2025-11-07 14:30:00', 3, 'programado'),
(3, '2025-11-08 11:00:00', '2025-11-08 14:30:00', 1, 'programado'),

-- VUELOS SANTIAGO -> BUENOS AIRES (06-07 NOV)
(4, '2025-11-06 13:00:00', '2025-11-06 15:05:00', 1, 'programado'),
(4, '2025-11-06 19:00:00', '2025-11-06 21:05:00', 5, 'programado'),
(4, '2025-11-07 08:00:00', '2025-11-07 10:05:00', 3, 'programado'),
(4, '2025-11-07 16:00:00', '2025-11-07 18:05:00', 7, 'programado'),

-- VUELOS SANTIAGO -> CIUDAD DE MÉXICO (06-07 NOV)
(5, '2025-11-06 22:00:00', '2025-11-07 07:00:00', 1, 'programado'),
(5, '2025-11-07 22:30:00', '2025-11-08 07:30:00', 3, 'programado'),

-- VUELOS DE REGRESO PUERTO MONTT -> SANTIAGO (06-08 NOV)
(6, '2025-11-06 11:00:00', '2025-11-06 12:45:00', 2, 'programado'),
(6, '2025-11-06 16:00:00', '2025-11-06 17:45:00', 4, 'programado'),
(6, '2025-11-06 20:00:00', '2025-11-06 21:45:00', 2, 'programado'),
(6, '2025-11-06 21:30:00', '2025-11-06 23:15:00', 5, 'programado'),
(6, '2025-11-07 06:00:00', '2025-11-07 07:45:00', 4, 'programado'),
(6, '2025-11-07 10:30:00', '2025-11-07 12:15:00', 6, 'programado'),
(6, '2025-11-07 13:00:00', '2025-11-07 14:45:00', 2, 'programado'),
(6, '2025-11-07 17:30:00', '2025-11-07 19:15:00', 6, 'programado'),
(6, '2025-11-07 20:00:00', '2025-11-07 21:45:00', 5, 'programado'),
(6, '2025-11-08 08:30:00', '2025-11-08 10:15:00', 2, 'programado'),
(6, '2025-11-08 12:00:00', '2025-11-08 13:45:00', 4, 'programado'),
(6, '2025-11-08 15:00:00', '2025-11-08 16:45:00', 6, 'programado'),
(6, '2025-11-08 19:00:00', '2025-11-08 20:45:00', 5, 'programado'),
(6, '2025-11-09 07:00:00', '2025-11-09 08:45:00', 2, 'programado'),
(6, '2025-11-09 14:00:00', '2025-11-09 15:45:00', 4, 'programado'),
(6, '2025-11-09 18:00:00', '2025-11-09 19:45:00', 6, 'programado'),

-- VUELOS IQUIQUE -> SANTIAGO (06-09 NOV)
(7, '2025-11-06 19:00:00', '2025-11-06 21:15:00', 1, 'programado'),
(7, '2025-11-06 22:00:00', '2025-11-07 00:15:00', 7, 'programado'),
(7, '2025-11-07 10:00:00', '2025-11-07 12:15:00', 3, 'programado'),
(7, '2025-11-07 14:30:00', '2025-11-07 16:45:00', 6, 'programado'),
(7, '2025-11-07 18:00:00', '2025-11-07 20:15:00', 1, 'programado'),
(7, '2025-11-07 21:00:00', '2025-11-07 23:15:00', 7, 'programado'),
(7, '2025-11-08 09:00:00', '2025-11-08 11:15:00', 3, 'programado'),
(7, '2025-11-08 13:00:00', '2025-11-08 15:15:00', 1, 'programado'),
(7, '2025-11-08 17:00:00', '2025-11-08 19:15:00', 6, 'programado'),
(7, '2025-11-08 20:30:00', '2025-11-08 22:45:00', 7, 'programado'),
(7, '2025-11-09 08:00:00', '2025-11-09 10:15:00', 1, 'programado'),
(7, '2025-11-09 15:00:00', '2025-11-09 17:15:00', 3, 'programado'),
(7, '2025-11-09 19:30:00', '2025-11-09 21:45:00', 7, 'programado'),

-- VUELOS CUSCO -> SANTIAGO (07-10 NOV)
(8, '2025-11-07 15:00:00', '2025-11-07 18:30:00', 1, 'programado'),
(8, '2025-11-07 20:00:00', '2025-11-07 23:30:00', 3, 'programado'),
(8, '2025-11-08 14:00:00', '2025-11-08 17:30:00', 1, 'programado'),
(8, '2025-11-08 19:00:00', '2025-11-08 22:30:00', 3, 'programado'),
(8, '2025-11-09 13:00:00', '2025-11-09 16:30:00', 1, 'programado'),
(8, '2025-11-09 18:00:00', '2025-11-09 21:30:00', 3, 'programado'),
(8, '2025-11-10 15:00:00', '2025-11-10 18:30:00', 1, 'programado'),
(8, '2025-11-10 20:00:00', '2025-11-10 23:30:00', 3, 'programado'),

-- VUELOS BUENOS AIRES -> SANTIAGO (06-09 NOV)
(9, '2025-11-06 16:00:00', '2025-11-06 18:05:00', 1, 'programado'),
(9, '2025-11-06 22:00:00', '2025-11-07 00:05:00', 5, 'programado'),
(9, '2025-11-07 11:00:00', '2025-11-07 13:05:00', 3, 'programado'),
(9, '2025-11-07 15:30:00', '2025-11-07 17:35:00', 7, 'programado'),
(9, '2025-11-07 19:00:00', '2025-11-07 21:05:00', 1, 'programado'),
(9, '2025-11-07 23:00:00', '2025-11-08 01:05:00', 5, 'programado'),
(9, '2025-11-08 10:00:00', '2025-11-08 12:05:00', 3, 'programado'),
(9, '2025-11-08 14:00:00', '2025-11-08 16:05:00', 1, 'programado'),
(9, '2025-11-08 18:00:00', '2025-11-08 20:05:00', 7, 'programado'),
(9, '2025-11-08 22:00:00', '2025-11-09 00:05:00', 5, 'programado'),
(9, '2025-11-09 09:00:00', '2025-11-09 11:05:00', 1, 'programado'),
(9, '2025-11-09 17:00:00', '2025-11-09 19:05:00', 3, 'programado'),
(9, '2025-11-09 21:00:00', '2025-11-09 23:05:00', 7, 'programado'),

-- VUELOS CIUDAD DE MÉXICO -> SANTIAGO (08-11 NOV)
(10, '2025-11-08 09:00:00', '2025-11-08 18:00:00', 1, 'programado'),
(10, '2025-11-08 23:00:00', '2025-11-09 08:00:00', 3, 'programado'),
(10, '2025-11-09 10:00:00', '2025-11-09 19:00:00', 1, 'programado'),
(10, '2025-11-09 22:00:00', '2025-11-10 07:00:00', 3, 'programado'),
(10, '2025-11-10 09:30:00', '2025-11-10 18:30:00', 1, 'programado'),
(10, '2025-11-10 23:30:00', '2025-11-11 08:30:00', 3, 'programado'),

-- NUEVOS VUELOS SANTIAGO -> COQUIMBO (08-10 NOV)
(11, '2025-11-08 07:00:00', '2025-11-08 08:05:00', 2, 'programado'),
(11, '2025-11-08 12:00:00', '2025-11-08 13:05:00', 4, 'programado'),
(11, '2025-11-08 18:00:00', '2025-11-08 19:05:00', 6, 'programado'),
(11, '2025-11-09 08:00:00', '2025-11-09 09:05:00', 2, 'programado'),
(11, '2025-11-09 14:00:00', '2025-11-09 15:05:00', 5, 'programado'),
(11, '2025-11-10 09:00:00', '2025-11-10 10:05:00', 4, 'programado'),

-- SANTIAGO -> ANTOFAGASTA (08-09 NOV)
(12, '2025-11-08 06:30:00', '2025-11-08 08:30:00', 1, 'programado'),
(12, '2025-11-08 13:00:00', '2025-11-08 15:00:00', 3, 'programado'),
(12, '2025-11-08 19:00:00', '2025-11-08 21:00:00', 7, 'programado'),
(12, '2025-11-09 07:00:00', '2025-11-09 09:00:00', 1, 'programado'),
(12, '2025-11-09 15:00:00', '2025-11-09 17:00:00', 6, 'programado'),

-- SANTIAGO -> PUERTO NATALES (08-11 NOV)
(13, '2025-11-08 08:00:00', '2025-11-08 12:00:00', 1, 'programado'),
(13, '2025-11-09 08:00:00', '2025-11-09 12:00:00', 3, 'programado'),
(13, '2025-11-10 08:00:00', '2025-11-10 12:00:00', 1, 'programado'),
(13, '2025-11-11 08:00:00', '2025-11-11 12:00:00', 3, 'programado'),

-- SANTIAGO -> ISLA DE PASCUA (08-12 NOV)
(14, '2025-11-08 09:00:00', '2025-11-08 14:30:00', 1, 'programado'),
(14, '2025-11-10 09:00:00', '2025-11-10 14:30:00', 1, 'programado'),
(14, '2025-11-12 09:00:00', '2025-11-12 14:30:00', 3, 'programado'),

-- SANTIAGO -> PUNTA CANA (08-12 NOV)
(15, '2025-11-08 23:00:00', '2025-11-09 09:00:00', 1, 'programado'),
(15, '2025-11-10 23:00:00', '2025-11-11 09:00:00', 3, 'programado'),
(15, '2025-11-12 23:00:00', '2025-11-13 09:00:00', 1, 'programado'),

-- SANTIAGO -> RÍO DE JANEIRO (08-09 NOV)
(16, '2025-11-08 10:00:00', '2025-11-08 14:00:00', 1, 'programado'),
(16, '2025-11-08 17:00:00', '2025-11-08 21:00:00', 3, 'programado'),
(16, '2025-11-09 10:00:00', '2025-11-09 14:00:00', 1, 'programado'),
(16, '2025-11-09 17:00:00', '2025-11-09 21:00:00', 5, 'programado'),

-- SANTIAGO -> LIMA (08-09 NOV)
(17, '2025-11-08 08:00:00', '2025-11-08 11:30:00', 1, 'programado'),
(17, '2025-11-08 14:00:00', '2025-11-08 17:30:00', 3, 'programado'),
(17, '2025-11-08 20:00:00', '2025-11-08 23:30:00', 6, 'programado'),
(17, '2025-11-09 08:00:00', '2025-11-09 11:30:00', 1, 'programado'),
(17, '2025-11-09 15:00:00', '2025-11-09 18:30:00', 7, 'programado'),

-- SANTIAGO -> NUEVA YORK (08-12 NOV)
(18, '2025-11-08 22:00:00', '2025-11-09 09:00:00', 1, 'programado'),
(18, '2025-11-10 22:00:00', '2025-11-11 09:00:00', 3, 'programado'),
(18, '2025-11-12 22:00:00', '2025-11-13 09:00:00', 1, 'programado'),

-- SANTIAGO -> CARTAGENA (08-10 NOV)
(19, '2025-11-08 11:00:00', '2025-11-08 18:00:00', 1, 'programado'),
(19, '2025-11-09 11:00:00', '2025-11-09 18:00:00', 3, 'programado'),
(19, '2025-11-10 11:00:00', '2025-11-10 18:00:00', 1, 'programado'),

-- SANTIAGO -> MADRID (08-12 NOV)
(20, '2025-11-08 23:30:00', '2025-11-09 13:30:00', 1, 'programado'),
(20, '2025-11-10 23:30:00', '2025-11-11 13:30:00', 3, 'programado'),
(20, '2025-11-12 23:30:00', '2025-11-13 13:30:00', 1, 'programado'),

-- SANTIAGO -> BARILOCHE (08-09 NOV)
(21, '2025-11-08 09:00:00', '2025-11-08 11:10:00', 2, 'programado'),
(21, '2025-11-08 15:00:00', '2025-11-08 17:10:00', 5, 'programado'),
(21, '2025-11-09 09:00:00', '2025-11-09 11:10:00', 2, 'programado'),
(21, '2025-11-09 16:00:00', '2025-11-09 18:10:00', 4, 'programado'),

-- VUELOS DE REGRESO - COQUIMBO -> SANTIAGO (08-09 NOV)
(22, '2025-11-08 09:00:00', '2025-11-08 10:05:00', 2, 'programado'),
(22, '2025-11-08 14:00:00', '2025-11-08 15:05:00', 4, 'programado'),
(22, '2025-11-08 20:00:00', '2025-11-08 21:05:00', 6, 'programado'),
(22, '2025-11-09 10:00:00', '2025-11-09 11:05:00', 2, 'programado'),

-- ANTOFAGASTA -> SANTIAGO (08-09 NOV)
(23, '2025-11-08 09:00:00', '2025-11-08 11:00:00', 1, 'programado'),
(23, '2025-11-08 16:00:00', '2025-11-08 18:00:00', 3, 'programado'),
(23, '2025-11-09 09:00:00', '2025-11-09 11:00:00', 7, 'programado'),

-- PUERTO NATALES -> SANTIAGO (08-10 NOV)
(24, '2025-11-08 13:00:00', '2025-11-08 17:00:00', 1, 'programado'),
(24, '2025-11-09 13:00:00', '2025-11-09 17:00:00', 3, 'programado'),
(24, '2025-11-10 13:00:00', '2025-11-10 17:00:00', 1, 'programado'),

-- ISLA DE PASCUA -> SANTIAGO (08-12 NOV)
(25, '2025-11-08 16:00:00', '2025-11-08 21:30:00', 1, 'programado'),
(25, '2025-11-10 16:00:00', '2025-11-10 21:30:00', 1, 'programado'),
(25, '2025-11-12 16:00:00', '2025-11-12 21:30:00', 3, 'programado'),

-- PUNTA CANA -> SANTIAGO (09-11 NOV)
(26, '2025-11-09 11:00:00', '2025-11-09 21:00:00', 1, 'programado'),
(26, '2025-11-11 11:00:00', '2025-11-11 21:00:00', 3, 'programado'),

-- RÍO DE JANEIRO -> SANTIAGO (08-10 NOV)
(27, '2025-11-08 16:00:00', '2025-11-08 20:00:00', 1, 'programado'),
(27, '2025-11-09 16:00:00', '2025-11-09 20:00:00', 3, 'programado'),
(27, '2025-11-09 22:00:00', '2025-11-10 02:00:00', 5, 'programado'),

-- LIMA -> SANTIAGO (08-09 NOV)
(28, '2025-11-08 13:00:00', '2025-11-08 16:30:00', 1, 'programado'),
(28, '2025-11-08 18:00:00', '2025-11-08 21:30:00', 3, 'programado'),
(28, '2025-11-09 12:00:00', '2025-11-09 15:30:00', 6, 'programado'),

-- NUEVA YORK -> SANTIAGO (09-11 NOV)
(29, '2025-11-09 12:00:00', '2025-11-09 23:00:00', 1, 'programado'),
(29, '2025-11-11 12:00:00', '2025-11-11 23:00:00', 3, 'programado'),

-- CARTAGENA -> SANTIAGO (08-10 NOV)
(30, '2025-11-08 20:00:00', '2025-11-09 03:00:00', 1, 'programado'),
(30, '2025-11-09 20:00:00', '2025-11-10 03:00:00', 3, 'programado'),

-- MADRID -> SANTIAGO (09-11 NOV)
(31, '2025-11-09 16:00:00', '2025-11-10 06:00:00', 1, 'programado'),
(31, '2025-11-11 16:00:00', '2025-11-12 06:00:00', 3, 'programado'),

-- BARILOCHE -> SANTIAGO (08-09 NOV)
(32, '2025-11-08 12:00:00', '2025-11-08 14:10:00', 2, 'programado'),
(32, '2025-11-08 18:00:00', '2025-11-08 20:10:00', 5, 'programado'),
(32, '2025-11-09 12:00:00', '2025-11-09 14:10:00', 4, 'programado');

-- =====================================================
-- TARIFAS PARA TODOS LOS VUELOS
-- =====================================================

-- Viajes a Puerto Montt (idViaje 1-5)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(1, 1, 89990, 'CLP', 50), (1, 2, 129990, 'CLP', 80), (1, 3, 189990, 'CLP', 30), (1, 4, 349990, 'CLP', 20),
(2, 1, 95990, 'CLP', 50), (2, 2, 135990, 'CLP', 80), (2, 3, 195990, 'CLP', 30), (2, 4, 359990, 'CLP', 20),
(3, 1, 79990, 'CLP', 50), (3, 2, 119990, 'CLP', 80), (3, 3, 179990, 'CLP', 30), (3, 4, 339990, 'CLP', 20),
(4, 1, 92990, 'CLP', 50), (4, 2, 132990, 'CLP', 80), (4, 3, 192990, 'CLP', 30), (4, 4, 352990, 'CLP', 20),
(5, 1, 87990, 'CLP', 50), (5, 2, 127990, 'CLP', 80), (5, 3, 187990, 'CLP', 30), (5, 4, 347990, 'CLP', 20);

-- Viajes a Iquique (idViaje 6-9)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(6, 1, 119990, 'CLP', 50), (6, 2, 159990, 'CLP', 80), (6, 3, 219990, 'CLP', 30), (6, 4, 389990, 'CLP', 20),
(7, 1, 109990, 'CLP', 50), (7, 2, 149990, 'CLP', 80), (7, 3, 209990, 'CLP', 30), (7, 4, 379990, 'CLP', 20),
(8, 1, 115990, 'CLP', 50), (8, 2, 155990, 'CLP', 80), (8, 3, 215990, 'CLP', 30), (8, 4, 385990, 'CLP', 20),
(9, 1, 112990, 'CLP', 50), (9, 2, 152990, 'CLP', 80), (9, 3, 212990, 'CLP', 30), (9, 4, 382990, 'CLP', 20);

-- Viajes a Cusco (idViaje 10-12)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(10, 1, 299990, 'CLP', 50), (10, 2, 399990, 'CLP', 80), (10, 3, 549990, 'CLP', 30), (10, 4, 799990, 'CLP', 20),
(11, 1, 289990, 'CLP', 50), (11, 2, 389990, 'CLP', 80), (11, 3, 539990, 'CLP', 30), (11, 4, 789990, 'CLP', 20),
(12, 1, 309990, 'CLP', 50), (12, 2, 409990, 'CLP', 80), (12, 3, 559990, 'CLP', 30), (12, 4, 809990, 'CLP', 20);

-- Viajes a Buenos Aires (idViaje 13-16)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(13, 1, 159990, 'CLP', 50), (13, 2, 219990, 'CLP', 80), (13, 3, 299990, 'CLP', 30), (13, 4, 499990, 'CLP', 20),
(14, 1, 149990, 'CLP', 50), (14, 2, 209990, 'CLP', 80), (14, 3, 289990, 'CLP', 30), (14, 4, 489990, 'CLP', 20),
(15, 1, 165990, 'CLP', 50), (15, 2, 225990, 'CLP', 80), (15, 3, 305990, 'CLP', 30), (15, 4, 505990, 'CLP', 20),
(16, 1, 155990, 'CLP', 50), (16, 2, 215990, 'CLP', 80), (16, 3, 295990, 'CLP', 30), (16, 4, 495990, 'CLP', 20);

-- Viajes a Ciudad de México (idViaje 17-18)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(17, 1, 449990, 'CLP', 50), (17, 2, 599990, 'CLP', 80), (17, 3, 799990, 'CLP', 30), (17, 4, 1299990, 'CLP', 20),
(18, 1, 439990, 'CLP', 50), (18, 2, 589990, 'CLP', 80), (18, 3, 789990, 'CLP', 30), (18, 4, 1289990, 'CLP', 20);

-- Vuelos de regreso PMC -> SCL (idViaje 19-34)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(19, 1, 85990, 'CLP', 50), (19, 2, 125990, 'CLP', 80), (19, 3, 185990, 'CLP', 30), (19, 4, 345990, 'CLP', 20),
(20, 1, 82990, 'CLP', 50), (20, 2, 122990, 'CLP', 80), (20, 3, 182990, 'CLP', 30), (20, 4, 342990, 'CLP', 20),
(21, 1, 94990, 'CLP', 50), (21, 2, 134990, 'CLP', 80), (21, 3, 194990, 'CLP', 30), (21, 4, 354990, 'CLP', 20),
(22, 1, 89990, 'CLP', 50), (22, 2, 129990, 'CLP', 80), (22, 3, 189990, 'CLP', 30), (22, 4, 349990, 'CLP', 20),
(23, 1, 87990, 'CLP', 50), (23, 2, 127990, 'CLP', 80), (23, 3, 187990, 'CLP', 30), (23, 4, 347990, 'CLP', 20),
(24, 1, 84990, 'CLP', 50), (24, 2, 124990, 'CLP', 80), (24, 3, 184990, 'CLP', 30), (24, 4, 344990, 'CLP', 20),
(25, 1, 91990, 'CLP', 50), (25, 2, 131990, 'CLP', 80), (25, 3, 191990, 'CLP', 30), (25, 4, 351990, 'CLP', 20),
(26, 1, 88990, 'CLP', 50), (26, 2, 128990, 'CLP', 80), (26, 3, 188990, 'CLP', 30), (26, 4, 348990, 'CLP', 20),
(27, 1, 86990, 'CLP', 50), (27, 2, 126990, 'CLP', 80), (27, 3, 186990, 'CLP', 30), (27, 4, 346990, 'CLP', 20),
(28, 1, 83990, 'CLP', 50), (28, 2, 123990, 'CLP', 80), (28, 3, 183990, 'CLP', 30), (28, 4, 343990, 'CLP', 20),
(29, 1, 92990, 'CLP', 50), (29, 2, 132990, 'CLP', 80), (29, 3, 192990, 'CLP', 30), (29, 4, 352990, 'CLP', 20),
(30, 1, 89990, 'CLP', 50), (30, 2, 129990, 'CLP', 80), (30, 3, 189990, 'CLP', 30), (30, 4, 349990, 'CLP', 20),
(31, 1, 87990, 'CLP', 50), (31, 2, 127990, 'CLP', 80), (31, 3, 187990, 'CLP', 30), (31, 4, 347990, 'CLP', 20),
(32, 1, 85490, 'CLP', 50), (32, 2, 125490, 'CLP', 80), (32, 3, 185490, 'CLP', 30), (32, 4, 345490, 'CLP', 20),
(33, 1, 92490, 'CLP', 50), (33, 2, 132490, 'CLP', 80), (33, 3, 192490, 'CLP', 30), (33, 4, 352490, 'CLP', 20),
(34, 1, 88490, 'CLP', 50), (34, 2, 128490, 'CLP', 80), (34, 3, 188490, 'CLP', 30), (34, 4, 348490, 'CLP', 20);

-- Vuelos IQQ -> SCL (idViaje 35-47)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(35, 1, 115990, 'CLP', 50), (35, 2, 155990, 'CLP', 80), (35, 3, 215990, 'CLP', 30), (35, 4, 385990, 'CLP', 20),
(36, 1, 109990, 'CLP', 50), (36, 2, 149990, 'CLP', 80), (36, 3, 209990, 'CLP', 30), (36, 4, 379990, 'CLP', 20),
(37, 1, 118990, 'CLP', 50), (37, 2, 158990, 'CLP', 80), (37, 3, 218990, 'CLP', 30), (37, 4, 388990, 'CLP', 20),
(38, 1, 112990, 'CLP', 50), (38, 2, 152990, 'CLP', 80), (38, 3, 212990, 'CLP', 30), (38, 4, 382990, 'CLP', 20),
(39, 1, 114990, 'CLP', 50), (39, 2, 154990, 'CLP', 80), (39, 3, 214990, 'CLP', 30), (39, 4, 384990, 'CLP', 20),
(40, 1, 110990, 'CLP', 50), (40, 2, 150990, 'CLP', 80), (40, 3, 210990, 'CLP', 30), (40, 4, 380990, 'CLP', 20),
(41, 1, 116990, 'CLP', 50), (41, 2, 156990, 'CLP', 80), (41, 3, 216990, 'CLP', 30), (41, 4, 386990, 'CLP', 20),
(42, 1, 113990, 'CLP', 50), (42, 2, 153990, 'CLP', 80), (42, 3, 213990, 'CLP', 30), (42, 4, 383990, 'CLP', 20),
(43, 1, 111990, 'CLP', 50), (43, 2, 151990, 'CLP', 80), (43, 3, 211990, 'CLP', 30), (43, 4, 381990, 'CLP', 20),
(44, 1, 108990, 'CLP', 50), (44, 2, 148990, 'CLP', 80), (44, 3, 208990, 'CLP', 30), (44, 4, 378990, 'CLP', 20),
(45, 1, 117990, 'CLP', 50), (45, 2, 157990, 'CLP', 80), (45, 3, 217990, 'CLP', 30), (45, 4, 387990, 'CLP', 20),
(46, 1, 114990, 'CLP', 50), (46, 2, 154990, 'CLP', 80), (46, 3, 214990, 'CLP', 30), (46, 4, 384990, 'CLP', 20),
(47, 1, 112990, 'CLP', 50), (47, 2, 152990, 'CLP', 80), (47, 3, 212990, 'CLP', 30), (47, 4, 382990, 'CLP', 20);

-- Vuelos CUZ -> SCL (idViaje 48-55)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(48, 1, 295990, 'CLP', 50), (48, 2, 395990, 'CLP', 80), (48, 3, 545990, 'CLP', 30), (48, 4, 795990, 'CLP', 20),
(49, 1, 285990, 'CLP', 50), (49, 2, 385990, 'CLP', 80), (49, 3, 535990, 'CLP', 30), (49, 4, 785990, 'CLP', 20),
(50, 1, 292990, 'CLP', 50), (50, 2, 392990, 'CLP', 80), (50, 3, 542990, 'CLP', 30), (50, 4, 792990, 'CLP', 20),
(51, 1, 288990, 'CLP', 50), (51, 2, 388990, 'CLP', 80), (51, 3, 538990, 'CLP', 30), (51, 4, 788990, 'CLP', 20),
(52, 1, 305990, 'CLP', 50), (52, 2, 405990, 'CLP', 80), (52, 3, 555990, 'CLP', 30), (52, 4, 805990, 'CLP', 20),
(53, 1, 298990, 'CLP', 50), (53, 2, 398990, 'CLP', 80), (53, 3, 548990, 'CLP', 30), (53, 4, 798990, 'CLP', 20),
(54, 1, 302990, 'CLP', 50), (54, 2, 402990, 'CLP', 80), (54, 3, 552990, 'CLP', 30), (54, 4, 802990, 'CLP', 20),
(55, 1, 295990, 'CLP', 50), (55, 2, 395990, 'CLP', 80), (55, 3, 545990, 'CLP', 30), (55, 4, 795990, 'CLP', 20);

-- Vuelos EZE -> SCL (idViaje 56-68)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(56, 1, 158990, 'CLP', 50), (56, 2, 218990, 'CLP', 80), (56, 3, 298990, 'CLP', 30), (56, 4, 498990, 'CLP', 20),
(57, 1, 152990, 'CLP', 50), (57, 2, 212990, 'CLP', 80), (57, 3, 292990, 'CLP', 30), (57, 4, 492990, 'CLP', 20),
(58, 1, 162990, 'CLP', 50), (58, 2, 222990, 'CLP', 80), (58, 3, 302990, 'CLP', 30), (58, 4, 502990, 'CLP', 20),
(59, 1, 156990, 'CLP', 50), (59, 2, 216990, 'CLP', 80), (59, 3, 296990, 'CLP', 30), (59, 4, 496990, 'CLP', 20),
(60, 1, 160990, 'CLP', 50), (60, 2, 220990, 'CLP', 80), (60, 3, 300990, 'CLP', 30), (60, 4, 500990, 'CLP', 20),
(61, 1, 154990, 'CLP', 50), (61, 2, 214990, 'CLP', 80), (61, 3, 294990, 'CLP', 30), (61, 4, 494990, 'CLP', 20),
(62, 1, 164990, 'CLP', 50), (62, 2, 224990, 'CLP', 80), (62, 3, 304990, 'CLP', 30), (62, 4, 504990, 'CLP', 20),
(63, 1, 159990, 'CLP', 50), (63, 2, 219990, 'CLP', 80), (63, 3, 299990, 'CLP', 30), (63, 4, 499990, 'CLP', 20),
(64, 1, 157990, 'CLP', 50), (64, 2, 217990, 'CLP', 80), (64, 3, 297990, 'CLP', 30), (64, 4, 497990, 'CLP', 20),
(65, 1, 155990, 'CLP', 50), (65, 2, 215990, 'CLP', 80), (65, 3, 295990, 'CLP', 30), (65, 4, 495990, 'CLP', 20),
(66, 1, 161990, 'CLP', 50), (66, 2, 221990, 'CLP', 80), (66, 3, 301990, 'CLP', 30), (66, 4, 501990, 'CLP', 20),
(67, 1, 163990, 'CLP', 50), (67, 2, 223990, 'CLP', 80), (67, 3, 303990, 'CLP', 30), (67, 4, 503990, 'CLP', 20),
(68, 1, 158990, 'CLP', 50), (68, 2, 218990, 'CLP', 80), (68, 3, 298990, 'CLP', 30), (68, 4, 498990, 'CLP', 20);

-- Vuelos MEX -> SCL (idViaje 69-74)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(69, 1, 445990, 'CLP', 50), (69, 2, 595990, 'CLP', 80), (69, 3, 795990, 'CLP', 30), (69, 4, 1295990, 'CLP', 20),
(70, 1, 435990, 'CLP', 50), (70, 2, 585990, 'CLP', 80), (70, 3, 785990, 'CLP', 30), (70, 4, 1285990, 'CLP', 20),
(71, 1, 448990, 'CLP', 50), (71, 2, 598990, 'CLP', 80), (71, 3, 798990, 'CLP', 30), (71, 4, 1298990, 'CLP', 20),
(72, 1, 442990, 'CLP', 50), (72, 2, 592990, 'CLP', 80), (72, 3, 792990, 'CLP', 30), (72, 4, 1292990, 'CLP', 20),
(73, 1, 446990, 'CLP', 50), (73, 2, 596990, 'CLP', 80), (73, 3, 796990, 'CLP', 30), (73, 4, 1296990, 'CLP', 20),
(74, 1, 438990, 'CLP', 50), (74, 2, 588990, 'CLP', 80), (74, 3, 788990, 'CLP', 30), (74, 4, 1288990, 'CLP', 20);

-- Viajes SCL -> COQUIMBO (idViaje 75-80)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(75, 1, 45990, 'CLP', 50), (75, 2, 75990, 'CLP', 80), (75, 3, 119990, 'CLP', 30), (75, 4, 189990, 'CLP', 20),
(76, 1, 48990, 'CLP', 50), (76, 2, 78990, 'CLP', 80), (76, 3, 122990, 'CLP', 30), (76, 4, 192990, 'CLP', 20),
(77, 1, 44990, 'CLP', 50), (77, 2, 74990, 'CLP', 80), (77, 3, 118990, 'CLP', 30), (77, 4, 188990, 'CLP', 20),
(78, 1, 46990, 'CLP', 50), (78, 2, 76990, 'CLP', 80), (78, 3, 120990, 'CLP', 30), (78, 4, 190990, 'CLP', 20),
(79, 1, 47990, 'CLP', 50), (79, 2, 77990, 'CLP', 80), (79, 3, 121990, 'CLP', 30), (79, 4, 191990, 'CLP', 20),
(80, 1, 46490, 'CLP', 50), (80, 2, 76490, 'CLP', 80), (80, 3, 120490, 'CLP', 30), (80, 4, 190490, 'CLP', 20);

-- Viajes SCL -> ANTOFAGASTA (idViaje 81-85)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(81, 1, 99990, 'CLP', 50), (81, 2, 139990, 'CLP', 80), (81, 3, 199990, 'CLP', 30), (81, 4, 329990, 'CLP', 20),
(82, 1, 95990, 'CLP', 50), (82, 2, 135990, 'CLP', 80), (82, 3, 195990, 'CLP', 30), (82, 4, 325990, 'CLP', 20),
(83, 1, 89990, 'CLP', 50), (83, 2, 129990, 'CLP', 80), (83, 3, 189990, 'CLP', 30), (83, 4, 319990, 'CLP', 20),
(84, 1, 97990, 'CLP', 50), (84, 2, 137990, 'CLP', 80), (84, 3, 197990, 'CLP', 30), (84, 4, 327990, 'CLP', 20),
(85, 1, 94990, 'CLP', 50), (85, 2, 134990, 'CLP', 80), (85, 3, 194990, 'CLP', 30), (85, 4, 324990, 'CLP', 20);

-- Viajes SCL -> TORRES DEL PAINE (idViaje 86-89)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(86, 1, 349990, 'CLP', 50), (86, 2, 459990, 'CLP', 80), (86, 3, 599990, 'CLP', 30), (86, 4, 899990, 'CLP', 20),
(87, 1, 345990, 'CLP', 50), (87, 2, 455990, 'CLP', 80), (87, 3, 595990, 'CLP', 30), (87, 4, 895990, 'CLP', 20),
(88, 1, 352990, 'CLP', 50), (88, 2, 462990, 'CLP', 80), (88, 3, 602990, 'CLP', 30), (88, 4, 902990, 'CLP', 20),
(89, 1, 348990, 'CLP', 50), (89, 2, 458990, 'CLP', 80), (89, 3, 598990, 'CLP', 30), (89, 4, 898990, 'CLP', 20);

-- Viajes SCL -> ISLA DE PASCUA (idViaje 90-92)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(90, 1, 449990, 'CLP', 50), (90, 2, 579990, 'CLP', 80), (90, 3, 749990, 'CLP', 30), (90, 4, 1149990, 'CLP', 20),
(91, 1, 445990, 'CLP', 50), (91, 2, 575990, 'CLP', 80), (91, 3, 745990, 'CLP', 30), (91, 4, 1145990, 'CLP', 20),
(92, 1, 452990, 'CLP', 50), (92, 2, 582990, 'CLP', 80), (92, 3, 752990, 'CLP', 30), (92, 4, 1152990, 'CLP', 20);

-- Viajes SCL -> PUNTA CANA (idViaje 93-95)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(93, 1, 649990, 'CLP', 50), (93, 2, 849990, 'CLP', 80), (93, 3, 1149990, 'CLP', 30), (93, 4, 1799990, 'CLP', 20),
(94, 1, 639990, 'CLP', 50), (94, 2, 839990, 'CLP', 80), (94, 3, 1139990, 'CLP', 30), (94, 4, 1789990, 'CLP', 20),
(95, 1, 655990, 'CLP', 50), (95, 2, 855990, 'CLP', 80), (95, 3, 1155990, 'CLP', 30), (95, 4, 1805990, 'CLP', 20);

-- Viajes SCL -> RÍO DE JANEIRO (idViaje 96-99)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(96, 1, 349990, 'CLP', 50), (96, 2, 479990, 'CLP', 80), (96, 3, 649990, 'CLP', 30), (96, 4, 999990, 'CLP', 20),
(97, 1, 345990, 'CLP', 50), (97, 2, 475990, 'CLP', 80), (97, 3, 645990, 'CLP', 30), (97, 4, 995990, 'CLP', 20),
(98, 1, 352990, 'CLP', 50), (98, 2, 482990, 'CLP', 80), (98, 3, 652990, 'CLP', 30), (98, 4, 1002990, 'CLP', 20),
(99, 1, 348990, 'CLP', 50), (99, 2, 478990, 'CLP', 80), (99, 3, 648990, 'CLP', 30), (99, 4, 998990, 'CLP', 20);

-- Viajes SCL -> LIMA (idViaje 100-104)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(100, 1, 229990, 'CLP', 50), (100, 2, 329990, 'CLP', 80), (100, 3, 449990, 'CLP', 30), (100, 4, 699990, 'CLP', 20),
(101, 1, 225990, 'CLP', 50), (101, 2, 325990, 'CLP', 80), (101, 3, 445990, 'CLP', 30), (101, 4, 695990, 'CLP', 20),
(102, 1, 219990, 'CLP', 50), (102, 2, 319990, 'CLP', 80), (102, 3, 439990, 'CLP', 30), (102, 4, 689990, 'CLP', 20),
(103, 1, 227990, 'CLP', 50), (103, 2, 327990, 'CLP', 80), (103, 3, 447990, 'CLP', 30), (103, 4, 697990, 'CLP', 20),
(104, 1, 224990, 'CLP', 50), (104, 2, 324990, 'CLP', 80), (104, 3, 444990, 'CLP', 30), (104, 4, 694990, 'CLP', 20);

-- Viajes SCL -> NUEVA YORK (idViaje 105-107)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(105, 1, 749990, 'CLP', 50), (105, 2, 999990, 'CLP', 80), (105, 3, 1349990, 'CLP', 30), (105, 4, 2099990, 'CLP', 20),
(106, 1, 739990, 'CLP', 50), (106, 2, 989990, 'CLP', 80), (106, 3, 1339990, 'CLP', 30), (106, 4, 2089990, 'CLP', 20),
(107, 1, 755990, 'CLP', 50), (107, 2, 1005990, 'CLP', 80), (107, 3, 1355990, 'CLP', 30), (107, 4, 2105990, 'CLP', 20);

-- Viajes SCL -> CARTAGENA (idViaje 108-110)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(108, 1, 399990, 'CLP', 50), (108, 2, 529990, 'CLP', 80), (108, 3, 699990, 'CLP', 30), (108, 4, 1099990, 'CLP', 20),
(109, 1, 395990, 'CLP', 50), (109, 2, 525990, 'CLP', 80), (109, 3, 695990, 'CLP', 30), (109, 4, 1095990, 'CLP', 20),
(110, 1, 402990, 'CLP', 50), (110, 2, 532990, 'CLP', 80), (110, 3, 702990, 'CLP', 30), (110, 4, 1102990, 'CLP', 20);

-- Viajes SCL -> MADRID (idViaje 111-113)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(111, 1, 849990, 'CLP', 50), (111, 2, 1149990, 'CLP', 80), (111, 3, 1549990, 'CLP', 30), (111, 4, 2399990, 'CLP', 20),
(112, 1, 839990, 'CLP', 50), (112, 2, 1139990, 'CLP', 80), (112, 3, 1539990, 'CLP', 30), (112, 4, 2389990, 'CLP', 20),
(113, 1, 855990, 'CLP', 50), (113, 2, 1155990, 'CLP', 80), (113, 3, 1555990, 'CLP', 30), (113, 4, 2405990, 'CLP', 20);

-- Viajes SCL -> BARILOCHE (idViaje 114-117)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(114, 1, 249990, 'CLP', 50), (114, 2, 349990, 'CLP', 80), (114, 3, 479990, 'CLP', 30), (114, 4, 749990, 'CLP', 20),
(115, 1, 245990, 'CLP', 50), (115, 2, 345990, 'CLP', 80), (115, 3, 475990, 'CLP', 30), (115, 4, 745990, 'CLP', 20),
(116, 1, 252990, 'CLP', 50), (116, 2, 352990, 'CLP', 80), (116, 3, 482990, 'CLP', 30), (116, 4, 752990, 'CLP', 20),
(117, 1, 248990, 'CLP', 50), (117, 2, 348990, 'CLP', 80), (117, 3, 478990, 'CLP', 30), (117, 4, 748990, 'CLP', 20);

-- COQUIMBO -> SCL (idViaje 118-121)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(118, 1, 46990, 'CLP', 50), (118, 2, 76990, 'CLP', 80), (118, 3, 120990, 'CLP', 30), (118, 4, 190990, 'CLP', 20),
(119, 1, 47990, 'CLP', 50), (119, 2, 77990, 'CLP', 80), (119, 3, 121990, 'CLP', 30), (119, 4, 191990, 'CLP', 20),
(120, 1, 45990, 'CLP', 50), (120, 2, 75990, 'CLP', 80), (120, 3, 119990, 'CLP', 30), (120, 4, 189990, 'CLP', 20),
(121, 1, 48490, 'CLP', 50), (121, 2, 78490, 'CLP', 80), (121, 3, 122490, 'CLP', 30), (121, 4, 192490, 'CLP', 20);

-- ANTOFAGASTA -> SCL (idViaje 122-124)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(122, 1, 98990, 'CLP', 50), (122, 2, 138990, 'CLP', 80), (122, 3, 198990, 'CLP', 30), (122, 4, 328990, 'CLP', 20),
(123, 1, 96990, 'CLP', 50), (123, 2, 136990, 'CLP', 80), (123, 3, 196990, 'CLP', 30), (123, 4, 326990, 'CLP', 20),
(124, 1, 99990, 'CLP', 50), (124, 2, 139990, 'CLP', 80), (124, 3, 199990, 'CLP', 30), (124, 4, 329990, 'CLP', 20);

-- PUERTO NATALES -> SCL (idViaje 125-127)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(125, 1, 351990, 'CLP', 50), (125, 2, 461990, 'CLP', 80), (125, 3, 601990, 'CLP', 30), (125, 4, 901990, 'CLP', 20),
(126, 1, 347990, 'CLP', 50), (126, 2, 457990, 'CLP', 80), (126, 3, 597990, 'CLP', 30), (126, 4, 897990, 'CLP', 20),
(127, 1, 353990, 'CLP', 50), (127, 2, 463990, 'CLP', 80), (127, 3, 603990, 'CLP', 30), (127, 4, 903990, 'CLP', 20);

-- ISLA DE PASCUA -> SCL (idViaje 128-130)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(128, 1, 451990, 'CLP', 50), (128, 2, 581990, 'CLP', 80), (128, 3, 751990, 'CLP', 30), (128, 4, 1151990, 'CLP', 20),
(129, 1, 447990, 'CLP', 50), (129, 2, 577990, 'CLP', 80), (129, 3, 747990, 'CLP', 30), (129, 4, 1147990, 'CLP', 20),
(130, 1, 454990, 'CLP', 50), (130, 2, 584990, 'CLP', 80), (130, 3, 754990, 'CLP', 30), (130, 4, 1154990, 'CLP', 20);

-- PUNTA CANA -> SCL (idViaje 131-132)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(131, 1, 651990, 'CLP', 50), (131, 2, 851990, 'CLP', 80), (131, 3, 1151990, 'CLP', 30), (131, 4, 1801990, 'CLP', 20),
(132, 1, 641990, 'CLP', 50), (132, 2, 841990, 'CLP', 80), (132, 3, 1141990, 'CLP', 30), (132, 4, 1791990, 'CLP', 20);

-- RÍO -> SCL (idViaje 133-135)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(133, 1, 351990, 'CLP', 50), (133, 2, 481990, 'CLP', 80), (133, 3, 651990, 'CLP', 30), (133, 4, 1001990, 'CLP', 20),
(134, 1, 347990, 'CLP', 50), (134, 2, 477990, 'CLP', 80), (134, 3, 647990, 'CLP', 30), (134, 4, 997990, 'CLP', 20),
(135, 1, 354990, 'CLP', 50), (135, 2, 484990, 'CLP', 80), (135, 3, 654990, 'CLP', 30), (135, 4, 1004990, 'CLP', 20);

-- LIMA -> SCL (idViaje 136-138)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(136, 1, 231990, 'CLP', 50), (136, 2, 331990, 'CLP', 80), (136, 3, 451990, 'CLP', 30), (136, 4, 701990, 'CLP', 20),
(137, 1, 227990, 'CLP', 50), (137, 2, 327990, 'CLP', 80), (137, 3, 447990, 'CLP', 30), (137, 4, 697990, 'CLP', 20),
(138, 1, 228990, 'CLP', 50), (138, 2, 328990, 'CLP', 80), (138, 3, 448990, 'CLP', 30), (138, 4, 698990, 'CLP', 20);

-- NUEVA YORK -> SCL (idViaje 139-140)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(139, 1, 751990, 'CLP', 50), (139, 2, 1001990, 'CLP', 80), (139, 3, 1351990, 'CLP', 30), (139, 4, 2101990, 'CLP', 20),
(140, 1, 741990, 'CLP', 50), (140, 2, 991990, 'CLP', 80), (140, 3, 1341990, 'CLP', 30), (140, 4, 2091990, 'CLP', 20);

-- CARTAGENA -> SCL (idViaje 141-142)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(141, 1, 401990, 'CLP', 50), (141, 2, 531990, 'CLP', 80), (141, 3, 701990, 'CLP', 30), (141, 4, 1101990, 'CLP', 20),
(142, 1, 397990, 'CLP', 50), (142, 2, 527990, 'CLP', 80), (142, 3, 697990, 'CLP', 30), (142, 4, 1097990, 'CLP', 20);

-- MADRID -> SCL (idViaje 143-144)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(143, 1, 851990, 'CLP', 50), (143, 2, 1151990, 'CLP', 80), (143, 3, 1551990, 'CLP', 30), (143, 4, 2401990, 'CLP', 20),
(144, 1, 841990, 'CLP', 50), (144, 2, 1141990, 'CLP', 80), (144, 3, 1541990, 'CLP', 30), (144, 4, 2391990, 'CLP', 20);

-- BARILOCHE -> SCL (idViaje 145-147)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos) VALUES 
(145, 1, 251990, 'CLP', 50), (145, 2, 351990, 'CLP', 80), (145, 3, 481990, 'CLP', 30), (145, 4, 751990, 'CLP', 20),
(146, 1, 247990, 'CLP', 50), (146, 2, 347990, 'CLP', 80), (146, 3, 477990, 'CLP', 30), (146, 4, 747990, 'CLP', 20),
(147, 1, 253990, 'CLP', 50), (147, 2, 353990, 'CLP', 80), (147, 3, 483990, 'CLP', 30), (147, 4, 753990, 'CLP', 20);

-- =====================================================
-- ASIENTOS DE EJEMPLO (PARA PRIMER VIAJE)
-- =====================================================

INSERT INTO asiento (idViaje, numero, idCabinaClase, disponible) VALUES 
-- Viaje 1: Asientos económicos
(1, '1A', 1, 1), (1, '1B', 1, 1), (1, '1C', 1, 1), (1, '1D', 1, 1),
(1, '2A', 1, 1), (1, '2B', 1, 1), (1, '2C', 1, 1), (1, '2D', 1, 1),
(1, '3A', 1, 1), (1, '3B', 1, 1), (1, '3C', 1, 1), (1, '3D', 1, 1),
(1, '4A', 1, 1), (1, '4B', 1, 1), (1, '4C', 1, 1), (1, '4D', 1, 1),
(1, '5A', 1, 1), (1, '5B', 1, 1), (1, '5C', 1, 1), (1, '5D', 1, 1),
-- Asientos premium
(1, '10A', 2, 1), (1, '10B', 2, 1), (1, '10C', 2, 1), (1, '10D', 2, 1),
(1, '11A', 2, 1), (1, '11B', 2, 1), (1, '11C', 2, 1), (1, '11D', 2, 1),
-- Asientos ejecutivos
(1, '20A', 3, 1), (1, '20B', 3, 1), (1, '20C', 3, 1), (1, '20D', 3, 1);

-- =====================================================
-- RUTAS DE BUS
-- =====================================================

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) VALUES
-- Santiago -> Temuco
(18, 19, 680, 540, 1),
-- Temuco -> Santiago
(19, 18, 680, 540, 1),
-- Santiago -> Valparaíso
(18, 20, 120, 90, 1),
-- Valparaíso -> Santiago
(20, 18, 120, 90, 1),
-- Santiago -> La Serena
(18, 22, 470, 390, 1),
-- La Serena -> Santiago
(22, 18, 470, 390, 1),
-- Santiago -> Concepción
(18, 21, 500, 420, 1),
-- Concepción -> Santiago
(21, 18, 500, 420, 1);

-- =====================================================
-- VIAJES DE BUS - FECHAS ACTUALIZADAS (06-13 NOV 2025)
-- =====================================================

-- BUSES SANTIAGO -> TEMUCO (06-08 NOV)
INSERT INTO viaje (idRuta, salida, llegada, idEquipo, estado) VALUES
-- 06 NOV
(33, '2025-11-06 07:00:00', '2025-11-06 16:00:00', 8, 'programado'),
(33, '2025-11-06 10:00:00', '2025-11-06 19:00:00', 9, 'programado'),
(33, '2025-11-06 14:00:00', '2025-11-06 23:00:00', 10, 'programado'),
(33, '2025-11-06 22:00:00', '2025-11-07 07:00:00', 11, 'programado'),
-- 07 NOV
(33, '2025-11-07 08:00:00', '2025-11-07 17:00:00', 8, 'programado'),
(33, '2025-11-07 15:00:00', '2025-11-08 00:00:00', 9, 'programado'),
(33, '2025-11-07 23:00:00', '2025-11-08 08:00:00', 10, 'programado'),
-- 08 NOV
(33, '2025-11-08 09:00:00', '2025-11-08 18:00:00', 11, 'programado'),
(33, '2025-11-08 13:00:00', '2025-11-08 22:00:00', 8, 'programado'),
(33, '2025-11-08 21:00:00', '2025-11-09 06:00:00', 9, 'programado');

-- BUSES TEMUCO -> SANTIAGO (09-11 NOV)
INSERT INTO viaje (idRuta, salida, llegada, idEquipo, estado) VALUES
(34, '2025-11-09 08:00:00', '2025-11-09 17:00:00', 8, 'programado'),
(34, '2025-11-09 14:00:00', '2025-11-09 23:00:00', 9, 'programado'),
(34, '2025-11-09 22:00:00', '2025-11-10 07:00:00', 10, 'programado'),
(34, '2025-11-10 10:00:00', '2025-11-10 19:00:00', 11, 'programado'),
(34, '2025-11-10 16:00:00', '2025-11-11 01:00:00', 8, 'programado');

-- BUSES SANTIAGO -> LA SERENA (06-08 NOV)
INSERT INTO viaje (idRuta, salida, llegada, idEquipo, estado) VALUES
(37, '2025-11-06 07:00:00', '2025-11-06 13:30:00', 8, 'programado'),
(37, '2025-11-06 09:00:00', '2025-11-06 15:30:00', 9, 'programado'),
(37, '2025-11-06 15:00:00', '2025-11-06 21:30:00', 10, 'programado'),
(37, '2025-11-07 08:00:00', '2025-11-07 14:30:00', 11, 'programado'),
(37, '2025-11-07 16:00:00', '2025-11-07 22:30:00', 8, 'programado'),
(37, '2025-11-08 10:00:00', '2025-11-08 16:30:00', 9, 'programado');

-- BUSES LA SERENA -> SANTIAGO (08-09 NOV)
INSERT INTO viaje (idRuta, salida, llegada, idEquipo, estado) VALUES
(38, '2025-11-08 09:00:00', '2025-11-08 15:30:00', 10, 'programado'),
(38, '2025-11-08 17:00:00', '2025-11-08 23:30:00', 11, 'programado'),
(38, '2025-11-09 08:00:00', '2025-11-09 14:30:00', 8, 'programado'),
(38, '2025-11-09 16:00:00', '2025-11-09 22:30:00', 9, 'programado');

-- BUSES SANTIAGO -> VALPARAÍSO (06-07 NOV)
INSERT INTO viaje (idRuta, salida, llegada, idEquipo, estado) VALUES
(35, '2025-11-06 06:00:00', '2025-11-06 07:30:00', 8, 'programado'),
(35, '2025-11-06 08:00:00', '2025-11-06 09:30:00', 9, 'programado'),
(35, '2025-11-06 12:00:00', '2025-11-06 13:30:00', 10, 'programado'),
(35, '2025-11-06 16:00:00', '2025-11-06 17:30:00', 11, 'programado'),
(35, '2025-11-06 20:00:00', '2025-11-06 21:30:00', 8, 'programado'),
(35, '2025-11-07 07:00:00', '2025-11-07 08:30:00', 9, 'programado'),
(35, '2025-11-07 14:00:00', '2025-11-07 15:30:00', 10, 'programado'),
(35, '2025-11-07 18:00:00', '2025-11-07 19:30:00', 11, 'programado');

-- BUSES VALPARAÍSO -> SANTIAGO (06-07 NOV)
INSERT INTO viaje (idRuta, salida, llegada, idEquipo, estado) VALUES
(36, '2025-11-06 09:00:00', '2025-11-06 10:30:00', 8, 'programado'),
(36, '2025-11-06 13:00:00', '2025-11-06 14:30:00', 9, 'programado'),
(36, '2025-11-06 18:00:00', '2025-11-06 19:30:00', 10, 'programado'),
(36, '2025-11-07 08:00:00', '2025-11-07 09:30:00', 11, 'programado'),
(36, '2025-11-07 15:00:00', '2025-11-07 16:30:00', 8, 'programado');

-- BUSES SANTIAGO -> CONCEPCIÓN (06-07 NOV)
INSERT INTO viaje (idRuta, salida, llegada, idEquipo, estado) VALUES
(39, '2025-11-06 07:00:00', '2025-11-06 14:00:00', 9, 'programado'),
(39, '2025-11-06 14:00:00', '2025-11-06 21:00:00', 10, 'programado'),
(39, '2025-11-06 23:00:00', '2025-11-07 06:00:00', 11, 'programado'),
(39, '2025-11-07 09:00:00', '2025-11-07 16:00:00', 8, 'programado');

-- BUSES CONCEPCIÓN -> SANTIAGO (08-09 NOV)
INSERT INTO viaje (idRuta, salida, llegada, idEquipo, estado) VALUES
(40, '2025-11-08 08:00:00', '2025-11-08 15:00:00', 9, 'programado'),
(40, '2025-11-08 16:00:00', '2025-11-08 23:00:00', 10, 'programado'),
(40, '2025-11-09 10:00:00', '2025-11-09 17:00:00', 11, 'programado');

-- =====================================================
-- TARIFAS PARA BUSES
-- =====================================================

-- Crear tarifa de bus si no existe
INSERT INTO tarifa (codigoTarifa, nombreTarifa, idCabinaClase, equipaje_incl_kg, cambios, reembolsable, activo)
VALUES ('BUS_ECO', 'Bus Económico', 1, 23, 1, 0, 1)
ON DUPLICATE KEY UPDATE nombreTarifa = VALUES(nombreTarifa);

-- Asignar precios a buses
-- Rutas largas (Santiago - Temuco: 680km)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos)
SELECT v.idViaje, 5, 18000, 'CLP', 40
FROM viaje v
INNER JOIN ruta r ON v.idRuta = r.idRuta
INNER JOIN terminal tOrigen ON r.idTerminalOrigen = tOrigen.idTerminal
INNER JOIN terminal tDestino ON r.idTerminalDestino = tDestino.idTerminal
WHERE (tOrigen.codigo = 'SCL-BUS' AND tDestino.codigo = 'TMC-BUS')
   OR (tOrigen.codigo = 'TMC-BUS' AND tDestino.codigo = 'SCL-BUS');

-- Rutas medias (Santiago - La Serena: 470km)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos)
SELECT v.idViaje, 5, 12000, 'CLP', 42
FROM viaje v
INNER JOIN ruta r ON v.idRuta = r.idRuta
INNER JOIN terminal tOrigen ON r.idTerminalOrigen = tOrigen.idTerminal
INNER JOIN terminal tDestino ON r.idTerminalDestino = tDestino.idTerminal
WHERE (tOrigen.codigo = 'SCL-BUS' AND tDestino.codigo = 'LSC-BUS')
   OR (tOrigen.codigo = 'LSC-BUS' AND tDestino.codigo = 'SCL-BUS');

-- Rutas cortas (Santiago - Valparaíso: 120km)
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos)
SELECT v.idViaje, 5, 5000, 'CLP', 45
FROM viaje v
INNER JOIN ruta r ON v.idRuta = r.idRuta
INNER JOIN terminal tOrigen ON r.idTerminalOrigen = tOrigen.idTerminal
INNER JOIN terminal tDestino ON r.idTerminalDestino = tDestino.idTerminal
WHERE (tOrigen.codigo = 'SCL-BUS' AND tDestino.codigo = 'VLP-BUS')
   OR (tOrigen.codigo = 'VLP-BUS' AND tDestino.codigo = 'SCL-BUS');

-- =====================================================
-- PARTE 1: TERMINALES Y RUTAS DE BUS
-- Ejecutar después de tus scripts originales
-- =====================================================

USE Airlink;

-- =====================================================
-- 1. AGREGAR TERMINALES DE BUS FALTANTES
-- =====================================================

INSERT INTO terminal (nombreTerminal, codigo, ciudad, idTipoTerminal, activo) VALUES
('Terminal Coquimbo', 'COQ-BUS', 'Coquimbo', 3, 1),
('Terminal Iquique', 'IQQ-BUS', 'Iquique', 3, 1),
('Terminal Puerto Montt', 'PMC-BUS', 'Puerto Montt', 3, 1),
('Terminal Antofagasta', 'ANF-BUS', 'Antofagasta', 3, 1),
('Terminal Punta Arenas', 'PUQ-BUS', 'Punta Arenas', 3, 1),
('Terminal Viña del Mar', 'VDM-BUS', 'Viña del Mar', 3, 1),
('Terminal Rancagua', 'RAN-BUS', 'Rancagua', 3, 1),
('Terminal Talca', 'TAL-BUS', 'Talca', 3, 1),
('Terminal Chillán', 'CHI-BUS', 'Chillán', 3, 1),
('Terminal Los Ángeles', 'LOS-BUS', 'Los Ángeles', 3, 1),
('Terminal Osorno', 'OSO-BUS', 'Osorno', 3, 1),
('Terminal Valdivia', 'VAL-BUS', 'Valdivia', 3, 1),
('Terminal Castro', 'CAS-BUS', 'Castro', 3, 1),
('Terminal Calama', 'CAL-BUS', 'Calama', 3, 1),
('Terminal San Pedro de Atacama', 'SPA-BUS', 'San Pedro de Atacama', 3, 1),
('Terminal Ovalle', 'OVA-BUS', 'Ovalle', 3, 1),
('Terminal Copiapó', 'COP-BUS', 'Copiapó', 3, 1);

-- =====================================================
-- 2. CREAR RUTAS DE BUS
-- =====================================================

-- CONEXIÓN CLAVE: La Serena <-> Coquimbo
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'LSC-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'COQ-BUS'),
    15, 30, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'COQ-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'LSC-BUS'),
    15, 30, 1;

-- La Serena <-> Ovalle
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'LSC-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'OVA-BUS'),
    90, 90, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'OVA-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'LSC-BUS'),
    90, 90, 1;

-- Antofagasta <-> Calama
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'ANF-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'CAL-BUS'),
    215, 180, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'CAL-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'ANF-BUS'),
    215, 180, 1;

-- Calama <-> San Pedro de Atacama
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'CAL-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'SPA-BUS'),
    100, 90, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'SPA-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'CAL-BUS'),
    100, 90, 1;

-- Iquique <-> Antofagasta
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'IQQ-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'ANF-BUS'),
    560, 480, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'ANF-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'IQQ-BUS'),
    560, 480, 1;

-- Valparaíso <-> Viña del Mar
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'VLP-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'VDM-BUS'),
    10, 20, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'VDM-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'VLP-BUS'),
    10, 20, 1;

-- Santiago <-> Rancagua
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'SCL-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'RAN-BUS'),
    85, 75, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'RAN-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'SCL-BUS'),
    85, 75, 1;

-- Santiago <-> Talca
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'SCL-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'TAL-BUS'),
    255, 210, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'TAL-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'SCL-BUS'),
    255, 210, 1;

-- Talca <-> Chillán
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'TAL-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'CHI-BUS'),
    110, 90, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'CHI-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'TAL-BUS'),
    110, 90, 1;

-- Chillán <-> Los Ángeles
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'CHI-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'LOS-BUS'),
    95, 75, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'LOS-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'CHI-BUS'),
    95, 75, 1;

-- Los Ángeles <-> Concepción
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'LOS-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'CCP-BUS'),
    110, 90, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'CCP-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'LOS-BUS'),
    110, 90, 1;

-- Temuco <-> Valdivia
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'TMC-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'VAL-BUS'),
    180, 150, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'VAL-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'TMC-BUS'),
    180, 150, 1;

-- Valdivia <-> Osorno
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'VAL-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'OSO-BUS'),
    110, 90, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'OSO-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'VAL-BUS'),
    110, 90, 1;

-- Osorno <-> Puerto Montt
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'OSO-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'PMC-BUS'),
    110, 90, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'PMC-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'OSO-BUS'),
    110, 90, 1;

-- Puerto Montt <-> Castro
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'PMC-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'CAS-BUS'),
    120, 150, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'CAS-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'PMC-BUS'),
    120, 150, 1;

-- Puerto Montt <-> Punta Arenas
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'PMC-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'PUQ-BUS'),
    970, 960, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'PUQ-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'PMC-BUS'),
    970, 960, 1;

    -- =====================================================
-- PASO 1: AGREGAR TERMINALES LOCALES FALTANTES
-- =====================================================

USE Airlink;

INSERT INTO terminal (nombreTerminal, codigo, ciudad, idTipoTerminal, activo) VALUES
-- Región de Los Lagos (cerca de Puerto Montt)
('Terminal Frutillar', 'FRU-BUS', 'Frutillar', 3, 1),
('Terminal Puerto Varas', 'PVA-BUS', 'Puerto Varas', 3, 1),
('Terminal Ancud', 'ANC-BUS', 'Ancud', 3, 1),
('Terminal Quellón', 'QUE-BUS', 'Quellón', 3, 1),

-- Región de Iquique (cerca del aeropuerto)
('Terminal Alto Hospicio', 'AHO-BUS', 'Alto Hospicio', 3, 1),
('Terminal Pica', 'PIC-BUS', 'Pica', 3, 1),
('Terminal Huara', 'HUA-BUS', 'Huara', 3, 1),

-- Región de La Serena/Coquimbo (cerca del aeropuerto)
('Terminal Vicuña', 'VIC-BUS', 'Vicuña', 3, 1),
('Terminal Tongoy', 'TON-BUS', 'Tongoy', 3, 1),
('Terminal Andacollo', 'AND-BUS', 'Andacollo', 3, 1),

-- Región de Antofagasta
('Terminal Mejillones', 'MEJ-BUS', 'Mejillones', 3, 1),
('Terminal Tocopilla', 'TOC-BUS', 'Tocopilla', 3, 1),
('Terminal María Elena', 'MAR-BUS', 'María Elena', 3, 1),

-- Región de Cusco (Perú)
('Terminal Urubamba', 'URU-BUS', 'Urubamba', 3, 1),
('Terminal Ollantaytambo', 'OLL-BUS', 'Ollantaytambo', 3, 1),
('Terminal Pisac', 'PIS-BUS', 'Pisac', 3, 1),

-- Región de Buenos Aires
('Terminal Tigre', 'TIG-BUS', 'Tigre', 3, 1),
('Terminal San Isidro', 'SIS-BUS', 'San Isidro', 3, 1),
('Terminal La Plata', 'LPL-BUS', 'La Plata', 3, 1);

-- =====================================================
-- PASO 2: CREAR RUTAS DE BUS LOCALES (CONEXIONES)
-- =====================================================

-- Puerto Montt → Destinos cercanos
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'PMC-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'FRU-BUS'),
    45, 60, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'PMC-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'PVA-BUS'),
    20, 30, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'PMC-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'ANC-BUS'),
    90, 120, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'PMC-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'CAS-BUS'),
    90, 120, 1;

-- Puerto Varas → Frutillar
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'PVA-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'FRU-BUS'),
    30, 40, 1;

-- Iquique → Destinos cercanos
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'IQQ-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'AHO-BUS'),
    15, 25, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'IQQ-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'PIC-BUS'),
    115, 120, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'IQQ-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'HUA-BUS'),
    70, 90, 1;

-- Coquimbo/La Serena → Destinos cercanos
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'COQ-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'VIC-BUS'),
    60, 75, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'COQ-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'TON-BUS'),
    40, 50, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'LSC-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'VIC-BUS'),
    62, 75, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'LSC-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'AND-BUS'),
    55, 70, 1;

-- Antofagasta → Destinos cercanos
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'ANF-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'MEJ-BUS'),
    65, 75, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'ANF-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'TOC-BUS'),
    185, 180, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'ANF-BUS'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'MAR-BUS'),
    235, 210, 1;

-- Cusco → Valle Sagrado
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'CUZ'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'URU-BUS'),
    78, 90, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'CUZ'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'OLL-BUS'),
    90, 105, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'CUZ'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'PIS-BUS'),
    32, 45, 1;

-- Buenos Aires → Zona norte
INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'EZE'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'TIG-BUS'),
    45, 60, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'EZE'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'SIS-BUS'),
    35, 50, 1;

INSERT INTO ruta (idTerminalOrigen, idTerminalDestino, distanciaKm, duracionEstimadaMin, activo) 
SELECT 
    (SELECT idTerminal FROM terminal WHERE codigo = 'EZE'),
    (SELECT idTerminal FROM terminal WHERE codigo = 'LPL-BUS'),
    60, 75, 1;

-- =====================================================
-- PASO 3: CREAR VIAJES DE BUS PARA ESTAS RUTAS
-- =====================================================

-- Puerto Montt → Frutillar (IMPORTANTE: fechas alineadas con vuelos)
INSERT INTO viaje (idRuta, salida, llegada, idEquipo, estado)
SELECT 
    r.idRuta,
    '2025-11-06 11:00:00',
    '2025-11-06 12:00:00',
    8,
    'programado'
FROM ruta r
INNER JOIN terminal tOrigen ON r.idTerminalOrigen = tOrigen.idTerminal
INNER JOIN terminal tDestino ON r.idTerminalDestino = tDestino.idTerminal
WHERE tOrigen.codigo = 'PMC-BUS' AND tDestino.codigo = 'FRU-BUS';

INSERT INTO viaje (idRuta, salida, llegada, idEquipo, estado)
SELECT 
    r.idRuta,
    '2025-11-06 14:30:00',
    '2025-11-06 15:30:00',
    9,
    'programado'
FROM ruta r
INNER JOIN terminal tOrigen ON r.idTerminalOrigen = tOrigen.idTerminal
INNER JOIN terminal tDestino ON r.idTerminalDestino = tDestino.idTerminal
WHERE tOrigen.codigo = 'PMC-BUS' AND tDestino.codigo = 'FRU-BUS';

INSERT INTO viaje (idRuta, salida, llegada, idEquipo, estado)
SELECT 
    r.idRuta,
    '2025-11-06 17:00:00',
    '2025-11-06 18:00:00',
    10,
    'programado'
FROM ruta r
INNER JOIN terminal tOrigen ON r.idTerminalOrigen = tOrigen.idTerminal
INNER JOIN terminal tDestino ON r.idTerminalDestino = tDestino.idTerminal
WHERE tOrigen.codigo = 'PMC-BUS' AND tDestino.codigo = 'FRU-BUS';

-- Puerto Montt → Puerto Varas
INSERT INTO viaje (idRuta, salida, llegada, idEquipo, estado)
SELECT 
    r.idRuta,
    '2025-11-06 10:30:00',
    '2025-11-06 11:00:00',
    8,
    'programado'
FROM ruta r
INNER JOIN terminal tOrigen ON r.idTerminalOrigen = tOrigen.idTerminal
INNER JOIN terminal tDestino ON r.idTerminalDestino = tDestino.idTerminal
WHERE tOrigen.codigo = 'PMC-BUS' AND tDestino.codigo = 'PVA-BUS';

INSERT INTO viaje (idRuta, salida, llegada, idEquipo, estado)
SELECT 
    r.idRuta,
    '2025-11-06 13:00:00',
    '2025-11-06 13:30:00',
    9,
    'programado'
FROM ruta r
INNER JOIN terminal tOrigen ON r.idTerminalOrigen = tOrigen.idTerminal
INNER JOIN terminal tDestino ON r.idTerminalDestino = tDestino.idTerminal
WHERE tOrigen.codigo = 'PMC-BUS' AND tDestino.codigo = 'PVA-BUS';

INSERT INTO viaje (idRuta, salida, llegada, idEquipo, estado)
SELECT 
    r.idRuta,
    '2025-11-06 16:00:00',
    '2025-11-06 16:30:00',
    10,
    'programado'
FROM ruta r
INNER JOIN terminal tOrigen ON r.idTerminalOrigen = tOrigen.idTerminal
INNER JOIN terminal tDestino ON r.idTerminalDestino = tDestino.idTerminal
WHERE tOrigen.codigo = 'PMC-BUS' AND tDestino.codigo = 'PVA-BUS';

-- Iquique → Pica
INSERT INTO viaje (idRuta, salida, llegada, idEquipo, estado)
SELECT 
    r.idRuta,
    '2025-11-06 13:00:00',
    '2025-11-06 15:00:00',
    8,
    'programado'
FROM ruta r
INNER JOIN terminal tOrigen ON r.idTerminalOrigen = tOrigen.idTerminal
INNER JOIN terminal tDestino ON r.idTerminalDestino = tDestino.idTerminal
WHERE tOrigen.codigo = 'IQQ-BUS' AND tDestino.codigo = 'PIC-BUS';

-- Coquimbo → Vicuña
INSERT INTO viaje (idRuta, salida, llegada, idEquipo, estado)
SELECT 
    r.idRuta,
    '2025-11-08 09:30:00',
    '2025-11-08 10:45:00',
    9,
    'programado'
FROM ruta r
INNER JOIN terminal tOrigen ON r.idTerminalOrigen = tOrigen.idTerminal
INNER JOIN terminal tDestino ON r.idTerminalDestino = tDestino.idTerminal
WHERE tOrigen.codigo = 'COQ-BUS' AND tDestino.codigo = 'VIC-BUS';

-- Coquimbo → Tongoy
INSERT INTO viaje (idRuta, salida, llegada, idEquipo, estado)
SELECT 
    r.idRuta,
    '2025-11-08 10:00:00',
    '2025-11-08 10:50:00',
    10,
    'programado'
FROM ruta r
INNER JOIN terminal tOrigen ON r.idTerminalOrigen = tOrigen.idTerminal
INNER JOIN terminal tDestino ON r.idTerminalDestino = tDestino.idTerminal
WHERE tOrigen.codigo = 'COQ-BUS' AND tDestino.codigo = 'TON-BUS';

-- =====================================================
-- PASO 4: ASIGNAR TARIFAS A LOS NUEVOS BUSES
-- =====================================================

-- Obtener los IDs de los últimos viajes creados y asignarles tarifas
INSERT INTO viaje_tarifa (idViaje, idTarifa, precio, moneda, cupos)
SELECT 
    v.idViaje,
    5, -- Tarifa de bus económico
    CASE 
        WHEN r.distanciaKm < 30 THEN 3000
        WHEN r.distanciaKm < 60 THEN 5000
        WHEN r.distanciaKm < 100 THEN 8000
        ELSE 12000
    END,
    'CLP',
    CASE 
        WHEN e.nombreEmpresa = 'Turbus' THEN 45
        WHEN e.nombreEmpresa = 'Pullman Bus' THEN 42
        ELSE 40
    END
FROM viaje v
INNER JOIN ruta r ON v.idRuta = r.idRuta
INNER JOIN empresa_equipo eq ON v.idEquipo = eq.idEquipo
INNER JOIN empresa e ON eq.idEmpresa = e.idEmpresa
WHERE e.tipoEmpresa = 'bus'
  AND NOT EXISTS (
      SELECT 1 FROM viaje_tarifa vt WHERE vt.idViaje = v.idViaje
  );