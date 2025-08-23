import { AuthRequest } from "../../interfaces/auth.interface";
import { User, UserSession, UserStateModel } from "../../models";
import {
  sendSuccessResponse,
  sendInternalErrorResponse,
  sendBadRequest,
} from "../../utils/commons/responseFunctions";
import { Response } from "express";
import { SUCCESS_MESSAGES } from "../../utils/constants/messages/success.messages";
import { ERROR_MESSAGES } from "../../utils/constants/messages/error.messages";

export const getTeamStates = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user || !req.user.sector) {
      sendBadRequest(res, ERROR_MESSAGES.USER.EMPTY_SECTOR, "400");
      return;
    }

    const userSector = req.user.sector;

    // Solo usuarios del mismo sector pueden ver estados del equipo
    const teamMembers = (await User.findAll({
      where: {
        sector: userSector,
        isActive: true,
      },
      include: [
        {
          model: UserSession,
          as: "sessions",
          where: { isActive: true },
          required: false,
          include: [
            {
              model: UserStateModel,
              as: "stateChanges",
              where: { stateEnd: null },
              required: false,
              limit: 1,
            },
          ],
        },
      ],
      attributes: [
        "id",
        "username",
        "firstname",
        "lastname",
        "currentState",
        "isInSession",
        "sector",
      ],
    })) as any[];

    const teamStates = teamMembers.map((member) => {
      const activeSession = member.sessions?.[0];
      const currentStateRecord = activeSession?.stateChanges?.[0];

      let minutesInCurrentState = 0;
      if (currentStateRecord) {
        const stateStart = new Date(currentStateRecord.stateStart);
        minutesInCurrentState = Math.round(
          (Date.now() - stateStart.getTime()) / (1000 * 60),
        );
      }

      return {
        userId: member.id,
        username: member.username,
        name: `${member.firstname} ${member.lastname}`,
        currentState: member.currentState,
        isInSession: member.isInSession,
        stateStart: currentStateRecord?.stateStart || null,
        minutesInCurrentState,
        totalMinutesWorked: activeSession?.totalMinutesWorked || 0,
      };
    });

    sendSuccessResponse(
      res,
      SUCCESS_MESSAGES.STATES.TEAM_STATES_RETRIEVED,
      "200",
      {
        sector: userSector,
        teamStates,
        totalMembers: teamStates.length,
        activeMembers: teamStates.filter((member) => member.isInSession).length,
      },
    );
  } catch (error) {
    console.error("Error en getTeamStates:", error);
    sendInternalErrorResponse(res);
  }
};
