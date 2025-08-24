import { DailyReport, User } from "../../models";

export async function calculateGeneralMetrics(dateStr: string) {
  const reports = (await DailyReport.findAll({
    where: { reportDate: dateStr },
    include: [
      {
        model: User,
        as: "user",
        where: { isActive: true },
        attributes: ["sector"],
      },
    ],
  })) as any[];

  return {
    totalEmployees: reports.length,
    averageProductivity:
      reports.length > 0
        ? Math.round(
            reports.reduce((sum, r) => sum + r.productivityScore, 0) /
              reports.length,
          )
        : 0,
    totalMinutesWorked: reports.reduce(
      (sum, r) => sum + r.totalMinutesWorked,
      0,
    ),
    highPerformers: reports.filter((r) => r.productivityScore >= 90).length,
    lowPerformers: reports.filter((r) => r.productivityScore < 60).length,
    flexEligible: reports.filter((r) => r.qualifiesForFlexFriday).length,
    totalTasksCompleted: reports.reduce(
      (sum, r) => sum + r.totalTasksCompleted,
      0,
    ),
  };
}
