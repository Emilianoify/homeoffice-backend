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
import { UserRole } from "../../utils/enums/UserRole";

interface CreateTaskRequest {
  title: string;
  description?: string;
  assignedTo: string;
  priority?: TaskPriority;
  dueDate?: string;
  estimatedMinutes?: number;
}

export const createTask = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const coordinatorId = req.user!.id;
    const coordinatorSector = req.user!.sector;
    const coordinatorRole = req.user!.role?.name;

    const {
      title,
      description,
      assignedTo,
      priority = TaskPriority.MEDIA,
      dueDate,
      estimatedMinutes,
    }: CreateTaskRequest = req.body;

    // Validar campos requeridos
    if (!title || !assignedTo) {
      sendBadRequest(res, ERROR_MESSAGES.TASKS.MISSING_REQUIRED_FIELDS);
      return;
    }

    // Solo coordinadores pueden crear tareas
    if (
      coordinatorRole !== UserRole.COORDINADOR_SECTOR &&
      coordinatorRole !== UserRole.COORDINACION &&
      coordinatorRole !== UserRole.ADMINISTRADOR
    ) {
      sendForbidden(res, ERROR_MESSAGES.TASKS.UNAUTHORIZED_TASK_ACCESS);
      return;
    }

    // Buscar el usuario al que se le asigna la tarea
    const assigneeUser = (await User.findOne({
      where: { id: assignedTo, isActive: true },
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name"],
        },
      ],
      attributes: ["id", "username", "firstname", "lastname", "sector"],
    })) as any;

    if (!assigneeUser) {
      sendNotFound(res, ERROR_MESSAGES.USER.USER_NOT_FOUND);
      return;
    }

    // VALIDACIÓN CRÍTICA: Solo puede asignar tareas a usuarios de su mismo sector
    if (assigneeUser.sector !== coordinatorSector) {
      sendForbidden(res, ERROR_MESSAGES.TASKS.CANNOT_ASSIGN_OTHER_SECTOR);
      return;
    }

    // Validar fecha límite si se proporciona
    let parsedDueDate: Date | null = null;
    if (dueDate) {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime()) || parsedDueDate <= new Date()) {
        sendBadRequest(res, ERROR_MESSAGES.TASKS.INVALID_DUE_DATE);
        return;
      }
    }

    // Crear la tarea
    const newTask = (await Task.create({
      title: title.trim(),
      description: description?.trim(),
      assignedTo,
      assignedBy: coordinatorId,
      priority,
      dueDate: parsedDueDate,
      estimatedMinutes,
    })) as any;

    // Obtener la tarea completa con información de los usuarios
    const taskWithDetails = (await Task.findByPk(newTask.id, {
      include: [
        {
          model: User,
          as: "assignee",
          attributes: ["id", "username", "firstname", "lastname"],
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
    console.log(`📋 [TASK CREATED] Nueva tarea creada:`);
    console.log(`   Coordinador: ${req.user!.username} (${coordinatorId})`);
    console.log(`   Asignada a: ${assigneeUser.username} (${assignedTo})`);
    console.log(`   Sector: ${coordinatorSector}`);
    console.log(`   Título: ${title}`);
    console.log(`   Prioridad: ${priority}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    // TODO: Enviar notificación por email al usuario asignado
    // sendTaskAssignedEmail(assigneeUser.corporative_email, title, ...)

    sendSuccessResponse(res, SUCCESS_MESSAGES.TASKS.TASK_CREATED, {
      task: {
        id: taskWithDetails.id,
        title: taskWithDetails.title,
        description: taskWithDetails.description,
        priority: taskWithDetails.priority,
        status: taskWithDetails.status,
        dueDate: taskWithDetails.dueDate,
        estimatedMinutes: taskWithDetails.estimatedMinutes,
        createdAt: taskWithDetails.createdAt,
        assignee: {
          id: taskWithDetails.assignee.id,
          username: taskWithDetails.assignee.username,
          name: `${taskWithDetails.assignee.firstname} ${taskWithDetails.assignee.lastname}`,
          role: taskWithDetails.assignee.role.name,
        },
        assigner: {
          id: taskWithDetails.assigner.id,
          username: taskWithDetails.assigner.username,
          name: `${taskWithDetails.assigner.firstname} ${taskWithDetails.assigner.lastname}`,
        },
      },
      message: "Tarea asignada correctamente al usuario del mismo sector",
    });
  } catch (error) {
    console.error("Error en createTask:", error);
    sendInternalErrorResponse(res);
  }
};
