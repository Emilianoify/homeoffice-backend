// Función auxiliar para validar formato de email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función auxiliar para validar fortaleza de contraseña
export const isValidPassword = (password: string): boolean => {
  // Mínimo 8 caracteres, al menos 1 mayúscula y 1 número
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

// Función auxiliar para validar username
export const isValidUsername = (username: string): boolean => {
  // Solo letras, números y guiones bajos, 3-50 caracteres
  const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
  return usernameRegex.test(username);
};
