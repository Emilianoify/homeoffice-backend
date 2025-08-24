// =====================================================
// tests/simple-admin-test.js - Test rápido de admin
// =====================================================
const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function quickAdminTest() {
  console.log("👑 Test rápido del sistema administrativo...\n");

  try {
    // 1. Login como admin
    console.log("🔐 Login como administrador...");
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      username: "admin001",
      password: "MiPassword123",
    });

    const token = login.data.payload.data.tokens.accessToken;
    const headers = { Authorization: `Bearer ${token}` };
    console.log("✅ Login admin OK\n");

    // 2. Listar usuarios
    console.log("📋 Listando usuarios...");
    const users = await axios.get(`${BASE_URL}/admin/users?limit=5`, {
      headers,
    });
    const userData = users.data.payload.data;
    console.log(`✅ ${userData.pagination.totalUsers} usuarios encontrados`);
    console.log(`   - ${userData.statistics.activeUsers} activos`);
    console.log(`   - ${userData.statistics.inSessionUsers} en sesión\n`);

    // 3. Ver perfil de un usuario específico
    if (userData.users.length > 0) {
      const testUser = userData.users.find(
        (u) => u.role.name !== "Administrador",
      );
      if (testUser) {
        console.log(`👤 Consultando perfil de ${testUser.username}...`);
        const profile = await axios.get(
          `${BASE_URL}/admin/users/${testUser.id}/profile`,
          { headers },
        );
        console.log(
          `✅ Perfil obtenido: ${profile.data.payload.data.firstname} ${profile.data.payload.data.lastname}`,
        );
        console.log(`   - Sector: ${profile.data.payload.data.sector}`);
        console.log(
          `   - Estado: ${profile.data.payload.data.isActive ? "Activo" : "Inactivo"}\n`,
        );
      }
    }

    // 4. Test de filtros
    console.log("🔍 Testing filtros...");
    const filtered = await axios.get(
      `${BASE_URL}/admin/users?sector=Facturacion&status=active`,
      { headers },
    );
    console.log(
      `✅ Filtros funcionando: ${filtered.data.payload.data.users.length} usuarios de Facturación\n`,
    );

    // 5. Test de seguridad (sin permisos)
    console.log("🔒 Testing seguridad...");
    try {
      await axios.get(`${BASE_URL}/admin/users`); // Sin token
      console.log("❌ Fallo de seguridad!");
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("✅ Seguridad OK - Acceso denegado sin token\n");
      }
    }

    console.log("🎉 ¡Sistema administrativo funcionando perfectamente!");
  } catch (error) {
    console.error("❌ Error:", error.response?.data?.message || error.message);
  }
}

quickAdminTest();
