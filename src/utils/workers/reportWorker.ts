// src/utils/workers/reportWorker.ts
import cron from "node-cron";
import { User, UserSession } from "../../models";
import { productivityCalculator } from "../../services/productivityCalculator";

class ReportWorker {
  private isRunning = false;

  /**
   * Inicializar el worker de reportes
   * - Ejecutar cada día a las 23:55 (generar reportes del día)
   * - Ejecutar al iniciar servidor (procesar días faltantes)
   */
  start() {
    console.log("📊 ReportWorker iniciado");

    // Ejecutar diariamente a las 23:55
    cron.schedule("55 23 * * *", () => {
      const today = new Date();
      this.generateDailyReports(today);
    });

    // Ejecutar al inicio para procesar días faltantes
    setTimeout(() => {
      this.processMissingReports();
    }, 5000); // 5 segundos después del inicio
  }

  /**
   * Generar reportes diarios para todos los usuarios activos
   */
  async generateDailyReports(date: Date = new Date()) {
    if (this.isRunning) {
      console.log("⚠️ ReportWorker ya está ejecutándose, omitiendo...");
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      const dateStr = date.toDateString();
      console.log(`📊 ReportWorker: Generando reportes para ${dateStr}`);

      // Obtener usuarios que tuvieron actividad en la fecha
      const usersWithActivity = await this.getUsersWithActivity(date);

      let processedUsers = 0;
      let errorsCount = 0;

      for (const userId of usersWithActivity) {
        try {
          await productivityCalculator.generateDailyReport(userId, date);
          processedUsers++;
        } catch (error) {
          console.error(`❌ Error procesando usuario ${userId}:`, error);
          errorsCount++;
        }

        // Pequeña pausa para no sobrecargar la DB
        await this.sleep(100);
      }

      const duration = Date.now() - startTime;
      console.log(
        `✅ ReportWorker completado para ${dateStr} en ${duration}ms:`,
      );
      console.log(`   - Usuarios procesados: ${processedUsers}`);
      console.log(`   - Errores: ${errorsCount}`);
    } catch (error) {
      console.error("❌ Error general en ReportWorker:", error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Procesar reportes faltantes de los últimos días
   */
  async processMissingReports() {
    console.log("🔍 Verificando reportes faltantes...");

    const today = new Date();
    const daysToCheck = 7; // Revisar últimos 7 días

    for (let i = 1; i <= daysToCheck; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);

      // Solo procesar días laborables (lunes a viernes)
      const dayOfWeek = checkDate.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const usersWithActivity = await this.getUsersWithActivity(checkDate);

        if (usersWithActivity.length > 0) {
          console.log(
            `📅 Procesando reportes faltantes para ${checkDate.toDateString()}`,
          );
          await this.generateDailyReports(checkDate);
        }
      }
    }
  }

  /**
   * Obtener usuarios que tuvieron actividad en una fecha específica
   */
  private async getUsersWithActivity(date: Date): Promise<string[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Buscar sesiones activas en el día
    const sessions = (await UserSession.findAll({
      where: {
        sessionStart: {
          $between: [startOfDay, endOfDay],
        },
      },
      include: [
        {
          model: User,
          as: "user",
          where: { isActive: true },
          attributes: ["id"],
        },
      ],
      attributes: ["userId"],
      group: ["userId", "user.id"], // Evitar duplicados
    })) as any[];

    return sessions.map((s) => s.userId);
  }

  /**
   * Generar reporte manual para un usuario específico
   */
  async generateManualReport(userId: string, date: Date = new Date()) {
    console.log(`📊 Generando reporte manual para usuario ${userId}`);

    try {
      const report = await productivityCalculator.generateDailyReport(
        userId,
        date,
      );
      return report;
    } catch (error) {
      console.error(
        `❌ Error en reporte manual para usuario ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Recalcular todos los reportes de un usuario (útil para correcciones)
   */
  async recalculateUserReports(userId: string, daysBack: number = 30) {
    console.log(
      `🔄 Recalculando reportes para usuario ${userId} (${daysBack} días)`,
    );

    const today = new Date();
    let processedDays = 0;

    for (let i = 0; i < daysBack; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - i);

      // Solo días laborables
      const dayOfWeek = targetDate.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        try {
          await productivityCalculator.generateDailyReport(userId, targetDate);
          processedDays++;
          await this.sleep(200); // Pausa más larga para recálculo
        } catch (error) {
          console.error(
            `❌ Error recalculando ${targetDate.toDateString()}:`,
            error,
          );
        }
      }
    }

    console.log(`✅ Recálculo completado: ${processedDays} días procesados`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const reportWorker = new ReportWorker();
