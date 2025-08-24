import { DailyReport, User } from "../../models";

export async function calculatePerformanceRanking(dateStr: string) {
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
    order: [["productivityScore", "DESC"]],
    limit: 10,
  })) as any[];

  const topPerformers = reports.slice(0, 5).map((report, index) => ({
    position: index + 1,
    username: report.user.username,
    fullName: `${report.user.firstname} ${report.user.lastname}`,
    sector: report.user.sector,
    productivityScore: report.productivityScore,
  }));

  const lowPerformers = reports
    .filter((r) => r.productivityScore < 60)
    .slice(0, 5)
    .map((report, index) => ({
      position: index + 1,
      username: report.user.username,
      fullName: `${report.user.firstname} ${report.user.lastname}`,
      sector: report.user.sector,
      productivityScore: report.productivityScore,
    }));

  return {
    topPerformers,
    lowPerformers,
  };
}
