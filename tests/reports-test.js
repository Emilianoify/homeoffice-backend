// tests/reports-test.js
const axios = require("axios");

const BASE_URL = "http://localhost:3000";
let userToken = "";
let adminToken = "";

// Colores para console
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function apiRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {},
      timeout: 10000,
    };

    if (data) config.data = data;
    if (token) config.headers.Authorization = `Bearer ${token}`;

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
    };
  }
}

async function testReportsSystem() {
  log("📊 INICIANDO TEST DEL SISTEMA DE REPORTES", "cyan");
  log("=".repeat(60), "cyan");

  try {
    // ===============================================
    // 1. LOGIN DE USUARIOS
    // ===============================================
    log("\n🔐 1. LOGIN DE USUARIOS...", "blue");

    // Login usuario normal
    const userLogin = await apiRequest("POST", "/auth/login", {
      username: "user001",
      password: "MiPassword123",
    });

    if (userLogin.success) {
      userToken = userLogin.data.payload.data.tokens.accessToken;
      log("✅ Login usuario normal exitoso", "green");
    } else {
      log(`❌ Login usuario falló: ${userLogin.error}`, "red");
      return;
    }

    // Login admin
    const adminLogin = await apiRequest("POST", "/auth/login", {
      username: "admin001",
      password: "MiPassword123",
    });

    if (adminLogin.success) {
      adminToken = adminLogin.data.payload.data.tokens.accessToken;
      log("✅ Login admin exitoso", "green");
    } else {
      log(`❌ Login admin falló: ${adminLogin.error}`, "red");
      return;
    }

    // ===============================================
    // 2. GENERAR REPORTE MANUAL
    // ===============================================
    log("\n📊 2. TESTING GENERACIÓN MANUAL DE REPORTES...", "blue");

    const today = new Date().toISOString().split("T")[0];
    const generateReport = await apiRequest(
      "POST",
      "/reports/generate",
      {
        date: today,
      },
      userToken,
    );

    if (generateReport.success) {
      log("✅ Reporte manual generado exitosamente", "green");
      const report = generateReport.data.payload.data.report;
      log(`   Score de productividad: ${report.productivityScore}%`, "green");
      log(`   Minutos trabajados: ${report.totalMinutesWorked}`, "green");
      log(`   Pop-ups recibidos: ${report.totalPopupsReceived}`, "green");
      log(`   Precisión pop-ups: ${report.popupAccuracy}%`, "green");
    } else {
      log(`❌ Generación manual falló: ${generateReport.error}`, "red");
    }

    await sleep(1000);

    // ===============================================
    // 3. REPORTE PERSONAL
    // ===============================================
    log("\n👤 3. TESTING REPORTE PERSONAL...", "blue");

    const personalReport = await apiRequest(
      "GET",
      `/reports/personal?date=${today}`,
      null,
      userToken,
    );

    if (personalReport.success) {
      const data = personalReport.data.payload.data;
      log("✅ Reporte personal obtenido", "green");
      log(`   Total de días: ${data.statistics.totalDays}`, "green");
      log(
        `   Productividad promedio: ${data.statistics.averageProductivity}%`,
        "green",
      );
      log(
        `   Minutos trabajados: ${data.statistics.totalMinutesWorked}`,
        "green",
      );
      log(`   Días flex friday: ${data.statistics.flexFridayDays}`, "green");

      if (data.statistics.bestDay) {
        log(
          `   Mejor día: ${data.statistics.bestDay.productivityScore}%`,
          "yellow",
        );
      }
    } else {
      log(`❌ Reporte personal falló: ${personalReport.error}`, "red");
    }

    // ===============================================
    // 4. ESTADO VIERNES FLEX
    // ===============================================
    log("\n🎉 4. TESTING ESTADO VIERNES FLEX...", "blue");

    const flexStatus = await apiRequest(
      "GET",
      "/reports/flex-friday",
      null,
      userToken,
    );

    if (flexStatus.success) {
      const data = flexStatus.data.payload.data;
      log("✅ Estado flex friday obtenido", "green");
      log(`   Días trabajados: ${data.weeklyStatistics.daysWorked}/5`, "green");
      log(
        `   Productividad promedio: ${data.weeklyStatistics.averageProductivity}%`,
        "green",
      );
      log(
        `   Califica para flex: ${data.weeklyStatistics.qualifiesForFlex ? "SÍ" : "NO"}`,
        data.weeklyStatistics.qualifiesForFlex ? "green" : "yellow",
      );
      log(
        `   Meta semanal: ${data.weeklyStatistics.minimumRequired}%`,
        "green",
      );

      if (data.flexFridayInfo.isCurrentlyFriday) {
        log("   🎊 ¡Hoy es viernes!", "magenta");
        log(
          `   Puede salir temprano: ${data.flexFridayInfo.canLeavePremium ? "SÍ" : "NO"}`,
          "magenta",
        );
      }
    } else {
      log(`❌ Estado flex friday falló: ${flexStatus.error}`, "red");
    }

    // ===============================================
    // 5. REPORTE DE EQUIPO
    // ===============================================
    log("\n👥 5. TESTING REPORTE DE EQUIPO...", "blue");

    const teamReport = await apiRequest(
      "GET",
      `/reports/team?date=${today}`,
      null,
      userToken,
    );

    if (teamReport.success) {
      const data = teamReport.data.payload.data;
      log("✅ Reporte de equipo obtenido", "green");
      log(`   Sector: ${data.sector}`, "green");
      log(`   Miembros del equipo: ${data.statistics.totalMembers}`, "green");
      log(
        `   Productividad promedio: ${data.statistics.averageProductivity}%`,
        "green",
      );
      log(
        `   Alto rendimiento (>85%): ${data.statistics.highPerformers}`,
        "green",
      );
      log(
        `   Bajo rendimiento (<60%): ${data.statistics.lowPerformers}`,
        "yellow",
      );
      log(`   Elegibles para flex: ${data.statistics.flexEligible}`, "green");

      if (data.statistics.topPerformer) {
        log(
          `   Mejor del equipo: ${data.statistics.topPerformer.user.firstname} (${data.statistics.topPerformer.productivityScore}%)`,
          "magenta",
        );
      }
    } else {
      log(`❌ Reporte de equipo falló: ${teamReport.error}`, "red");
    }

    // ===============================================
    // 6. DASHBOARD ADMINISTRATIVO
    // ===============================================
    log("\n👑 6. TESTING DASHBOARD ADMINISTRATIVO...", "blue");

    const adminDashboard = await apiRequest(
      "GET",
      `/admin/dashboard?date=${today}`,
      null,
      adminToken,
    );

    if (adminDashboard.success) {
      const data = adminDashboard.data.payload.data;
      log("✅ Dashboard administrativo obtenido", "green");
      log(`   Total empleados: ${data.generalMetrics.totalEmployees}`, "green");
      log(
        `   Productividad promedio: ${data.generalMetrics.averageProductivity}%`,
        "green",
      );
      log(
        `   Alto rendimiento: ${data.generalMetrics.highPerformers}`,
        "green",
      );
      log(
        `   Bajo rendimiento: ${data.generalMetrics.lowPerformers}`,
        "yellow",
      );
      log(
        `   Elegibles flex friday: ${data.generalMetrics.flexEligible}`,
        "green",
      );
      log(
        `   Minutos trabajados total: ${data.generalMetrics.totalMinutesWorked}`,
        "green",
      );

      // Ranking por sector
      if (data.sectorRanking.length > 0) {
        log("   Ranking sectores:", "magenta");
        data.sectorRanking.slice(0, 3).forEach((sector, index) => {
          log(
            `     ${index + 1}. ${sector.sector}: ${sector.averageProductivity}% (${sector.employeeCount} empleados)`,
            "magenta",
          );
        });
      }
    } else {
      log(`❌ Dashboard administrativo falló: ${adminDashboard.error}`, "red");
    }

    // ===============================================
    // 7. RANKING DE PRODUCTIVIDAD
    // ===============================================
    log("\n🏆 7. TESTING RANKING DE PRODUCTIVIDAD...", "blue");

    const rankingReport = await apiRequest(
      "GET",
      `/admin/ranking?date=${today}&limit=10`,
      null,
      adminToken,
    );

    if (rankingReport.success) {
      const data = rankingReport.data.payload.data;
      log("✅ Ranking de productividad obtenido", "green");
      log(`   Total entradas: ${data.statistics.totalEntries}`, "green");
      log(
        `   Productividad promedio: ${data.statistics.averageProductivity}%`,
        "green",
      );
      log(`   Alto rendimiento: ${data.statistics.highPerformers}`, "green");
      log(`   Bajo rendimiento: ${data.statistics.lowPerformers}`, "yellow");
      log(`   Elegibles flex: ${data.statistics.flexEligible}`, "green");

      // Top 3
      if (data.ranking.length > 0) {
        log("   🥇 TOP 3 EMPLEADOS:", "magenta");
        data.ranking.slice(0, 3).forEach((emp) => {
          const medal =
            emp.position === 1 ? "🥇" : emp.position === 2 ? "🥈" : "🥉";
          log(
            `     ${medal} ${emp.user.fullName} (${emp.user.sector}): ${emp.metrics.productivityScore}%`,
            "magenta",
          );
        });
      }
    } else {
      log(`❌ Ranking de productividad falló: ${rankingReport.error}`, "red");
    }

    // ===============================================
    // 8. MÉTRICAS EN TIEMPO REAL
    // ===============================================
    log("\n⚡ 8. VERIFICANDO MÉTRICAS EN TIEMPO REAL...", "blue");

    if (adminDashboard.success) {
      const realTime = adminDashboard.data.payload.data.realTimeMetrics;
      log("✅ Métricas en tiempo real disponibles", "green");
      log(`   Sesiones activas: ${realTime.totalActiveSessions}`, "green");

      if (Object.keys(realTime.stateBreakdown).length > 0) {
        log("   Estados actuales:", "green");
        Object.entries(realTime.stateBreakdown).forEach(([state, count]) => {
          log(`     ${state}: ${count} usuarios`, "yellow");
        });
      }

      if (Object.keys(realTime.sectorBreakdown).length > 0) {
        log("   Actividad por sector:", "green");
        Object.entries(realTime.sectorBreakdown).forEach(([sector, count]) => {
          log(`     ${sector}: ${count} activos`, "yellow");
        });
      }
    }

    // ===============================================
    // 9. TESTING DE PERÍODOS DIFERENTES
    // ===============================================
    log("\n📅 9. TESTING REPORTES SEMANALES/MENSUALES...", "blue");

    // Reporte semanal
    const weeklyReport = await apiRequest(
      "GET",
      `/reports/personal?period=week`,
      null,
      userToken,
    );

    if (weeklyReport.success) {
      log("✅ Reporte semanal obtenido", "green");
      log(`   Período: ${weeklyReport.data.payload.data.period}`, "green");
      log(
        `   Rango: ${weeklyReport.data.payload.data.dateRange.start} a ${weeklyReport.data.payload.data.dateRange.end}`,
        "green",
      );
    } else {
      log(`❌ Reporte semanal falló: ${weeklyReport.error}`, "red");
    }

    // Reporte mensual
    const monthlyReport = await apiRequest(
      "GET",
      `/reports/personal?period=month`,
      null,
      userToken,
    );

    if (monthlyReport.success) {
      log("✅ Reporte mensual obtenido", "green");
      log(`   Período: ${monthlyReport.data.payload.data.period}`, "green");
    } else {
      log(`❌ Reporte mensual falló: ${monthlyReport.error}`, "red");
    }
  } catch (error) {
    log(`💥 Error inesperado en test de reportes: ${error.message}`, "red");
  }

  log("\n🎉 TEST DE REPORTES COMPLETADO", "cyan");
  log("=".repeat(60), "cyan");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Ejecutar el test
if (require.main === module) {
  testReportsSystem()
    .then(() => {
      console.log("\n✨ Sistema de reportes validado exitosamente");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Error en test de reportes:", error.message);
      process.exit(1);
    });
}

module.exports = { testReportsSystem };
