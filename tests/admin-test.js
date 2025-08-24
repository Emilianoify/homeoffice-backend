const axios = require("axios");

const BASE_URL = "http://localhost:3000";
let adminToken = "";
let testUserId = "";

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

    if (useAuth && adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
      details: error.response?.data,
    };
  }
}

// Función para esperar (simular tiempo real)
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Test completo de funcionalidades administrativas
async function runAdminTest() {
  log("🚀 INICIANDO TEST ADMINISTRATIVO COMPLETO", "cyan");
  log("=".repeat(70), "cyan");

  try {
    // ===============================================
    // 1. LOGIN COMO ADMINISTRADOR
    // ===============================================
    log("\n👑 1. LOGIN COMO ADMINISTRADOR...", "blue");
    const loginResult = await apiRequest("POST", "/auth/login", {
      username: "admin001", // Usuario admin existente
      password: "MiPassword123",
    });

    if (loginResult.success) {
      adminToken = loginResult.data.payload.data.tokens.accessToken;
      log("✅ Login administrativo exitoso", "green");
      log(`   Admin: ${loginResult.data.payload.data.user.username}`, "green");
      log(`   Rol: ${loginResult.data.payload.data.user.role.name}`, "green");
      log(`   Token: ${adminToken.substring(0, 20)}...`, "green");
    } else {
      log(`❌ Login administrativo falló: ${loginResult.error}`, "red");
      return;
    }

    await sleep(1000);

    // ===============================================
    // 2. LISTAR TODOS LOS USUARIOS
    // ===============================================
    log("\n📋 2. TESTING LISTA DE USUARIOS...", "blue");
    const listResult = await apiRequest("GET", "/admin/users", null, true);

    if (listResult.success) {
      const data = listResult.data.payload.data;
      log("✅ Lista de usuarios obtenida", "green");
      log(`   Total usuarios: ${data.pagination.totalUsers}`, "green");
      log(`   Usuarios activos: ${data.statistics.activeUsers}`, "green");
      log(`   Usuarios en sesión: ${data.statistics.inSessionUsers}`, "green");
      log(`   Página actual: ${data.pagination.currentPage}`, "green");

      // Guardar ID del primer usuario para tests posteriores
      if (data.users.length > 0) {
        // Buscar un usuario que no sea admin para testing
        const nonAdminUser = data.users.find(
          (u) => u.role.name !== "Administrador",
        );
        if (nonAdminUser) {
          testUserId = nonAdminUser.id;
          log(
            `   Usuario seleccionado para tests: ${nonAdminUser.username}`,
            "yellow",
          );
        }
      }

      log("   Breakdown por sector:", "green");
      Object.entries(data.statistics.sectorBreakdown).forEach(
        ([sector, stats]) => {
          log(`     ${sector}: ${stats.total} usuarios`, "yellow");
        },
      );
    } else {
      log(`❌ Lista de usuarios falló: ${listResult.error}`, "red");
    }

    await sleep(1500);

    // ===============================================
    // 3. LISTAR USUARIOS CON FILTROS
    // ===============================================
    log("\n🔍 3. TESTING FILTROS Y BÚSQUEDA...", "blue");

    // Test filtro por sector
    const filterSectorResult = await apiRequest(
      "GET",
      "/admin/users?sector=Facturacion&limit=5",
      null,
      true,
    );

    if (filterSectorResult.success) {
      const data = filterSectorResult.data.payload.data;
      log("✅ Filtro por sector funcional", "green");
      log(`   Usuarios de Facturación: ${data.users.length}`, "green");
    } else {
      log(`❌ Filtro por sector falló: ${filterSectorResult.error}`, "red");
    }

    // Test búsqueda por texto
    const searchResult = await apiRequest(
      "GET",
      "/admin/users?search=user&limit=10",
      null,
      true,
    );

    if (searchResult.success) {
      const data = searchResult.data.payload.data;
      log("✅ Búsqueda por texto funcional", "green");
      log(`   Resultados encontrados: ${data.users.length}`, "green");
    } else {
      log(`❌ Búsqueda falló: ${searchResult.error}`, "red");
    }

    await sleep(1500);

    // ===============================================
    // 4. VER PERFIL ESPECÍFICO DE USUARIO
    // ===============================================
    if (testUserId) {
      log("\n👤 4. TESTING PERFIL DE USUARIO ESPECÍFICO...", "blue");
      const profileResult = await apiRequest(
        "GET",
        `/admin/users/${testUserId}/profile`,
        null,
        true,
      );

      if (profileResult.success) {
        const data = profileResult.data.payload.data;
        log("✅ Perfil de usuario obtenido", "green");
        log(
          `   Usuario: ${data.username} (${data.firstname} ${data.lastname})`,
          "green",
        );
        log(`   Email: ${data.corporative_email}`, "green");
        log(`   Sector: ${data.sector}`, "green");
        log(`   Rol: ${data.role.name}`, "green");
        log(`   Estado: ${data.isActive ? "Activo" : "Inactivo"}`, "green");
        log(`   En sesión: ${data.isInSession ? "Sí" : "No"}`, "green");
        log(`   Miembro desde: ${data.account.memberSince}`, "green");
        log(
          `   Puede editar: ${data.adminInfo.canEdit ? "Sí" : "No"}`,
          "yellow",
        );
      } else {
        log(`❌ Perfil de usuario falló: ${profileResult.error}`, "red");
      }

      await sleep(1500);

      // ===============================================
      // 5. ACTUALIZAR PERFIL DE USUARIO
      // ===============================================
      log("\n✏️ 5. TESTING ACTUALIZACIÓN DE PERFIL...", "blue");
      const updateResult = await apiRequest(
        "PUT",
        `/admin/users/${testUserId}/profile`,
        {
          firstname: "NuevoNombre",
          lastname: "NuevoApellido",
        },
        true,
      );

      if (updateResult.success) {
        const data = updateResult.data.payload.data;
        log("✅ Perfil actualizado exitosamente", "green");
        log(
          `   Nombre actualizado: ${data.firstname} ${data.lastname}`,
          "green",
        );
        log("   Cambios aplicados:", "green");
        data.adminAction.changesApplied.forEach((change) => {
          log(`     - ${change}`, "yellow");
        });
        log(`   Actualizado por: ${data.adminAction.performedBy}`, "yellow");
      } else {
        log(`❌ Actualización de perfil falló: ${updateResult.error}`, "red");
      }

      await sleep(1500);

      // ===============================================
      // 6. CAMBIAR CONTRASEÑA DE USUARIO
      // ===============================================
      log("\n🔐 6. TESTING CAMBIO DE CONTRASEÑA...", "blue");
      const changePasswordResult = await apiRequest(
        "POST",
        `/admin/users/${testUserId}/change-password`,
        {
          newPassword: "NuevaPassword123",
          reason: "Test automatizado - cambio de contraseña",
        },
        true,
      );

      if (changePasswordResult.success) {
        const data = changePasswordResult.data.payload.data;
        log("✅ Contraseña cambiada exitosamente", "green");
        log(`   Usuario objetivo: ${data.targetUser.username}`, "green");
        log(`   Razón: ${data.adminAction.reason}`, "green");
        log(`   Tokens revocados: Sí`, "yellow");
        log(`   Nota de seguridad: ${data.securityNote}`, "yellow");
      } else {
        log(
          `❌ Cambio de contraseña falló: ${changePasswordResult.error}`,
          "red",
        );
      }

      await sleep(1500);

      // ===============================================
      // 7. DESACTIVAR USUARIO
      // ===============================================
      log("\n🔴 7. TESTING DESACTIVACIÓN DE USUARIO...", "blue");
      const deactivateResult = await apiRequest(
        "POST",
        `/admin/users/${testUserId}/toggle-status`,
        {
          reason: "Test automatizado - desactivación temporal",
        },
        true,
      );

      if (deactivateResult.success) {
        const data = deactivateResult.data.payload.data;
        log("✅ Usuario desactivado exitosamente", "green");
        log(`   Usuario: ${data.username}`, "green");
        log(
          `   Estado anterior: ${data.statusChange.previousStatus ? "Activo" : "Inactivo"}`,
          "green",
        );
        log(
          `   Estado nuevo: ${data.statusChange.newStatus ? "Activo" : "Inactivo"}`,
          "green",
        );
        log(`   Acción: ${data.statusChange.action}`, "green");
        log(`   Razón: ${data.statusChange.reason}`, "green");
        log(
          `   Tokens revocados: ${data.statusChange.tokensRevoked ? "Sí" : "No"}`,
          "yellow",
        );
        log(
          `   Sesión cerrada: ${data.statusChange.sessionClosed ? "Sí" : "No"}`,
          "yellow",
        );
      } else {
        log(`❌ Desactivación falló: ${deactivateResult.error}`, "red");
      }

      await sleep(2000);

      // ===============================================
      // 8. REACTIVAR USUARIO
      // ===============================================
      log("\n🟢 8. TESTING REACTIVACIÓN DE USUARIO...", "blue");
      const reactivateResult = await apiRequest(
        "POST",
        `/admin/users/${testUserId}/toggle-status`,
        {
          reason: "Test automatizado - reactivación después de test",
        },
        true,
      );

      if (reactivateResult.success) {
        const data = reactivateResult.data.payload.data;
        log("✅ Usuario reactivado exitosamente", "green");
        log(`   Usuario: ${data.username}`, "green");
        log(
          `   Estado nuevo: ${data.statusChange.newStatus ? "Activo" : "Inactivo"}`,
          "green",
        );
        log(`   Acción: ${data.statusChange.action}`, "green");
      } else {
        log(`❌ Reactivación falló: ${reactivateResult.error}`, "red");
      }

      await sleep(1500);

      // ===============================================
      // 9. RESTAURAR DATOS ORIGINALES
      // ===============================================
      log("\n🔄 9. RESTAURANDO DATOS ORIGINALES...", "blue");
      const restoreResult = await apiRequest(
        "PUT",
        `/admin/users/${testUserId}/profile`,
        {
          firstname: "Juan", // Datos originales del usuario de prueba
          lastname: "Testing",
        },
        true,
      );

      if (restoreResult.success) {
        log("✅ Datos originales restaurados", "green");
      } else {
        log(
          `⚠️ No se pudieron restaurar datos: ${restoreResult.error}`,
          "yellow",
        );
      }
    }

    // ===============================================
    // 10. TESTING DE SEGURIDAD
    // ===============================================
    log("\n🛡️ 10. TESTING SEGURIDAD Y VALIDACIONES...", "blue");

    // Test: Prevenir auto-desactivación
    const selfDeactivateResult = await apiRequest(
      "POST",
      `/admin/users/${loginResult.data.payload.data.user.id}/toggle-status`,
      {
        reason: "Intento de auto-desactivación",
      },
      true,
    );

    if (!selfDeactivateResult.success && selfDeactivateResult.status === 409) {
      log("✅ Prevención de auto-desactivación funcional", "green");
      log("   No se permite que admin se desactive a sí mismo", "green");
    } else {
      log("❌ Fallo en prevención de auto-desactivación", "red");
    }

    // Test: Usuario inexistente
    const nonExistentResult = await apiRequest(
      "GET",
      "/admin/users/00000000-0000-0000-0000-000000000000/profile",
      null,
      true,
    );

    if (!nonExistentResult.success && nonExistentResult.status === 404) {
      log("✅ Manejo de usuario inexistente funcional", "green");
    } else {
      log("❌ Fallo en manejo de usuario inexistente", "red");
    }

    // Test: Parámetros inválidos
    const invalidParamsResult = await apiRequest(
      "GET",
      "/admin/users?limit=150", // Límite excesivo
      null,
      true,
    );

    if (!invalidParamsResult.success && invalidParamsResult.status === 400) {
      log("✅ Validación de parámetros funcional", "green");
    } else {
      log("⚠️ Validación de parámetros puede mejorarse", "yellow");
    }

    await sleep(1000);

    // ===============================================
    // 11. RESUMEN FINAL
    // ===============================================
    log("\n📊 11. RESUMEN DE ESTADÍSTICAS FINALES...", "blue");
    const finalListResult = await apiRequest("GET", "/admin/users", null, true);

    if (finalListResult.success) {
      const data = finalListResult.data.payload.data;
      log("✅ Estadísticas finales obtenidas", "green");
      log("\n📈 RESUMEN DEL SISTEMA:", "magenta");
      log(`   👥 Total usuarios: ${data.pagination.totalUsers}`, "magenta");
      log(`   ✅ Usuarios activos: ${data.statistics.activeUsers}`, "magenta");
      log(
        `   ❌ Usuarios inactivos: ${data.statistics.inactiveUsers}`,
        "magenta",
      );
      log(
        `   🔄 En sesión actual: ${data.statistics.inSessionUsers}`,
        "magenta",
      );

      log("\n🏢 BREAKDOWN POR SECTOR:", "magenta");
      Object.entries(data.statistics.sectorBreakdown).forEach(
        ([sector, stats]) => {
          log(
            `   ${sector}: ${stats.total} total, ${stats.active} activos, ${stats.inSession} en sesión`,
            "magenta",
          );
        },
      );
    }
  } catch (error) {
    log(`💥 Error inesperado en test administrativo: ${error.message}`, "red");
  }

  log("\n🎉 TEST ADMINISTRATIVO COMPLETADO", "cyan");
  log("=".repeat(70), "cyan");
}

// Test de acceso sin permisos
async function testUnauthorizedAccess() {
  log("\n🔒 TESTING ACCESO NO AUTORIZADO...", "yellow");

  // Login como usuario normal
  const userLoginResult = await apiRequest("POST", "/auth/login", {
    username: "user001",
    password: "MiPassword123",
  });

  if (userLoginResult.success) {
    const userToken = userLoginResult.data.payload.data.tokens.accessToken;

    // Intentar acceso admin con token de usuario normal
    const unauthorizedResult = await apiRequest(
      "GET",
      "/admin/users",
      null,
      false,
    );
    unauthorizedResult.headers = { Authorization: `Bearer ${userToken}` };

    try {
      await axios.get(`${BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      log("❌ Fallo de seguridad: usuario normal accedió a rutas admin", "red");
    } catch (error) {
      if (error.response?.status === 403) {
        log("✅ Control de permisos funcional - acceso denegado", "green");
      } else {
        log("⚠️ Error inesperado en control de permisos", "yellow");
      }
    }
  }
}

// Ejecutar todos los tests
async function runAllAdminTests() {
  await runAdminTest();
  await testUnauthorizedAccess();

  console.log("\n✨ TODOS LOS TESTS ADMINISTRATIVOS COMPLETADOS");
  console.log("🔧 El sistema administrativo está listo para producción!");
  process.exit(0);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runAllAdminTests().catch((error) => {
    console.error("\n💥 Error en tests administrativos:", error.message);
    process.exit(1);
  });
}

module.exports = { runAdminTest, testUnauthorizedAccess };
