import { DailyReport, User } from "../../models";

export async function calculateFlexFridayStats(dateStr: string) {
  const date = new Date(dateStr);
  const isFriday = date.getDay() === 5;

  if (!isFriday) {
    return {
      isFriday: false,
      message: "Estadísticas de viernes flex solo disponibles los viernes",
    };
  }

  const reports = (await DailyReport.findAll({
    where: {
      reportDate: dateStr,
      qualifiesForFlexFriday: true,
    },
    include: [
      {
        model: User,
        as: "user",
        where: { isActive: true },
        attributes: ["username", "firstname", "lastname", "sector"],
      },
    ],
  })) as any[];

  return {
    isFriday: true,
    totalEligible: reports.length,
    eligibleBySector: reports.reduce((groups: any, report) => {
      const sector = report.user.sector;
      groups[sector] = (groups[sector] || 0) + 1;
      return groups;
    }, {}),
    eligibleUsers: reports.map((report) => ({
      username: report.user.username,
      fullName: `${report.user.firstname} ${report.user.lastname}`,
      sector: report.user.sector,
      weeklyAverage: report.weeklyProductivityAverage,
    })),
  };
}
