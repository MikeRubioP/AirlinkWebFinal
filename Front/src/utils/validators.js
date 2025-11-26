export const validateUsername = (username) => {
  const errors = [];

  const trimmed = username.trim();

  if (!trimmed) {
    errors.push("El nombre de usuario es obligatorio");
    return { isValid: false, errors, sanitized: "" };
  }

  if (trimmed.length < 3) {
    errors.push("El nombre debe tener al menos 3 caracteres");
  }

  if (trimmed.length > 30) {
    errors.push("El nombre no puede exceder 30 caracteres");
  }

  // Solo letras, números, guión bajo y guión medio
  const usernameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9_-]+$/;
  if (!usernameRegex.test(trimmed)) {
    errors.push(
      "El nombre solo puede contener letras, números, guión (-) y guión bajo (_)"
    );
  }

  // No debe empezar con números o caracteres especiales
  if (/^[0-9_-]/.test(trimmed)) {
    errors.push("El nombre debe comenzar con una letra");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmed,
  };
};

// Validar email
export const validateEmail = (email) => {
  const errors = [];
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    errors.push("El email es obligatorio");
    return { isValid: false, errors, sanitized: "" };
  }

  // Regex mejorado para email
  const emailRegex = /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  if (!emailRegex.test(trimmed)) {
    errors.push("Formato de email inválido");
  }

  // Verificar dominios sospechosos o temporales (opcional)
  const suspiciousDomains = [
    "tempmail.com",
    "throwaway.email",
    "10minutemail.com",
  ];
  const domain = trimmed.split("@")[1];
  if (suspiciousDomains.includes(domain)) {
    errors.push("No se permiten emails temporales");
  }

  if (trimmed.length > 100) {
    errors.push("El email es demasiado largo");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmed,
  };
};

// Validar contraseña
export const validatePassword = (password) => {
  const errors = [];

  if (!password) {
    errors.push("La contraseña es obligatoria");
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres");
  }

  if (password.length > 128) {
    errors.push("La contraseña es demasiado larga");
  }

  // Al menos una mayúscula
  if (!/[A-Z]/.test(password)) {
    errors.push("Debe contener al menos una letra mayúscula");
  }

  // Al menos una minúscula
  if (!/[a-z]/.test(password)) {
    errors.push("Debe contener al menos una letra minúscula");
  }

  // Al menos un número
  if (!/[0-9]/.test(password)) {
    errors.push("Debe contener al menos un número");
  }

  // Al menos un carácter especial (opcional pero recomendado)
  if (!/[!@#$%^&*(),.?":{}|<>_-]/.test(password)) {
    errors.push("Debe contener al menos un carácter especial (!@#$%^&*...)");
  }

  // No debe contener espacios
  if (/\s/.test(password)) {
    errors.push("La contraseña no puede contener espacios");
  }

  // Verificar contraseñas comunes
  const commonPasswords = [
    "password",
    "12345678",
    "qwerty123",
    "abc123456",
    "password1",
    "123456789",
    "password123",
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("La contraseña es demasiado común");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Comparar contraseñas
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { isValid: false, errors: ["Debes confirmar tu contraseña"] };
  }

  if (password !== confirmPassword) {
    return { isValid: false, errors: ["Las contraseñas no coinciden"] };
  }

  return { isValid: true, errors: [] };
};

// Sanitizar input general (eliminar caracteres peligrosos)
export const sanitizeInput = (input) => {
  if (!input) return "";

  return (
    input
      .trim()
      // Eliminar caracteres de control
      .replace(/[\x00-\x1F\x7F]/g, "")
      // Eliminar múltiples espacios
      .replace(/\s+/g, " ")
  );
};

// Validar nombre completo (para pasajeros)
export const validateFullName = (name) => {
  const errors = [];
  const trimmed = name.trim();

  if (!trimmed) {
    errors.push("El nombre es obligatorio");
    return { isValid: false, errors, sanitized: "" };
  }

  // Solo letras, espacios y acentos
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  if (!nameRegex.test(trimmed)) {
    errors.push("El nombre solo puede contener letras y espacios");
  }

  if (trimmed.length < 2) {
    errors.push("El nombre debe tener al menos 2 caracteres");
  }

  if (trimmed.length > 50) {
    errors.push("El nombre no puede exceder 50 caracteres");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmed,
  };
};

// Calcular fortaleza de contraseña
export const getPasswordStrength = (password) => {
  if (!password)
    return { strength: 0, label: "Muy débil", color: "bg-red-500" };

  let strength = 0;

  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[!@#$%^&*(),.?":{}|<>_-]/.test(password)) strength += 1;

  const labels = {
    0: { label: "Muy débil", color: "bg-red-500" },
    1: { label: "Muy débil", color: "bg-red-500" },
    2: { label: "Débil", color: "bg-orange-500" },
    3: { label: "Regular", color: "bg-yellow-500" },
    4: { label: "Buena", color: "bg-blue-500" },
    5: { label: "Fuerte", color: "bg-green-500" },
    6: { label: "Muy fuerte", color: "bg-green-600" },
  };

  return { strength, ...labels[strength] };
};
