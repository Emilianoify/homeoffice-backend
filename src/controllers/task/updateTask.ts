import { Response } from "express";
import { Task, User, Role } from "../../models";
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
import { TaskPriority } from "../../utils/enums/TaskPriority";
import { TaskStatus } from "../../utils/enums/TaskStatus";
import { UserRole } from "../../utils/enums/UserRole";

interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  estimatedMinutes?: number;
  assignedTo?: string; // Solo admin o coordinador puede reasignar
}

export const updateTask = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role?.name;
    const userSector = req.user!.sector;
    const taskId = req.params.taskId;

    const {
      title,
      description,
      priority,
      dueDate,
      estimatedMinutes,
      assignedTo,
    }: UpdateTaskRequest = req.body;

    if (!taskId) {
      sendBadRequest(res, ERROR_MESSAGES.TASKS.TASK_NOT_FOUND);
      return;
    }

    // Verificar que al menos un campo esté presente para actualizar
    if (
      !title &&
      !description &&
      !priority &&
      !dueDate &&
      !estimatedMinutes &&
      !assignedTo
    ) {
      sendBadRequest(res, ERROR_MESSAGES.USER.NO_FIELDS_TO_UPDATE);
      return;
    }

    // Buscar la tarea
    const task = (await Task.findOne({
      where: { id: taskId },
      include: [
        {
          model: User,
          as: "assignee",
          attributes: ["id", "username", "firstname", "lastname", "sector"],
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

    // Verificar permisos: Solo puede editar quien creó la tarea o admin
    const canEdit =
      task.assignedBy === userId || userRole === UserRole.ADMINISTRADOR;

    if (!canEdit) {
      sendForbidden(res, ERROR_MESSAGES.TASKS.UNAUTHORIZED_TASK_ACCESS);
      return;
    }

    // No se puede editar una tarea completada
    if (task.status === TaskStatus.COMPLETADA) {
      sendBadRequest(res, ERROR_MESSAGES.TASKS.TASK_ALREADY_COMPLETED);
      return;
    }

    // Preparar objeto de actualización
    const updateData: any = {};
    const changesLog: string[] = [];

    // Actualizar campos básicos
    if (title !== undefined && title.trim() !== task.title) {
      updateData.title = title.trim();
      changesLog.push(`título: "${task.title}" → "${title.trim()}"`);
    }

    if (description !== undefined && description?.trim() !== task.description) {
      updateData.description = description?.trim() || null;
      changesLog.push(
        `descripción: "${task.description || "Sin descripción"}" → "${description?.trim() || "Sin descripción"}"`,
      );
    }

    if (priority !== undefined && priority !== task.priority) {
      updateData.priority = priority;
      changesLog.push(`prioridad: ${task.priority} → ${priority}`);
    }

    if (
      estimatedMinutes !== undefined &&
      estimatedMinutes !== task.estimatedMinutes
    ) {
      updateData.estimatedMinutes = estimatedMinutes;
      changesLog.push(
        `tiempo estimado: ${task.estimatedMinutes || "No especificado"} → ${estimatedMinutes || "No especificado"} min`,
      );
    }

    // Actualizar fecha límite
    if (dueDate !== undefined) {
      let parsedDueDate: Date | null = null;
      if (dueDate) {
        parsedDueDate = new Date(dueDate);
        if (isNaN(parsedDueDate.getTime()) || parsedDueDate <= new Date()) {
          sendBadRequest(res, ERROR_MESSAGES.TASKS.INVALID_DUE_DATE);
          return;
        }
      }
      updateData.dueDate = parsedDueDate;
      changesLog.push(
        `fecha límite: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Sin fecha"} → ${parsedDueDate ? parsedDueDate.toLocaleDateString() : "Sin fecha"}`,
      );
    }

    // Reasignar tarea (solo coordinadores y admin)
    if (assignedTo !== undefined && assignedTo !== task.assignedTo) {
      // Verificar permisos para reasignar
      const canReassign = [
        UserRole.COORDINADOR_SECTOR,
        UserRole.COORDINACION,
        UserRole.ADMINISTRADOR,
      ].includes(userRole as UserRole);

      if (!canReassign) {
        sendForbidden(res, ERROR_MESSAGES.TASKS.UNAUTHORIZED_TASK_ACCESS);
        return;
      }

      // Buscar el nuevo usuario asignado
      const newAssignee = (await User.findOne({
        where: { id: assignedTo, isActive: true },
        attributes: ["id", "username", "firstname", "lastname", "sector"],
      })) as any;

      if (!newAssignee) {
        sendNotFound(res, ERROR_MESSAGES.USER.USER_NOT_FOUND);
        return;
      }

      // Validar que el nuevo usuario sea del mismo sector
      if (newAssignee.sector !== userSector) {
        sendForbidden(res, ERROR_MESSAGES.TASKS.CANNOT_ASSIGN_OTHER_SECTOR);
        return;
      }

      updateData.assignedTo = assignedTo;
      changesLog.push(
        `asignado a: ${task.assignee.username} → ${newAssignee.username}`,
      );

      // TODO: Enviar notificación al nuevo usuario asignado
    }

    // Si no hay cambios reales, devolver mensaje
    if (Object.keys(updateData).length === 0) {
      sendBadRequest(res, ERROR_MESSAGES.ADMIN.NO_CHANGES_DETECTED);
      return;
    }

    // Actualizar la tarea
    await Task.update(updateData, { where: { id: taskId } });

    // Obtener la tarea actualizada
    const updatedTask = (await Task.findByPk(taskId, {
      include: [
        {
          model: User,
          as: "assignee",
          attributes: ["id", "username", "firstname", "lastname", "sector"],
          include: [
            {
              model: Role,
              as: "role",
              attributes: ["name"],
            },
          ],
        },
        {
          model: User,
          as: "assigner",
          attributes: ["id", "username", "firstname", "lastname"],
        },
      ],
    })) as any;

    // Log de auditoría
    console.log(`📝 [TASK UPDATED] Tarea actualizada:`);
    console.log(`   Editor: ${req.user!.username} (${userId})`);
    console.log(`   Tarea: ${updatedTask.title} (${taskId})`);
    console.log(`   Cambios realizados:`);
    changesLog.forEach((change) => console.log(`     - ${change}`));
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    sendSuccessResponse(res, SUCCESS_MESSAGES.TASKS.TASK_UPDATED, {
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
        updatedAt: updatedTask.updatedAt,
        assignee: {
          id: updatedTask.assignee.id,
          username: updatedTask.assignee.username,
          name: `${updatedTask.assignee.firstname} ${updatedTask.assignee.lastname}`,
          sector: updatedTask.assignee.sector,
          role: updatedTask.assignee.role.name,
        },
        assigner: {
          id: updatedTask.assigner.id,
          username: updatedTask.assigner.username,
          name: `${updatedTask.assigner.firstname} ${updatedTask.assigner.lastname}`,
        },
      },
      updateInfo: {
        changesApplied: changesLog,
        updatedBy: req.user!.username,
        timestamp: new Date().toISOString(),
      },
      message: "Tarea actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error en updateTask:", error);
    sendInternalErrorResponse(res);
  }
};
