export const validateRUT = (rut) => {
  const errors = [];
  const trimmed = rut.trim().replace(/\./g, "");

  if (!trimmed) {
    errors.push("El RUT es obligatorio");
    return { isValid: false, errors, sanitized: "" };
  }

  // Formato básico: 12345678-9
  const rutRegex = /^[0-9]+-[0-9kK]$/;
  if (!rutRegex.test(trimmed)) {
    errors.push("Formato de RUT inválido (ej: 12345678-9)");
    return { isValid: false, errors, sanitized: trimmed };
  }

  // Validar dígito verificador
  const [numero, dv] = trimmed.split("-");
  let suma = 0;
  let multiplicador = 2;

  for (let i = numero.length - 1; i >= 0; i--) {
    suma += parseInt(numero[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const dvCalculado = 11 - (suma % 11);
  const dvEsperado =
    dvCalculado === 11 ? "0" : dvCalculado === 10 ? "k" : String(dvCalculado);

  if (dv.toLowerCase() !== dvEsperado) {
    errors.push("El dígito verificador no es válido");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmed,
  };
};

// Validar DNI/Pasaporte genérico
export const validateDocumento = (documento, tipo = "DNI") => {
  const errors = [];
  const trimmed = documento.trim();

  if (!trimmed) {
    errors.push(`El ${tipo} es obligatorio`);
    return { isValid: false, errors, sanitized: "" };
  }

  if (tipo === "RUT") {
    return validateRUT(trimmed);
  }

  if (tipo === "DNI") {
    // DNI: 7-8 dígitos
    if (!/^[0-9]{7,8}$/.test(trimmed)) {
      errors.push("El DNI debe tener 7-8 dígitos");
    }
  }

  if (tipo === "Pasaporte") {
    // Pasaporte: alfanumérico, 6-12 caracteres
    if (!/^[A-Z0-9]{6,12}$/i.test(trimmed)) {
      errors.push("Pasaporte debe tener 6-12 caracteres alfanuméricos");
    }
  }

  if (trimmed.length > 20) {
    errors.push("Documento demasiado largo");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmed.toUpperCase(),
  };
};

// Validar teléfono chileno
export const validateTelefono = (telefono) => {
  const errors = [];
  const trimmed = telefono.trim().replace(/\s+/g, "");

  if (!trimmed) {
    errors.push("El teléfono es obligatorio");
    return { isValid: false, errors, sanitized: "" };
  }

  // Formatos válidos: +56912345678, 912345678, 221234567
  const telefonoRegex = /^(\+?56)?[2-9][0-9]{7,8}$/;
  if (!telefonoRegex.test(trimmed)) {
    errors.push("Formato de teléfono inválido (ej: +56912345678 o 912345678)");
  }

  if (trimmed.length > 15) {
    errors.push("Teléfono demasiado largo");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmed,
  };
};

export const validateFechaNacimiento = (fecha) => {
  const errors = [];

  if (!fecha) {
    errors.push("La fecha de nacimiento es obligatoria");
    return { isValid: false, errors, sanitized: "" };
  }

  const fechaNac = new Date(fecha + "T00:00:00");
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Resetear horas para comparar solo la fecha

  // Verificar que la fecha sea válida
  if (isNaN(fechaNac.getTime())) {
    errors.push("Fecha no válida");
    return { isValid: false, errors, sanitized: fecha };
  }

  // No puede ser fecha futura o de hoy
  if (fechaNac >= hoy) {
    errors.push("La fecha de nacimiento debe ser anterior a hoy");
  }

  // Calcular edad real considerando mes y día
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const mesActual = hoy.getMonth();
  const mesNacimiento = fechaNac.getMonth();

  if (
    mesActual < mesNacimiento ||
    (mesActual === mesNacimiento && hoy.getDate() < fechaNac.getDate())
  ) {
    edad--;
  }

  // Los bebés deben tener al menos 7 días para viajar (política común de aerolíneas)
  const diasDesdeNacimiento = Math.floor(
    (hoy - fechaNac) / (1000 * 60 * 60 * 24)
  );

  if (diasDesdeNacimiento < 10) {
    errors.push("El pasajero debe tener al menos 10 días de nacido");
  }

  // Edad máxima razonable: 120 años
  if (edad > 120) {
    errors.push("Por favor verifica la fecha de nacimiento");
  }

  // Advertencia para menores de edad (opcional, solo informativa)
  if (edad < 18 && errors.length === 0) {
    // Puedes agregar una advertencia aquí si lo necesitas
    // errors.push("Los menores de 18 años deben viajar con un adulto");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: fecha,
    metadata: { edad, diasDesdeNacimiento },
  };
};

// Validar género
export const validateGenero = (genero) => {
  const errors = [];
  const generosValidos = ["Masculino", "Femenino", "Otro"];

  if (!genero) {
    errors.push("El género es obligatorio");
    return { isValid: false, errors, sanitized: "" };
  }

  if (!generosValidos.includes(genero)) {
    errors.push("Selecciona un género válido");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: genero,
  };
};

// Validar nombre de pasajero (más estricto que nombre general)
export const validateNombrePasajero = (nombre) => {
  const errors = [];
  const trimmed = nombre.trim();

  if (!trimmed) {
    errors.push("El nombre es obligatorio");
    return { isValid: false, errors, sanitized: "" };
  }

  // Solo letras, espacios, acentos y apóstrofes
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/;
  if (!nameRegex.test(trimmed)) {
    errors.push("El nombre solo puede contener letras");
  }

  if (trimmed.length < 2) {
    errors.push("El nombre debe tener al menos 2 caracteres");
  }

  if (trimmed.length > 50) {
    errors.push("El nombre no puede exceder 50 caracteres");
  }

  // No debe tener números
  if (/[0-9]/.test(trimmed)) {
    errors.push("El nombre no puede contener números");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmed,
  };
};

// Validar apellido
export const validateApellido = (apellido) => {
  return validateNombrePasajero(apellido);
};
