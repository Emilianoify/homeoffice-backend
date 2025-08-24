import { Response } from "express";
import { User, Role } from "../../models";
import { IUser } from "../../interfaces/user.interface";
import { AuthRequest } from "../../interfaces/auth.interface";
import {
  sendSuccessResponse,
  sendInternalErrorResponse,
  sendBadRequest,
} from "../../utils/commons/responseFunctions";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";
import { calculateMemberSince } from "../../utils/commons/calcMemberSince";
import { Op } from "sequelize";

interface ListUsersQuery {
  page?: string;
  limit?: string;
  search?: string;
  sector?: string;
  role?: string;
  status?: "active" | "inactive" | "all";
  sortBy?: "createdAt" | "lastLogin" | "username" | "productivityScore";
  sortOrder?: "asc" | "desc";
}

export const listUsers = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const adminUserId = req.user!.id;
    const {
      page = "1",
      limit = "20",
      search,
      sector,
      role,
      status = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
    }: ListUsersQuery = req.query;

    // Validaciones básicas
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      sendBadRequest(
        res,
        ERROR_MESSAGES.SERVER.INVALID_PAGINATION_PARAMETERS,
        "400",
      );
      return;
    }

    const offset = (pageNum - 1) * limitNum;

    // Construir condiciones WHERE
    const whereConditions: any = {};

    // Filtro por estado
    if (status === "active") {
      whereConditions.isActive = true;
    } else if (status === "inactive") {
      whereConditions.isActive = false;
    }
    // Si es "all", no agregamos filtro de isActive

    // Filtro por sector
    if (sector) {
      whereConditions.sector = sector;
    }

    // Búsqueda por texto
    if (search) {
      whereConditions[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { firstname: { [Op.iLike]: `%${search}%` } },
        { lastname: { [Op.iLike]: `%${search}%` } },
        { corporative_email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Condición para include de Role
    const roleInclude: any = {
      model: Role,
      as: "role",
      attributes: ["id", "name", "description", "isActive"],
    };

    // Filtro por rol específico
    if (role) {
      roleInclude.where = { name: role };
    }

    // Ordenamiento
    const validSortFields = [
      "createdAt",
      "lastLogin",
      "username",
      "productivityScore",
    ];
    const orderBy = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const order = sortOrder === "asc" ? "ASC" : "DESC";

    // Consulta principal
    const result = await User.findAndCountAll({
      where: whereConditions,
      include: [roleInclude],
      attributes: {
        exclude: ["password", "passwordResetToken", "passwordResetExpires"],
      },
      order: [[orderBy, order]],
      limit: limitNum,
      offset: offset,
    });

    const count = result.count;
    const users = result.rows.map((row) => row.toJSON() as IUser);

    // Procesar datos para respuesta
    const processedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      corporative_email: user.corporative_email,
      isActive: user.isActive,
      sector: user.sector,
      currentState: user.currentState,
      isInSession: user.isInSession,
      lastLogin: user.lastLogin,
      productivityScore: user.productivityScore,
      popupFrequency: user.popupFrequency,
      qualifiesForFlexFriday: user.qualifiesForFlexFriday,
      role: {
        id: user.role?.id,
        name: user.role?.name,
        description: user.role?.description,
        isActive: user.role?.isActive,
      },
      account: {
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        memberSince: calculateMemberSince(user.createdAt),
      },
      metrics: {
        totalPopupsReceived: user.totalPopupsReceived,
        totalPopupsCorrect: user.totalPopupsCorrect,
        popupAccuracy:
          user.totalPopupsReceived > 0
            ? Math.round(
                (user.totalPopupsCorrect / user.totalPopupsReceived) * 100,
              )
            : 0,
      },
    }));

    // Calcular estadísticas generales
    const totalUsers = count;
    const totalPages = Math.ceil(totalUsers / limitNum);
    const activeUsers = users.filter((u) => u.isActive).length;
    const inSessionUsers = users.filter((u) => u.isInSession).length;

    // Estadísticas por sector (solo para la página actual)
    const sectorStats = users.reduce((stats: any, user) => {
      if (!stats[user.sector]) {
        stats[user.sector] = { total: 0, active: 0, inSession: 0 };
      }
      stats[user.sector].total++;
      if (user.isActive) stats[user.sector].active++;
      if (user.isInSession) stats[user.sector].inSession++;
      return stats;
    }, {});

    // Log de auditoría
    console.log(`📋 [ADMIN LIST] Usuarios listados:`);
    console.log(`   Admin: ${req.user!.username} (${adminUserId})`);
    console.log(
      `   Filtros: sector=${sector || "todos"}, role=${role || "todos"}, status=${status}`,
    );
    console.log(`   Resultados: ${users.length}/${totalUsers} usuarios`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    // Respuesta
    sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.ADMIN.USER_LIST_RETRIEVED,
      "200",
      {
        users: processedUsers,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalUsers,
          usersPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        statistics: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          inSessionUsers,
          sectorBreakdown: sectorStats,
        },
        filters: {
          search: search || null,
          sector: sector || null,
          role: role || null,
          status,
          sortBy: orderBy,
          sortOrder: order.toLowerCase(),
        },
        adminInfo: {
          listGeneratedBy: req.user!.username,
          timestamp: new Date().toISOString(),
        },
      },
    );
  } catch (error) {
    console.error("Error en listUsers:", error);
    sendInternalErrorResponse(res);
  }
};
