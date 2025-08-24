// src/utils/workers/stateWorker.ts
import cron from "node-cron";
import { User, UserSession, UserStateModel } from "../../models";
import { STATE_TRANSITION_RULES } from "../constants/stateTimeouts";
import { StateChangedBy } from "../enums/StateChangedBy";
import { UserState } from "../enums/UserState";
import { Op } from "sequelize";

class StateWorker {
  private isRunning = false;

  // Ejecutar cada 2 minutos
  start() {
    console.log("🤖 StateWorker iniciado - verificando cada 2 minutos");

    cron.schedule("*/2 * * * *", () => {
      if (!this.isRunning) {
        this.processStateTimeouts();
      }
    });
  }

  private async processStateTimeouts() {
    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log("🔍 StateWorker: Verificando timeouts de estado...");

      // Obtener todas las sesiones activas con estados pendientes
      const activeSessions = (await UserSession.findAll({
        where: { isActive: true },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "username", "currentState"],
            where: { isActive: true },
          },
          {
            model: UserStateModel,
            as: "stateChanges",
            where: { stateEnd: null },
            required: false,
            limit: 1,
            order: [["stateStart", "DESC"]],
          },
        ],
      })) as any[];

      let processedSessions = 0;
      let timeoutActions = 0;

      for (const session of activeSessions) {
        const currentStateRecord = session.stateChanges?.[0];
        if (!currentStateRecord) continue;

        const result = await this.checkStateTimeout(
          session,
          currentStateRecord,
        );
        if (result.actionTaken) {
          timeoutActions++;
        }
        processedSessions++;
      }

      const duration = Date.now() - startTime;
      console.log(`✅ StateWorker completado en ${duration}ms:`);
      console.log(`   - Sesiones procesadas: ${processedSessions}`);
      console.log(`   - Acciones automáticas: ${timeoutActions}`);
    } catch (error) {
      console.error("❌ Error en StateWorker:", error);
    } finally {
      this.isRunning = false;
    }
  }

  private async checkStateTimeout(
    session: any,
    currentStateRecord: any,
  ): Promise<{ actionTaken: boolean; reason?: string }> {
    const now = new Date();
    const stateStart = new Date(currentStateRecord.stateStart);
    const minutesInState = Math.floor(
      (now.getTime() - stateStart.getTime()) / (1000 * 60),
    );
    const currentState = currentStateRecord.state as UserState;

    // Buscar regla de transición para este estado
    const rule = STATE_TRANSITION_RULES.find(
      (r) => r.fromState === currentState,
    );
    if (!rule) {
      return { actionTaken: false };
    }

    // ¿Se excedió el timeout?
    if (minutesInState >= rule.timeoutMinutes) {
      console.log(`⚠️ Timeout detectado:`);
      console.log(`   Usuario: ${session.user.username}`);
      console.log(`   Estado: ${currentState} por ${minutesInState} minutos`);
      console.log(`   Límite: ${rule.timeoutMinutes} minutos`);
      console.log(`   Transición: ${currentState} → ${rule.toState}`);

      await this.executeStateTransition(
        session,
        currentStateRecord,
        rule,
        minutesInState,
      );
      return { actionTaken: true, reason: "timeout_exceeded" };
    }

    // ¿Necesita advertencia?
    if (rule.warningMinutes && minutesInState >= rule.warningMinutes) {
      // TODO: Enviar advertencia al frontend (WebSocket)
      console.log(`⚠️ Advertencia de timeout:`);
      console.log(`   Usuario: ${session.user.username}`);
      console.log(`   Estado: ${currentState} por ${minutesInState} minutos`);
      console.log(`   Advertencia en: ${rule.warningMinutes} minutos`);
      console.log(
        `   Timeout en: ${rule.timeoutMinutes - minutesInState} minutos`,
      );
    }

    return { actionTaken: false };
  }

  private async executeStateTransition(
    session: any,
    currentStateRecord: any,
    rule: any,
    actualMinutes: number,
  ) {
    const now = new Date();
    const userId = session.user.id;

    try {
      // 1. Cerrar estado actual
      await UserStateModel.update(
        {
          stateEnd: now,
          durationMinutes: actualMinutes,
        },
        {
          where: { id: currentStateRecord.id },
        },
      );

      // 2. Actualizar breakdown de la sesión
      const currentBreakdown = session.stateTimeBreakdown || {};
      currentBreakdown[currentStateRecord.state] =
        (currentBreakdown[currentStateRecord.state] || 0) + actualMinutes;

      // 3. Si transición a DESCONECTADO, cerrar sesión completa
      if (rule.toState === UserState.DESCONECTADO) {
        await this.closeSessionDueToInactivity(
          session,
          currentBreakdown,
          rule.reason,
        );
      } else {
        // 4. Crear nuevo estado
        await UserStateModel.create({
          userId,
          sessionId: session.id,
          state: rule.toState,
          stateStart: now,
          changedBy: StateChangedBy.SYSTEM,
          reason: rule.reason,
          ipAddress: null, // Sistema automático
          userAgent: "StateWorker/1.0",
        });

        // 5. Actualizar usuario y sesión
        await Promise.all([
          User.update(
            { currentState: rule.toState },
            { where: { id: userId } },
          ),
          UserSession.update(
            {
              currentState: rule.toState,
              stateTimeBreakdown: currentBreakdown,
            },
            { where: { id: session.id } },
          ),
        ]);
      }

      console.log(
        `✅ Transición automática ejecutada para ${session.user.username}`,
      );
    } catch (error) {
      console.error(
        `❌ Error ejecutando transición para ${session.user.username}:`,
        error,
      );
    }
  }

  private async closeSessionDueToInactivity(
    session: any,
    stateBreakdown: any,
    reason: string,
  ) {
    const now = new Date();
    const userId = session.user.id;

    // Calcular tiempo productivo
    const productiveStates = [UserState.ACTIVO];
    const totalWorked = productiveStates.reduce((sum, state) => {
      return sum + (stateBreakdown[state] || 0);
    }, 0);

    // Cerrar sesión
    await Promise.all([
      UserSession.update(
        {
          sessionEnd: now,
          isActive: false,
          currentState: UserState.DESCONECTADO,
          totalMinutesWorked: totalWorked,
          stateTimeBreakdown: stateBreakdown,
        },
        { where: { id: session.id } },
      ),
      User.update(
        {
          currentState: UserState.DESCONECTADO,
          isInSession: false,
          currentSessionId: null,
        },
        { where: { id: userId } },
      ),
    ]);

    console.log(
      `🚪 Sesión cerrada automáticamente para ${session.user.username} por ${reason}`,
    );
  }

  // Método para limpiar sesiones huérfanas (ejecutar 1 vez por hora)
  async cleanOrphanedSessions() {
    try {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

      const orphanedSessions = (await UserSession.findAll({
        where: {
          isActive: true,
          lastActivity: {
            [Op.lt]: sixHoursAgo,
          },
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["username"],
          },
        ],
      })) as any[];

      for (const session of orphanedSessions) {
        await this.closeSessionDueToInactivity(
          session,
          session.stateTimeBreakdown || {},
          "Sesión huérfana detectada - cierre automático por inactividad prolongada",
        );

        console.log(`🧹 Sesión huérfana limpiada: ${session.user.username}`);
      }

      if (orphanedSessions.length > 0) {
        console.log(
          `🧹 Limpieza completada: ${orphanedSessions.length} sesiones huérfanas cerradas`,
        );
      }
    } catch (error) {
      console.error("❌ Error limpiando sesiones huérfanas:", error);
    }
  }
}

export const stateWorker = new StateWorker();

// Inicializar limpieza de sesiones huérfanas cada hora
cron.schedule("0 * * * *", () => {
  stateWorker.cleanOrphanedSessions();
});
