export interface MathExercise {
  question: string;
  answer: number;
  operand1: number;
  operand2: number;
  operator: "+" | "-";
}

// Pool de ejercicios para evitar repeticiones inmediatas
let exercisePool: MathExercise[] = [];
let usedExercises: MathExercise[] = [];

/**
 * Genera un ejercicio matemático simple
 * Solo sumas y restas de un dígito con resultados positivos
 */
export function generateMathExercise(): MathExercise {
  // Si el pool está vacío o casi vacío, regenerar
  if (exercisePool.length < 5) {
    regenerateExercisePool();
  }

  // Tomar ejercicio aleatorio del pool
  const randomIndex = Math.floor(Math.random() * exercisePool.length);
  const exercise = exercisePool[randomIndex];

  // Mover a usados y remover del pool
  exercisePool.splice(randomIndex, 1);
  usedExercises.push(exercise);

  // Si hay demasiados usados, limpiar algunos
  if (usedExercises.length > 50) {
    usedExercises = usedExercises.slice(-25); // Mantener solo los últimos 25
  }

  return exercise;
}

/**
 * Regenera el pool de ejercicios evitando repeticiones recientes
 */
function regenerateExercisePool(): void {
  const newPool: MathExercise[] = [];

  // Generar todas las combinaciones posibles
  for (let i = 1; i <= 9; i++) {
    for (let j = 1; j <= 9; j++) {
      // Sumas
      if (i + j <= 18) {
        // Resultado máximo 18
        newPool.push({
          question: `${i} + ${j}`,
          answer: i + j,
          operand1: i,
          operand2: j,
          operator: "+",
        });
      }

      // Restas (solo resultados positivos)
      if (i >= j) {
        newPool.push({
          question: `${i} - ${j}`,
          answer: i - j,
          operand1: i,
          operand2: j,
          operator: "-",
        });
      }
    }
  }

  // Filtrar ejercicios usados recientemente (últimos 10)
  const recentlyUsed = usedExercises.slice(-10);
  exercisePool = newPool.filter(
    (exercise) =>
      !recentlyUsed.some((used) => used.question === exercise.question),
  );

  // Si el filtrado dejó muy pocos ejercicios, usar todos
  if (exercisePool.length < 20) {
    exercisePool = newPool;
  }
}

/**
 * Valida si una respuesta es correcta
 */
export function validateAnswer(
  exercise: MathExercise,
  userAnswer: number,
): boolean {
  return exercise.answer === userAnswer;
}

/**
 * Obtiene estadísticas del pool (para debugging)
 */
export function getExercisePoolStats() {
  return {
    poolSize: exercisePool.length,
    usedCount: usedExercises.length,
    totalPossible: 162, // Aproximadamente
  };
}

// Inicializar el pool al arrancar
regenerateExercisePool();
