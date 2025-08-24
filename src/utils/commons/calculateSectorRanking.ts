import { IDailyReport } from "../../interfaces/dailyreport.interface";
import { ISectorMetrics } from "../../interfaces/metrics.interface";
import { DailyReport, User } from "../../models";

export async function calculateSectorRanking(
  dateStr: string,
): Promise<ISectorMetrics[]> {
  // Obtener reportes con tipado
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
  })) as unknown as IDailyReport[];

  // Agrupar por sector con tipo explícito
  const sectorGroups: Record<string, IDailyReport[]> = reports.reduce(
    (groups: Record<string, IDailyReport[]>, report) => {
      const sector = report.user?.sector;
      if (!sector) return groups; // Saltar si no tiene sector

      if (!groups[sector]) {
        groups[sector] = [];
      }
      groups[sector].push(report);
      return groups;
    },
    {},
  );

  // Calcular métricas por sector
  const sectorRanking = Object.entries(sectorGroups)
    .map(([sector, sectorReports]): ISectorMetrics => {
      const totalProductivity = sectorReports.reduce(
        (sum, r) => sum + r.productivityScore,
        0,
      );
      const avgProductivity = Math.round(
        totalProductivity / sectorReports.length,
      );

      return {
        sector,
        employeeCount: sectorReports.length,
        averageProductivity: avgProductivity,
        totalMinutesWorked: sectorReports.reduce(
          (sum, r) => sum + r.totalMinutesWorked,
          0,
        ),
        highPerformers: sectorReports.filter((r) => r.productivityScore >= 90)
          .length,
        flexEligible: sectorReports.filter((r) => r.qualifiesForFlexFriday)
          .length,
      };
    })
    .sort((a, b) => b.averageProductivity - a.averageProductivity);

  return sectorRanking;
}
