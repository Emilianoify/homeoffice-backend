import { UserSession, User } from "../../models";

export async function calculateRealTimeMetrics() {
  // Usuarios actualmente en sesión
  const activeSessions = (await UserSession.findAll({
    where: { isActive: true },
    include: [
      {
        model: User,
        as: "user",
        where: { isActive: true },
        attributes: ["username", "currentState", "sector"],
      },
    ],
  })) as any[];

  const stateBreakdown = activeSessions.reduce((breakdown: any, session) => {
    const state = session.user.currentState;
    breakdown[state] = (breakdown[state] || 0) + 1;
    return breakdown;
  }, {});

  const sectorBreakdown = activeSessions.reduce((breakdown: any, session) => {
    const sector = session.user.sector;
    breakdown[sector] = (breakdown[sector] || 0) + 1;
    return breakdown;
  }, {});

  return {
    totalActiveSessions: activeSessions.length,
    stateBreakdown,
    sectorBreakdown,
    lastUpdated: new Date().toISOString(),
  };
}
