import { Response } from "express";
import { Task, User, Role } from "../../models";
import { AuthRequest } from "../../interfaces/auth.interface";
import {
  sendBadRequest,
  sendSuccessResponse,
  sendInternalErrorResponse,
} from "../../utils/commons/responseFunctions";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { TaskStatus } from "../../utils/enums/TaskStatus";
import { TaskPriority } from "../../utils/enums/TaskPriority";
import { UserRole } from "../../utils/enums/UserRole";

interface GetTasksQuery {
  status?: TaskStatus;
  priority?: TaskPriority;
  page?: string;
  limit?: string;
  view?: "assigned" | "created"; // assigned = tareas que me asignaron, created = tareas que yo asigné
}

export const getTasks = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role?.name;
    const userSector = req.user!.sector;

    const {
      status,
      priority,
      page = "1",
      limit = "20",
      view = "assigned",
    }: GetTasksQuery = req.query;

    // Validaciones básicas
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      sendBadRequest(res, ERROR_MESSAGES.SERVER.INVALID_PAGINATION_PARAMETERS);
      return;
    }

    const offset = (pageNum - 1) * limitNum;

    // Construir condiciones WHERE según el tipo de vista
    let whereConditions: any = {};

    if (view === "assigned") {
      // Tareas asignadas AL usuario actual
      whereConditions.assignedTo = userId;
    } else if (view === "created") {
      // Tareas creadas POR el usuario actual
      // Solo coordinadores pueden ver tareas que crearon
      if (
        userRole !== UserRole.COORDINADOR_SECTOR &&
        userRole !== UserRole.ADMINISTRADOR
      ) {
        sendBadRequest(res, ERROR_MESSAGES.TASKS.UNAUTHORIZED_TASK_ACCESS);
        return;
      }
      whereConditions.assignedBy = userId;
    }

    // Filtros adicionales
    if (status) {
      whereConditions.status = status;
    }

    if (priority) {
      whereConditions.priority = priority;
    }

    // Consulta principal con paginación
    const { count, rows: tasks } = await Task.findAndCountAll({
      where: whereConditions,
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
      order: [
        ["createdAt", "DESC"], // Más recientes primero
        ["priority", "ASC"], // Alta prioridad primero
      ],
      limit: limitNum,
      offset: offset,
    });

    // Procesar datos para respuesta
    const processedTasks = (tasks as any[]).map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      estimatedMinutes: task.estimatedMinutes,
      actualMinutes: task.actualMinutes,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
      assignee: {
        id: task.assignee.id,
        username: task.assignee.username,
        name: `${task.assignee.firstname} ${task.assignee.lastname}`,
        sector: task.assignee.sector,
        role: task.assignee.role.name,
      },
      assigner: {
        id: task.assigner.id,
        username: task.assigner.username,
        name: `${task.assigner.firstname} ${task.assigner.lastname}`,
      },
      // Información útil para el frontend
      isOverdue:
        task.dueDate && task.status !== TaskStatus.COMPLETADA
          ? new Date(task.dueDate) < new Date()
          : false,
      canEdit:
        task.assignedBy === userId || userRole === UserRole.ADMINISTRADOR,
      canComplete:
        task.assignedTo === userId && task.status === TaskStatus.PENDIENTE,
    }));

    // Calcular estadísticas
    const totalTasks = count;
    const totalPages = Math.ceil(totalTasks / limitNum);

    // Estadísticas por estado (solo para la consulta actual)
    const statusStats = processedTasks.reduce((stats: any, task) => {
      stats[task.status] = (stats[task.status] || 0) + 1;
      return stats;
    }, {});

    // Estadísticas por prioridad
    const priorityStats = processedTasks.reduce((stats: any, task) => {
      stats[task.priority] = (stats[task.priority] || 0) + 1;
      return stats;
    }, {});

    // Log de consulta
    console.log(`📋 [TASKS LIST] Tareas consultadas:`);
    console.log(`   Usuario: ${req.user!.username} (${userId})`);
    console.log(
      `   Vista: ${view} (${view === "assigned" ? "mis tareas" : "tareas que asigné"})`,
    );
    console.log(
      `   Filtros: status=${status || "todos"}, priority=${priority || "todas"}`,
    );
    console.log(`   Resultados: ${tasks.length}/${totalTasks} tareas`);

    sendSuccessResponse(res, SUCCESS_MESSAGES.TASKS.TASKS_RETRIEVED, {
      tasks: processedTasks,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalTasks,
        tasksPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      statistics: {
        totalTasks,
        statusBreakdown: statusStats,
        priorityBreakdown: priorityStats,
      },
      filters: {
        view,
        status: status || null,
        priority: priority || null,
      },
      metadata: {
        userRole,
        userSector,
        canCreateTasks: [
          UserRole.COORDINADOR_SECTOR,
          UserRole.COORDINACION,
          UserRole.ADMINISTRADOR,
        ].includes(userRole as UserRole),
      },
    });
  } catch (error) {
    console.error("Error en getTasks:", error);
    sendInternalErrorResponse(res);
  }
};
