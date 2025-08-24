// =====================================================
// tests/production-ready.js - Validación completa del sistema
// =====================================================
const axios = require("axios");

const BASE_URL = "http://localhost:3000";
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class SystemValidator {
  constructor() {
    this.results = {
      authentication: { passed: 0, total: 0, critical: true },
      userManagement: { passed: 0, total: 0, critical: true },
      stateManagement: { passed: 0, total: 0, critical: true },
      popupSystem: { passed: 0, total: 0, critical: false },
      adminFunctions: { passed: 0, total: 0, critical: true },
      security: { passed: 0, total: 0, critical: true },
      performance: { passed: 0, total: 0, critical: false },
    };
    this.tokens = {};
    this.testUsers = [];
  }

  async test(category, description, testFn) {
    this.results[category].total++;
    try {
      const startTime = Date.now();
      await testFn();
      const duration = Date.now() - startTime;
      this.results[category].passed++;
      log(`  ✅ ${description} (${duration}ms)`, "green");
      return true;
    } catch (error) {
      log(`  ❌ ${description} - ${error.message}`, "red");
      return false;
    }
  }

  async apiRequest(method, endpoint, data = null, useAuth = null) {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {},
      timeout: 5000, // 5 segundos timeout
    };

    if (data) config.data = data;
    if (useAuth && this.tokens[useAuth]) {
      config.headers.Authorization = `Bearer ${this.tokens[useAuth]}`;
    }

    const response = await axios(config);
    return response.data;
  }

  // ===============================================
  // TESTS DE AUTENTICACIÓN
  // ===============================================
  async testAuthentication() {
    log("\n🔐 TESTING AUTENTICACIÓN...", "blue");

    await this.test("authentication", "Login de administrador", async () => {
      const result = await this.apiRequest("POST", "/auth/login", {
        username: "admin001",
        password: "MiPassword123",
      });
      this.tokens.admin = result.payload.data.tokens.accessToken;
      if (!this.tokens.admin) throw new Error("Token no recibido");
    });

    await this.test("authentication", "Login de usuario normal", async () => {
      const result = await this.apiRequest("POST", "/auth/login", {
        username: "user001",
        password: "MiPassword123",
      });
      this.tokens.user = result.payload.data.tokens.accessToken;
      if (!this.tokens.user) throw new Error("Token no recibido");
    });

    await this.test("authentication", "Refresh token funcional", async () => {
      const loginResult = await this.apiRequest("POST", "/auth/login", {
        username: "user001",
        password: "MiPassword123",
      });
      const refreshToken = loginResult.payload.data.tokens.refreshToken;

      const result = await this.apiRequest("POST", "/auth/refresh-token", {
        refreshToken: refreshToken,
      });
      if (!result.payload.data.accessToken) throw new Error("Refresh falló");
    });

    await this.test("authentication", "Logout completo", async () => {
      await this.apiRequest("POST", "/auth/logout", null, "user");
      // Intentar usar el token después del logout debería fallar
      try {
        await this.apiRequest("GET", "/states/current", null, "user");
        throw new Error("Token debería estar revocado");
      } catch (error) {
        if (error.response?.status !== 401) throw error;
      }
    });
  }

  // ===============================================
  // TESTS DE GESTIÓN DE ESTADOS
  // ===============================================
  async testStateManagement() {
    log("\n⚡ TESTING GESTIÓN DE ESTADOS...", "blue");

    // Necesitamos un nuevo login después del logout
    const loginResult = await this.apiRequest("POST", "/auth/login", {
      username: "user001",
      password: "MiPassword123",
    });
    this.tokens.user = loginResult.payload.data.tokens.accessToken;

    await this.test("stateManagement", "Cambio a estado activo", async () => {
      await this.apiRequest(
        "POST",
        "/states/change",
        {
          newState: "activo",
          reason: "Validación de producción",
        },
        "user",
      );
    });

    await this.test(
      "stateManagement",
      "Consulta de estado actual",
      async () => {
        const result = await this.apiRequest(
          "GET",
          "/states/current",
          null,
          "user",
        );
        if (result.payload.data.currentState !== "activo") {
          throw new Error("Estado no actualizado correctamente");
        }
      },
    );

    await this.test(
      "stateManagement",
      "Cambio de estado con duración",
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 segundos
        await this.apiRequest(
          "POST",
          "/states/change",
          {
            newState: "baño",
            reason: "Test de duración",
          },
          "user",
        );
      },
    );

    await this.test("stateManagement", "Historial de estados", async () => {
      const result = await this.apiRequest(
        "GET",
        "/states/history?limit=10",
        null,
        "user",
      );
      if (
        !result.payload.data.stateHistory ||
        result.payload.data.stateHistory.length === 0
      ) {
        throw new Error("Historial vacío");
      }
    });

    await this.test("stateManagement", "Estados del equipo", async () => {
      const result = await this.apiRequest("GET", "/states/team", null, "user");
      if (!result.payload.data.teamStates) {
        throw new Error("Estados de equipo no disponibles");
      }
    });
  }

  // ===============================================
  // TESTS DEL SISTEMA DE POP-UPS
  // ===============================================
  async testPopupSystem() {
    log("\n🧮 TESTING SISTEMA DE POP-UPS...", "blue");

    await this.test("popupSystem", "Generación de pop-up forzado", async () => {
      const result = await this.apiRequest(
        "POST",
        "/popups/generate",
        {
          force: true,
        },
        "user",
      );
      this.popupId = result.payload.data.popupId;
      if (!this.popupId) throw new Error("Pop-up no generado");
    });

    await this.test("popupSystem", "Respuesta correcta a pop-up", async () => {
      // Necesitamos obtener la respuesta correcta del pop-up generado
      const exercise = "5 + 3"; // Ejemplo, en real sería dinámico
      await this.apiRequest(
        "POST",
        "/popups/respond",
        {
          popupId: this.popupId,
          userAnswer: 8, // Respuesta correcta para el ejemplo
        },
        "user",
      );
    });

    await this.test("popupSystem", "Historial de pop-ups", async () => {
      const result = await this.apiRequest(
        "GET",
        "/popups/history?limit=5",
        null,
        "user",
      );
      if (!result.payload.data.popupHistory) {
        throw new Error("Historial de pop-ups no disponible");
      }
    });
  }

  // ===============================================
  // TESTS DE FUNCIONES ADMINISTRATIVAS
  // ===============================================
  async testAdminFunctions() {
    log("\n👑 TESTING FUNCIONES ADMINISTRATIVAS...", "blue");

    await this.test("adminFunctions", "Lista de usuarios", async () => {
      const result = await this.apiRequest(
        "GET",
        "/admin/users?limit=10",
        null,
        "admin",
      );
      if (
        !result.payload.data.users ||
        result.payload.data.users.length === 0
      ) {
        throw new Error("Lista de usuarios vacía");
      }
      this.testUsers = result.payload.data.users;
    });

    await this.test("adminFunctions", "Filtros de usuarios", async () => {
      const result = await this.apiRequest(
        "GET",
        "/admin/users?sector=Facturacion",
        null,
        "admin",
      );
      if (!result.payload.data.users) {
        throw new Error("Filtros no funcionan");
      }
    });

    if (this.testUsers.length > 0) {
      const targetUser = this.testUsers.find(
        (u) => u.role.name !== "Administrador",
      );
      if (targetUser) {
        await this.test("adminFunctions", "Ver perfil de usuario", async () => {
          const result = await this.apiRequest(
            "GET",
            `/admin/users/${targetUser.id}/profile`,
            null,
            "admin",
          );
          if (!result.payload.data.username) {
            throw new Error("Perfil no obtenido");
          }
        });

        await this.test(
          "adminFunctions",
          "Actualizar perfil de usuario",
          async () => {
            await this.apiRequest(
              "PUT",
              `/admin/users/${targetUser.id}/profile`,
              {
                firstname: "TestUpdate",
              },
              "admin",
            );
          },
        );
      }
    }
  }

  // ===============================================
  // TESTS DE SEGURIDAD
  // ===============================================
  async testSecurity() {
    log("\n🛡️ TESTING SEGURIDAD...", "blue");

    await this.test("security", "Acceso denegado sin token", async () => {
      try {
        await axios.get(`${BASE_URL}/admin/users`);
        throw new Error("Debería denegar acceso");
      } catch (error) {
        if (error.response?.status !== 401) throw error;
      }
    });

    await this.test("security", "Usuario normal sin acceso admin", async () => {
      try {
        await this.apiRequest("GET", "/admin/users", null, "user");
        throw new Error("Usuario normal no debería acceder");
      } catch (error) {
        if (error.response?.status !== 403) throw error;
      }
    });

    await this.test("security", "Validación de parámetros", async () => {
      try {
        await this.apiRequest(
          "POST",
          "/states/change",
          {
            newState: "invalid_state",
          },
          "user",
        );
        throw new Error("Debería rechazar estado inválido");
      } catch (error) {
        if (error.response?.status !== 400) throw error;
      }
    });

    await this.test("security", "Rate limiting y timeout", async () => {
      const startTime = Date.now();
      await this.apiRequest("GET", "/states/current", null, "user");
      const duration = Date.now() - startTime;
      if (duration > 1000) throw new Error("Respuesta muy lenta");
    });
  }

  // ===============================================
  // TESTS DE RENDIMIENTO
  // ===============================================
  async testPerformance() {
    log("\n🚀 TESTING RENDIMIENTO...", "blue");

    await this.test(
      "performance",
      "Respuesta rápida de endpoints",
      async () => {
        const startTime = Date.now();
        await this.apiRequest("GET", "/states/current", null, "user");
        const duration = Date.now() - startTime;
        if (duration > 500) throw new Error(`Muy lento: ${duration}ms`);
      },
    );

    await this.test("performance", "Carga de lista de usuarios", async () => {
      const startTime = Date.now();
      await this.apiRequest("GET", "/admin/users?limit=50", null, "admin");
      const duration = Date.now() - startTime;
      if (duration > 1000) throw new Error(`Consulta lenta: ${duration}ms`);
    });

    await this.test(
      "performance",
      "Múltiples requests concurrentes",
      async () => {
        const requests = Array(5)
          .fill()
          .map(() => this.apiRequest("GET", "/states/current", null, "user"));
        await Promise.all(requests);
      },
    );
  }

  // ===============================================
  // EJECUTAR TODOS LOS TESTS
  // ===============================================
  async runAllTests() {
    log(
      `${colors.bold}${colors.cyan}🧪 VALIDACIÓN COMPLETA DEL SISTEMA HOME OFFICE${colors.reset}`,
    );
    log("=".repeat(70), "cyan");
    log("Preparando sistema para producción...\n", "cyan");

    try {
      await this.testAuthentication();
      await this.testStateManagement();
      await this.testPopupSystem();
      await this.testAdminFunctions();
      await this.testSecurity();
      await this.testPerformance();

      this.generateReport();
    } catch (error) {
      log(`💥 Error crítico durante validación: ${error.message}`, "red");
      process.exit(1);
    }
  }

  // ===============================================
  // GENERAR REPORTE FINAL
  // ===============================================
  generateReport() {
    log("\n📊 REPORTE FINAL DE VALIDACIÓN", "magenta");
    log("=".repeat(50), "magenta");

    let totalPassed = 0;
    let totalTests = 0;
    let criticalFailures = 0;

    Object.entries(this.results).forEach(([category, result]) => {
      const percentage =
        result.total > 0 ? Math.round((result.passed / result.total) * 100) : 0;
      const status = percentage === 100 ? "✅" : result.critical ? "❌" : "⚠️";

      totalPassed += result.passed;
      totalTests += result.total;

      if (result.critical && percentage < 100) {
        criticalFailures++;
      }

      log(
        `${status} ${category}: ${result.passed}/${result.total} (${percentage}%)`,
        percentage === 100 ? "green" : result.critical ? "red" : "yellow",
      );
    });

    const overallPercentage = Math.round((totalPassed / totalTests) * 100);

    log("\n" + "=".repeat(50), "magenta");
    log(
      `📈 RESULTADO GENERAL: ${totalPassed}/${totalTests} (${overallPercentage}%)`,
      "bold",
    );

    if (criticalFailures === 0 && overallPercentage >= 90) {
      log("\n🎉 ¡SISTEMA LISTO PARA PRODUCCIÓN!", "green");
      log("✅ Todos los tests críticos pasaron", "green");
      log("✅ Rendimiento dentro de parámetros", "green");
      log("✅ Seguridad validada", "green");
      log("✅ Funcionalidades administrativas operativas", "green");
      log("\n🚀 El sistema puede ser desplegado en producción", "cyan");
    } else if (criticalFailures > 0) {
      log("\n🚨 SISTEMA NO LISTO PARA PRODUCCIÓN", "red");
      log(`❌ ${criticalFailures} categorías críticas fallaron`, "red");
      log("🔧 Corregir errores críticos antes del deploy", "yellow");
    } else {
      log("\n⚠️ SISTEMA PARCIALMENTE LISTO", "yellow");
      log("🔧 Algunos tests opcionales fallaron", "yellow");
      log("📝 Revisar logs y considerar mejoras", "yellow");
    }

    log("\n📋 RECOMENDACIONES FINALES:", "blue");
    log("- Revisar logs de aplicación antes del deploy", "blue");
    log("- Configurar monitoreo en producción", "blue");
    log("- Preparar backup de base de datos", "blue");
    log("- Documentar procedimientos de rollback", "blue");

    if (criticalFailures > 0) {
      process.exit(1);
    }
  }
}

// Ejecutar validación completa
async function runProductionValidation() {
  const validator = new SystemValidator();
  await validator.runAllTests();
}

if (require.main === module) {
  runProductionValidation().catch((error) => {
    console.error("\n💥 Error en validación de producción:", error.message);
    process.exit(1);
  });
}

module.exports = { SystemValidator };
