export function generateRecommendations(weekStats: any): string[] {
  const recommendations: string[] = [];

  if (weekStats.averageProductivity < 60) {
    recommendations.push("Concentra en mejorar tu tiempo activo en el sistema");
    recommendations.push(
      "Responde más rápido y con precisión a los pop-ups matemáticos",
    );
  } else if (weekStats.averageProductivity < 85) {
    recommendations.push(
      "Estás cerca del objetivo. Mantén el tiempo activo consistente",
    );
    recommendations.push(
      "Completa todas las tareas asignadas para mejorar tu score",
    );
  } else {
    recommendations.push(
      "¡Excelente trabajo! Mantén este nivel de productividad",
    );
    recommendations.push(
      "Calificas para viernes flex - puedes salir 2 horas antes",
    );
  }

  if (weekStats.missingDays.length > 0) {
    recommendations.push(
      `Asegúrate de trabajar los días faltantes: ${weekStats.missingDays.join(", ")}`,
    );
  }

  return recommendations;
}
