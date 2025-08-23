// =====================================================
// tests/simple-test.js - Test rápido y simple
// =====================================================
const axios = require("axios");

const BASE_URL = "http://localhost:3000/api";

async function quickTest() {
  console.log("🚀 Test rápido del sistema...\n");

  try {
    // 1. Login
    console.log("🔐 Haciendo login...");
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      username: "juan123",
      password: "Password123",
    });

    const token = login.data.payload.data.tokens.accessToken;
    console.log("✅ Login OK\n");

    // Headers para requests autenticados
    const headers = { Authorization: `Bearer ${token}` };

    // 2. Cambiar a activo
    console.log("⚡ Cambiando a activo...");
    await axios.post(
      `${BASE_URL}/states/change`,
      {
        newState: "activo",
        reason: "Test rápido",
      },
      { headers },
    );
    console.log("✅ Activo OK\n");

    // 3. Ver estado
    console.log("📍 Consultando estado actual...");
    const state = await axios.get(`${BASE_URL}/states/current`, { headers });
    console.log(`✅ Estado: ${state.data.payload.data.currentState}\n`);

    // 4. Ver equipo
    console.log("👥 Consultando equipo...");
    const team = await axios.get(`${BASE_URL}/states/team`, { headers });
    console.log(`✅ Equipo: ${team.data.payload.data.totalMembers} miembros\n`);

    // 5. Logout
    console.log("👋 Haciendo logout...");
    const logout = await axios.post(`${BASE_URL}/auth/logout`, {}, { headers });
    console.log("✅ Logout OK\n");

    console.log("🎉 ¡Todo funciona perfectamente!");
  } catch (error) {
    console.error("❌ Error:", error.response?.data?.message || error.message);
  }
}

quickTest();
