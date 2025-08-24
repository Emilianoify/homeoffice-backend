import { DailyReport, UserSession, PopupResponse, Task } from "../models";
import { TaskStatus } from "../utils/enums/TaskStatus";
import { PopupResult } from "../utils/enums/PopupResult";
import { IDailyReport } from "../interfaces/dailyreport.interface";

interface ProductivityMetrics {
  totalMinutesWorked: number;
  totalMinutesInSession: number;
  totalPopupsReceived: number;
  totalPopupsAnswered: number;
  correctAnswersCount: number;
  popupAccuracy: number;
  averageResponseTime: number;
  totalTasksAssigned: number;
  totalTasksCompleted: number;
  taskCompletionRate: number;
  productivityScore: number;
  stateBreakdown: Record<string, number>;
  qualifiesForFlexFriday: boolean;
  weeklyProductivityAverage: number;
}

export class ProductivityCalculator {
  /**
   * Calcula métricas de productividad para un usuario en una fecha específica
   */
  async calculateDailyProductivity(
    userId: string,
    date: Date,
  ): Promise<ProductivityMetrics> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Obtener sesiones del día
    const sessions = (await UserSession.findAll({
      where: {
        userId,
        sessionStart: {
          $between: [startOfDay, endOfDay],
        },
      },
    })) as any[];

    // 2. Calcular métricas de tiempo
    const timeMetrics = this.calculateTimeMetrics(sessions);

    // 3. Calcular métricas de pop-ups
    const popupMetrics = await this.calculatePopupMetrics(
      userId,
      startOfDay,
      endOfDay,
    );

    // 4. Calcular métricas de tareas
    const taskMetrics = await this.calculateTaskMetrics(
      userId,
      startOfDay,
      endOfDay,
    );

    // 5. Calcular score de productividad
    const productivityScore = this.calculateProductivityScore(
      timeMetrics,
      popupMetrics,
      taskMetrics,
    );

    // 6. Calcular promedio semanal y elegibilidad viernes flex
    const weeklyAverage = await this.calculateWeeklyAverage(userId, date);
    const qualifiesForFlexFriday = weeklyAverage >= 85; // 85% threshold

    return {
      ...timeMetrics,
      ...popupMetrics,
      ...taskMetrics,
      productivityScore,
      weeklyProductivityAverage: weeklyAverage,
      qualifiesForFlexFriday,
    };
  }

  /**
   * Calcula métricas de tiempo trabajado
   */
  private calculateTimeMetrics(sessions: any[]): {
    totalMinutesWorked: number;
    totalMinutesInSession: number;
    stateBreakdown: Record<string, number>;
  } {
    let totalMinutesWorked = 0;
    let totalMinutesInSession = 0;
    const stateBreakdown: Record<string, number> = {
      activo: 0,
      baño: 0,
      ausente: 0,
      almuerzo: 0,
      desconectado: 0,
      licencia: 0,
    };

    for (const session of sessions) {
      // Sumar tiempo trabajado (solo estados productivos)
      totalMinutesWorked += session.totalMinutesWorked || 0;

      // Sumar tiempo total en sesión
      if (session.sessionStart && session.sessionEnd) {
        const sessionDuration = Math.round(
          (new Date(session.sessionEnd).getTime() -
            new Date(session.sessionStart).getTime()) /
            (1000 * 60),
        );
        totalMinutesInSession += sessionDuration;
      }

      // Agregar breakdown de estados
      const breakdown = session.stateTimeBreakdown || {};
      for (const [state, minutes] of Object.entries(breakdown)) {
        stateBreakdown[state] =
          (stateBreakdown[state] || 0) + (minutes as number);
      }
    }

    return {
      totalMinutesWorked,
      totalMinutesInSession,
      stateBreakdown,
    };
  }

  /**
   * Calcula métricas de pop-ups
   */
  private async calculatePopupMetrics(
    userId: string,
    startOfDay: Date,
    endOfDay: Date,
  ): Promise<{
    totalPopupsReceived: number;
    totalPopupsAnswered: number;
    correctAnswersCount: number;
    popupAccuracy: number;
    averageResponseTime: number;
  }> {
    const popups = (await PopupResponse.findAll({
      where: {
        userId,
        popupTime: {
          $between: [startOfDay, endOfDay],
        },
      },
    })) as any[];

    const totalPopupsReceived = popups.length;
    const answeredPopups = popups.filter((p) => p.wasAnswered);
    const correctPopups = popups.filter(
      (p) => p.result === PopupResult.CORRECT,
    );

    const totalPopupsAnswered = answeredPopups.length;
    const correctAnswersCount = correctPopups.length;

    const popupAccuracy =
      totalPopupsAnswered > 0
        ? Math.round((correctAnswersCount / totalPopupsAnswered) * 100)
        : 0;

    const averageResponseTime =
      answeredPopups.length > 0
        ? Math.round(
            answeredPopups.reduce((sum, p) => sum + (p.responseTime || 0), 0) /
              answeredPopups.length,
          )
        : 0;

    return {
      totalPopupsReceived,
      totalPopupsAnswered,
      correctAnswersCount,
      popupAccuracy,
      averageResponseTime,
    };
  }

  /**
   * Calcula métricas de tareas
   */
  private async calculateTaskMetrics(
    userId: string,
    startOfDay: Date,
    endOfDay: Date,
  ): Promise<{
    totalTasksAssigned: number;
    totalTasksCompleted: number;
    taskCompletionRate: number;
  }> {
    // Tareas asignadas en el día
    const assignedTasks = await Task.findAll({
      where: {
        assignedTo: userId,
        createdAt: {
          $between: [startOfDay, endOfDay],
        },
      },
    });

    // Tareas completadas en el día
    const completedTasks = await Task.findAll({
      where: {
        assignedTo: userId,
        completedAt: {
          $between: [startOfDay, endOfDay],
        },
        status: TaskStatus.COMPLETADA,
      },
    });

    const totalTasksAssigned = assignedTasks.length;
    const totalTasksCompleted = completedTasks.length;

    const taskCompletionRate =
      totalTasksAssigned > 0
        ? Math.round((totalTasksCompleted / totalTasksAssigned) * 100)
        : 0;

    return {
      totalTasksAssigned,
      totalTasksCompleted,
      taskCompletionRate,
    };
  }

  /**
   * Calcula el score final de productividad (0-100)
   */
  private calculateProductivityScore(
    timeMetrics: any,
    popupMetrics: any,
    taskMetrics: any,
  ): number {
    // Componentes del score con sus pesos
    const components = {
      timeEfficiency: 0, // 40% del score
      popupPerformance: 0, // 30% del score
      taskCompletion: 0, // 30% del score
    };

    // 1. Eficiencia de tiempo (40%)
    // Basado en ratio tiempo trabajado vs tiempo en sesión
    if (timeMetrics.totalMinutesInSession > 0) {
      const timeRatio =
        timeMetrics.totalMinutesWorked / timeMetrics.totalMinutesInSession;
      components.timeEfficiency = Math.min(100, timeRatio * 100) * 0.4;
    }

    // 2. Performance en pop-ups (30%)
    if (popupMetrics.totalPopupsReceived > 0) {
      const popupScore =
        popupMetrics.popupAccuracy * 0.7 + // 70% precisión
        Math.max(0, 100 - popupMetrics.averageResponseTime) * 0.3; // 30% velocidad
      components.popupPerformance = popupScore * 0.3;
    }

    // 3. Completación de tareas (30%)
    if (taskMetrics.totalTasksAssigned > 0) {
      components.taskCompletion = taskMetrics.taskCompletionRate * 0.3;
    } else {
      // Si no hay tareas, dar puntuación neutral
      components.taskCompletion = 70 * 0.3; // 70% neutral
    }

    const finalScore = Math.round(
      components.timeEfficiency +
        components.popupPerformance +
        components.taskCompletion,
    );

    return Math.max(0, Math.min(100, finalScore));
  }

  /**
   * Calcula promedio de productividad semanal
   */
  private async calculateWeeklyAverage(
    userId: string,
    date: Date,
  ): Promise<number> {
    // Obtener inicio de la semana (lunes)
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay() || 7; // Domingo = 7
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    // Obtener fin de la semana (viernes)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 4); // +4 días = viernes
    endOfWeek.setHours(23, 59, 59, 999);

    const weeklyReports = (await DailyReport.findAll({
      where: {
        userId,
        reportDate: {
          $between: [startOfWeek, endOfWeek],
        },
      },
    })) as any[];

    if (weeklyReports.length === 0) return 0;

    const averageScore =
      weeklyReports.reduce((sum, report) => {
        return sum + (report.productivityScore || 0);
      }, 0) / weeklyReports.length;

    return Math.round(averageScore * 100) / 100; // 2 decimales
  }

  /**
   * Genera o actualiza el reporte diario para un usuario
   */
  async generateDailyReport(userId: string, date: Date): Promise<any> {
    console.log(
      `📊 Generando reporte diario para usuario ${userId} - ${date.toDateString()}`,
    );

    try {
      // Calcular métricas
      const metrics = await this.calculateDailyProductivity(userId, date);

      // Buscar reporte existente
      const dateOnly = date.toISOString().split("T")[0];

      let report = (await DailyReport.findOne({
        where: {
          userId,
          reportDate: dateOnly,
        },
      })) as IDailyReport | null;

      const reportData = {
        userId,
        reportDate: dateOnly,
        totalMinutesWorked: metrics.totalMinutesWorked,
        totalMinutesInSession: metrics.totalMinutesInSession,
        totalPopupsReceived: metrics.totalPopupsReceived,
        totalPopupsAnswered: metrics.totalPopupsAnswered,
        correctAnswersCount: metrics.correctAnswersCount,
        popupAccuracy: metrics.popupAccuracy,
        averageResponseTime: metrics.averageResponseTime,
        totalTasksAssigned: metrics.totalTasksAssigned,
        totalTasksCompleted: metrics.totalTasksCompleted,
        taskCompletionRate: metrics.taskCompletionRate,
        productivityScore: metrics.productivityScore,
        stateBreakdown: metrics.stateBreakdown,
        qualifiesForFlexFriday: metrics.qualifiesForFlexFriday,
        weeklyProductivityAverage: metrics.weeklyProductivityAverage,
      };

      if (report && report.id) {
        await DailyReport.update(reportData, {
          where: { id: report.id },
        });
        report = (await DailyReport.findByPk(
          report.id,
        )) as unknown as IDailyReport;
      } else {
        report = (await DailyReport.create(
          reportData,
        )) as unknown as IDailyReport;
      }

      console.log(`✅ Reporte generado - Score: ${metrics.productivityScore}%`);
      return report;
    } catch (error) {
      console.error(
        `❌ Error generando reporte para usuario ${userId}:`,
        error,
      );
      throw error;
    }
  }
}

export const productivityCalculator = new ProductivityCalculator();
