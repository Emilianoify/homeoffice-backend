import { Response } from "express";
import { Task, User } from "../../models";
import { AuthRequest } from "../../interfaces/auth.interface";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
  sendNotFound,
  sendForbidden,
} from "../../utils/commons/responseFunctions";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { TaskStatus } from "../../utils/enums/TaskStatus";

interface CompleteTaskRequest {
  actualMinutes?: number;
  completionNotes?: string;
}

export const completeTask = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const taskId = req.params.taskId;
    const { actualMinutes, completionNotes }: CompleteTaskRequest = req.body;

    if (!taskId) {
      sendBadRequest(res, ERROR_MESSAGES.TASKS.TASK_NOT_FOUND);
      return;
    }

    // Buscar la tarea con información completa
    const task = (await Task.findOne({
      where: { id: taskId },
      include: [
        {
          model: User,
          as: "assignee",
          attributes: ["id", "username", "firstname", "lastname"],
        },
        {
          model: User,
          as: "assigner",
          attributes: ["id", "username", "firstname", "lastname"],
        },
      ],
    })) as any;

    if (!task) {
      sendNotFound(res, ERROR_MESSAGES.TASKS.TASK_NOT_FOUND);
      return;
    }

    // Solo el usuario asignado puede completar la tarea
    if (task.assignedTo !== userId) {
      sendForbidden(res, ERROR_MESSAGES.TASKS.ONLY_ASSIGNEE_CAN_COMPLETE);
      return;
    }

    // Verificar que la tarea no esté ya completada
    if (task.status === TaskStatus.COMPLETADA) {
      sendBadRequest(res, ERROR_MESSAGES.TASKS.TASK_ALREADY_COMPLETED);
      return;
    }

    // Calcular tiempo real si no se proporcionó
    let finalActualMinutes = actualMinutes;
    if (!finalActualMinutes && task.estimatedMinutes) {
      // Si no se proporciona tiempo real, usar el estimado
      finalActualMinutes = task.estimatedMinutes;
    }

    const completedAt = new Date();
    // Actualizar la tarea

    if (completionNotes) {
      await Task.update(
        {
          status: TaskStatus.COMPLETADA,
          completedAt,
          actualMinutes: finalActualMinutes,
          completionNotes: completionNotes,
        },
        { where: { id: taskId } },
      );
    } else {
      await Task.update(
        {
          status: TaskStatus.COMPLETADA,
          completedAt,
          actualMinutes: finalActualMinutes,
        },
        { where: { id: taskId } },
      );
    }

    // Obtener la tarea actualizada
    const updatedTask = (await Task.findByPk(taskId, {
      include: [
        {
          model: User,
          as: "assignee",
          attributes: ["id", "username", "firstname", "lastname"],
        },
        {
          model: User,
          as: "assigner",
          attributes: ["id", "username", "firstname", "lastname"],
        },
      ],
    })) as any;

    // Calcular métricas de rendimiento
    const createdAt = new Date(task.createdAt);
    const totalDurationHours = Math.round(
      (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60),
    );

    const isOverdue = task.dueDate
      ? completedAt > new Date(task.dueDate)
      : false;
    const efficiencyPercentage =
      task.estimatedMinutes && finalActualMinutes
        ? Math.round((task.estimatedMinutes / finalActualMinutes) * 100)
        : null;

    // Log de auditoría
    console.log(`✅ [TASK COMPLETED] Tarea completada:`);
    console.log(`   Usuario: ${req.user!.username} (${userId})`);
    console.log(`   Tarea: ${task.title} (${taskId})`);
    console.log(
      `   Tiempo estimado: ${task.estimatedMinutes || "No especificado"} min`,
    );
    console.log(
      `   Tiempo real: ${finalActualMinutes || "No especificado"} min`,
    );
    console.log(`   Duración total: ${totalDurationHours}h`);
    console.log(`   Entregado ${isOverdue ? "tarde" : "a tiempo"}`);
    console.log(`   Timestamp: ${completedAt.toISOString()}`);

    // TODO: Notificar al coordinador que asignó la tarea
    // sendTaskCompletedEmail(task.assigner.email, task.title, ...)

    sendSuccessResponse(res, SUCCESS_MESSAGES.TASKS.TASK_COMPLETED, {
      task: {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        status: updatedTask.status,
        dueDate: updatedTask.dueDate,
        estimatedMinutes: updatedTask.estimatedMinutes,
        actualMinutes: updatedTask.actualMinutes,
        createdAt: updatedTask.createdAt,
        completedAt: updatedTask.completedAt,
        assignee: {
          id: updatedTask.assignee.id,
          username: updatedTask.assignee.username,
          name: `${updatedTask.assignee.firstname} ${updatedTask.assignee.lastname}`,
        },
        assigner: {
          id: updatedTask.assigner.id,
          username: updatedTask.assigner.username,
          name: `${updatedTask.assigner.firstname} ${updatedTask.assigner.lastname}`,
        },
      },
      performance: {
        totalDurationHours,
        isOverdue,
        efficiencyPercentage,
        deliveryStatus: isOverdue ? "Entregado tarde" : "Entregado a tiempo",
      },
      message: "Tarea marcada como completada exitosamente",
    });
  } catch (error) {
    console.error("Error en completeTask:", error);
    sendInternalErrorResponse(res);
  }
};
