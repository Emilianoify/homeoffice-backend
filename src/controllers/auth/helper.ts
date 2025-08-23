// Función auxiliar para generar token de recuperación de 6 dígitos
export const generateRecoveryToken = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Función auxiliar para generar fecha de expiración (30 minutos)
export const generateTokenExpiration = (): Date => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30); // 30 minutos desde ahora
  return now;
};
