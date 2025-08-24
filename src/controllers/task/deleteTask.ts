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
import { UserRole } from "../../utils/enums/UserRole";

export const deleteTask = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role?.name;
    const taskId = req.params.taskId;

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

    // Verificar permisos: Solo puede eliminar quien creó la tarea o admin
    const canDelete =
      task.assignedBy === userId || userRole === UserRole.ADMINISTRADOR;

    if (!canDelete) {
      sendForbidden(res, ERROR_MESSAGES.TASKS.UNAUTHORIZED_TASK_ACCESS);
      return;
    }

    // No se puede eliminar una tarea completada (regla de negocio)
    if (task.status === TaskStatus.COMPLETADA) {
      sendBadRequest(res, ERROR_MESSAGES.TASKS.TASK_ALREADY_COMPLETED);
      return;
    }

    // Guardar información para el log antes de eliminar
    const taskInfo = {
      id: task.id,
      title: task.title,
      assigneeName: `${task.assignee.firstname} ${task.assignee.lastname}`,
      assigneeUsername: task.assignee.username,
      status: task.status,
      priority: task.priority,
      createdAt: task.createdAt,
    };

    // Eliminar la tarea (soft delete gracias a paranoid: true)
    await Task.destroy({ where: { id: taskId } });

    // Log de auditoría
    console.log(`🗑️ [TASK DELETED] Tarea eliminada:`);
    console.log(`   Eliminado por: ${req.user!.username} (${userId})`);
    console.log(`   Tarea: ${taskInfo.title} (${taskId})`);
    console.log(`   Estaba asignada a: ${taskInfo.assigneeUsername}`);
    console.log(`   Estado: ${taskInfo.status}`);
    console.log(`   Prioridad: ${taskInfo.priority}`);
    console.log(`   Creada: ${taskInfo.createdAt}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    // TODO: Notificar al usuario asignado que la tarea fue eliminada
    // sendTaskDeletedEmail(task.assignee.email, task.title, ...)

    sendSuccessResponse(res, SUCCESS_MESSAGES.TASKS.TASK_DELETED, {
      deletedTask: {
        id: taskInfo.id,
        title: taskInfo.title,
        assignee: taskInfo.assigneeName,
        status: taskInfo.status,
        priority: taskInfo.priority,
      },
      deletionInfo: {
        deletedBy: req.user!.username,
        deletedAt: new Date().toISOString(),
        reason: "Eliminada por coordinador",
      },
      message: "La tarea ha sido eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error en deleteTask:", error);
    sendInternalErrorResponse(res);
  }
};
