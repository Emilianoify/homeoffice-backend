const axios = require("axios");

const BASE_URL = "http://localhost:3000";
let authToken = "";
let refreshToken = "";

// Colores para console
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Función auxiliar para hacer requests
async function apiRequest(method, endpoint, data = null, useAuth = false) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {},
    };

    if (data) {
      config.data = data;
    }

    if (useAuth && authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

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

// Función para esperar (simular tiempo real)
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Test del flujo completo
async function runFullFlowTest() {
  log("🚀 INICIANDO TEST AUTOMATIZADO DEL FLUJO COMPLETO", "cyan");
  log("=".repeat(60), "cyan");

  try {
    // 1. REGISTER (opcional - crear usuario test)
    log("\n📝 1. TESTING REGISTER...", "blue");
    const registerResult = await apiRequest("POST", "/auth/register", {
      username: "testuser" + Date.now(),
      firstname: "Juan",
      lastname: "Testing",
      corporative_email: `test${Date.now()}@empresa.com`,
      password: "Password123",
      roleId: "436ed456-0221-4edd-a686-a250340ee60f", // ID del rol Administrador
    });

    if (registerResult.success) {
      log("✅ Register exitoso", "green");
      log(`   Usuario: ${registerResult.data.payload.data.username}`, "green");
    } else {
      log(`❌ Register falló: ${registerResult.error}`, "red");
    }

    // 2. LOGIN
    log("\n🔐 2. TESTING LOGIN...", "blue");
    const loginResult = await apiRequest("POST", "/auth/login", {
      username: "user001", // Usuario existente
      password: "MiPassword123",
    });

    if (loginResult.success) {
      authToken = loginResult.data.payload.data.tokens.accessToken;
      refreshToken = loginResult.data.payload.data.tokens.refreshToken;
      log("✅ Login exitoso", "green");
      log(`   Token: ${authToken.substring(0, 20)}...`, "green");
      log(
        `   Estado inicial: ${loginResult.data.payload.data.user.currentState}`,
        "green",
      );
      log(
        `   En sesión: ${loginResult.data.payload.data.user.isInSession}`,
        "green",
      );
    } else {
      log(`❌ Login falló: ${loginResult.error}`, "red");
      return;
    }

    await sleep(1000);

    // 3. CAMBIAR A ACTIVO
    log("\n⚡ 3. TESTING CAMBIO A ACTIVO...", "blue");
    const activoResult = await apiRequest(
      "POST",
      "/states/change",
      {
        newState: "activo",
        reason: "Iniciando jornada laboral - test automatizado",
      },
      true,
    );

    if (activoResult.success) {
      log("✅ Cambio a activo exitoso", "green");
      log(
        `   Nuevo estado: ${activoResult.data.payload.data.newState}`,
        "green",
      );
    } else {
      log(`❌ Cambio a activo falló: ${activoResult.error}`, "red");
    }

    await sleep(5000); // Simular 2 segundos trabajando

    // 4. ESTADO ACTUAL
    log("\n📍 4. TESTING ESTADO ACTUAL...", "blue");
    const currentResult = await apiRequest(
      "GET",
      "/states/current",
      null,
      true,
    );

    if (currentResult.success) {
      const data = currentResult.data.payload.data;
      log("✅ Estado actual obtenido", "green");
      log(`   Estado: ${data.currentState}`, "green");
      log(`   En sesión: ${data.isInSession}`, "green");
      log(
        `   Minutos en estado actual: ${data.minutesInCurrentState}`,
        "green",
      );
      log(`   Tiempo trabajado total: ${data.totalMinutesWorked} min`, "green");
    } else {
      log(`❌ Estado actual falló: ${currentResult.error}`, "red");
    }

    await sleep(10000);

    // 5. CAMBIAR A BAÑO
    log("\n🚽 5. TESTING CAMBIO A BAÑO...", "blue");
    const bañoResult = await apiRequest(
      "POST",
      "/states/change",
      {
        newState: "baño",
        reason: "Pausa rápida - test",
      },
      true,
    );

    if (bañoResult.success) {
      log("✅ Cambio a baño exitoso", "green");
      log(
        `   Duración estado anterior: ${bañoResult.data.payload.data.previousStateDuration} min`,
        "green",
      );
    } else {
      log(`❌ Cambio a baño falló: ${bañoResult.error}`, "red");
    }

    await sleep(2000); // Simular 1.5 segundos en baño

    // 6. VOLVER A ACTIVO
    log("\n⚡ 6. TESTING VOLVER A ACTIVO...", "blue");
    const activoResult2 = await apiRequest(
      "POST",
      "/states/change",
      {
        newState: "activo",
        reason: "Regresando al trabajo",
      },
      true,
    );

    if (activoResult2.success) {
      log("✅ Vuelta a activo exitosa", "green");
    } else {
      log(`❌ Vuelta a activo falló: ${activoResult2.error}`, "red");
    }

    await sleep(3000);

    // 7. HISTORIAL
    log("\n📈 7. TESTING HISTORIAL...", "blue");
    const today = new Date().toISOString().split("T")[0];
    const historyResult = await apiRequest(
      "GET",
      `/states/history?date=${today}&limit=10`,
      null,
      true,
    );

    if (historyResult.success) {
      const data = historyResult.data.payload.data;
      log("✅ Historial obtenido", "green");
      log(`   Total de cambios: ${data.stateHistory.length}`, "green");
      log(
        `   Tiempo total rastreado: ${data.dayStats.totalMinutesTracked} min`,
        "green",
      );
      log(`   Desglose:`, "green");
      Object.entries(data.dayStats.stateBreakdown).forEach(
        ([state, minutes]) => {
          log(`     ${state}: ${minutes} min`, "green");
        },
      );
    } else {
      log(`❌ Historial falló: ${historyResult.error}`, "red");
    }

    // 8. ESTADOS DEL EQUIPO
    log("\n👥 8. TESTING ESTADOS DEL EQUIPO...", "blue");
    const teamResult = await apiRequest("GET", "/states/team", null, true);

    if (teamResult.success) {
      const data = teamResult.data.payload.data;
      log("✅ Estados del equipo obtenidos", "green");
      log(`   Sector: ${data.sector}`, "green");
      log(`   Miembros totales: ${data.totalMembers}`, "green");
      log(`   Miembros activos: ${data.activeMembers}`, "green");

      data.teamStates.forEach((member) => {
        log(
          `   - ${member.name}: ${member.currentState} (${member.minutesInCurrentState} min)`,
          "yellow",
        );
      });
    } else {
      log(`❌ Estados del equipo falló: ${teamResult.error.message}`, "red");
    }

    await sleep(2000);

    // 9. LOGOUT
    log("\n👋 9. TESTING LOGOUT...", "blue");
    const logoutResult = await apiRequest("POST", "/auth/logout", null, true);

    if (logoutResult.success) {
      const summary = logoutResult.data.payload.data.sessionSummary;
      log("✅ Logout exitoso", "green");
      if (summary) {
        log(
          `   Duración total sesión: ${summary.totalMinutesInSession} min`,
          "green",
        );
        log(`   Tiempo productivo: ${summary.totalMinutesWorked} min`, "green");
        log(`   Desglose final:`, "green");
        Object.entries(summary.stateBreakdown).forEach(([state, minutes]) => {
          log(`     ${state}: ${minutes} min`, "yellow");
        });
      }
    } else {
      log(`❌ Logout falló: ${logoutResult.error}`, "red");
    }

    // 10. VERIFICAR QUE NO PUEDE ACCEDER SIN TOKEN
    log("\n🔒 10. TESTING ACCESO SIN TOKEN...", "blue");
    const noTokenResult = await apiRequest(
      "GET",
      "/states/current",
      null,
      false,
    );

    if (!noTokenResult.success && noTokenResult.status === 401) {
      log("✅ Seguridad funcionando - acceso denegado sin token", "green");
    } else {
      log("❌ Problema de seguridad - acceso permitido sin token", "red");
    }
  } catch (error) {
    log(`💥 Error inesperado: ${error.message}`, "red");
  }

  log("\n🎉 TEST AUTOMATIZADO COMPLETADO", "cyan");
  log("=".repeat(60), "cyan");
}

// Ejecutar el test
if (require.main === module) {
  runFullFlowTest()
    .then(() => {
      console.log("\n✨ Todos los tests ejecutados");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Error en tests:", error.message);
      process.exit(1);
    });
}

module.exports = { runFullFlowTest };
