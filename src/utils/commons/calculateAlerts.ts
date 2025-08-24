import { DailyReport, User } from "../../models";

export async function calculateAlerts(dateStr: string) {
  const reports = (await DailyReport.findAll({
    where: { reportDate: dateStr },
    include: [
      {
        model: User,
        as: "user",
        where: { isActive: true },
        attributes: ["username", "firstname", "lastname", "sector"],
      },
    ],
  })) as any[];

  const alerts = {
    criticalPerformance: reports.filter((r) => r.productivityScore < 40),
    lowPopupAccuracy: reports.filter((r) => r.popupAccuracy < 50),
    lowTaskCompletion: reports.filter((r) => r.taskCompletionRate < 30),
    excessiveInactivity: reports.filter(
      (r) =>
        r.totalMinutesInSession > 0 &&
        r.totalMinutesWorked / r.totalMinutesInSession < 0.3,
    ),
  };

  return alerts;
}
