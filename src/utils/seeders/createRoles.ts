import { Role } from "../../models";
import { IRole } from "../../interfaces/role.interface";

interface RoleData {
  name: string;
  description: string;
  permissions: string[];
}

const defaultRoles: RoleData[] = [
  {
    name: "Administrador",
    description: "Acceso total al sistema, gestión de usuarios y configuración",
    permissions: ["*"], // Todos los permisos
  },
  {
    name: "Coordinación",
    description:
      "Gestión de pacientes, profesionales y asignación de especialidades",
    permissions: [
      "create_patients",
      "edit_patients",
      "view_patients",
      "create_professionals",
      "edit_professionals",
      "view_professionals",
      "assign_specialties",
      "manage_authorizations",
      "create_budgets",
    ],
  },
  {
    name: "Profesionales",
    description: "Acceso a pacientes asignados y completado de planillas",
    permissions: [
      "view_assigned_patients",
      "complete_forms",
      "digital_signature",
      "view_schedules",
    ],
  },
  {
    name: "Contaduría",
    description: "Gestión de facturación electrónica y auditoría de visitas",
    permissions: [
      "generate_invoices",
      "afip_integration",
      "arba_retentions",
      "agip_retentions",
      "audit_visits",
      "view_financial_reports",
    ],
  },
  {
    name: "Compras",
    description: "Gestión de insumos, equipos y stock",
    permissions: [
      "manage_inventory",
      "create_purchase_orders",
      "manage_suppliers",
      "stock_alerts",
      "view_inventory_reports",
    ],
  },
  {
    name: "Liquidaciones",
    description: "Gestión de liquidaciones, órdenes de pago y transferencias",
    permissions: [
      "process_payroll",
      "create_payment_orders",
      "bank_transfers",
      "view_payroll_reports",
      "manage_employee_payments",
    ],
  },
  // ===== NUEVOS ROLES PARA HOME OFFICE =====
  {
    name: "Coordinador de Sector",
    description:
      "Coordina un sector específico, asigna tareas y supervisa productividad",
    permissions: [
      "view_sector_team",
      "assign_tasks",
      "view_team_productivity",
      "manage_sector_states",
      "create_sector_reports",
    ],
  },
  {
    name: "Facturación",
    description: "Gestión específica de facturación y cobranzas",
    permissions: [
      "manage_billing",
      "create_invoices",
      "track_payments",
      "view_billing_reports",
    ],
  },
  {
    name: "Recursos Humanos",
    description:
      "Gestión de personal, reportes de productividad y viernes flex",
    permissions: [
      "view_all_productivity",
      "manage_flex_friday",
      "view_all_reports",
      "manage_employees",
      "export_reports",
    ],
  },
  {
    name: "Reclamos",
    description: "Gestión y resolución de reclamos y quejas",
    permissions: [
      "manage_complaints",
      "track_resolutions",
      "create_complaint_reports",
    ],
  },
  {
    name: "Recepción",
    description: "Atención al público y gestión de turnos",
    permissions: ["manage_appointments", "customer_service", "view_schedules"],
  },
];

// Mapeo de sectores por rol
export const SECTOR_BY_ROLE: { [key: string]: string } = {
  Administrador: "Administración",
  Coordinación: "Coordinación",
  Profesionales: "Profesionales",
  Contaduría: "Contaduría",
  Compras: "Compras",
  Liquidaciones: "Liquidaciones",
  "Coordinador de Sector": "Variable",
  Facturación: "Facturación",
  "Recursos Humanos": "RRHH",
  Reclamos: "Reclamos",
  Recepción: "Recepción",
};

export const createDefaultRoles = async (
  verbose: boolean = false,
): Promise<void> => {
  try {
    if (verbose) {
      console.log("🚀 Iniciando creación de roles por defecto...\n");
    }

    const createdRoles: any[] = [];
    let newRolesCount = 0;

    for (const roleData of defaultRoles) {
      // Verificar si el rol ya existe
      const existingRole = (await Role.findOne({
        where: { name: roleData.name },
      })) as IRole | null;

      if (existingRole) {
        if (verbose) {
          console.log(
            `⚠️  Rol "${roleData.name}" ya existe con ID: ${existingRole.id}`,
          );
        }
        createdRoles.push(existingRole);
        continue;
      }

      // Crear el rol
      const newRole = (await Role.create({
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        isActive: true,
      })) as any;

      if (verbose) {
        console.log(`✅ Rol "${roleData.name}" creado con ID: ${newRole.id}`);
      }
      createdRoles.push(newRole);
      newRolesCount++;
    }

    // En modo automático (servidor), solo mostrar si se crearon roles nuevos
    if (!verbose && newRolesCount > 0) {
      console.log(`✅ ${newRolesCount} roles nuevos creados automáticamente`);
    }

    if (verbose) {
      console.log("\n🎉 Proceso completado!");
      console.log("\n📋 RESUMEN DE ROLES:");
      console.log("=".repeat(60));

      createdRoles.forEach((role, index) => {
        const sector = SECTOR_BY_ROLE[role.name] || "N/A";
        console.log(`${index + 1}. ${role.name}`);
        console.log(`   ID: ${role.id}`);
        console.log(`   Descripción: ${role.description}`);
        console.log(`   Sector: ${sector}`);
        console.log(`   Activo: ${role.isActive ? "Sí" : "No"}`);
        console.log(
          `   Permisos: ${role.permissions?.length || 0} configurados`,
        );
        console.log("-".repeat(60));
      });

      console.log("\n🔗 PARA TESTING - Copia estos IDs:");
      console.log("=".repeat(40));
      createdRoles.forEach((role) => {
        console.log(`${role.name}: "${role.id}"`);
      });
    }
  } catch (error) {
    console.error("❌ Error creando roles:", error);
    throw error;
  }
};

export const deleteAllRoles = async (): Promise<void> => {
  try {
    console.log("🗑️  Eliminando todos los roles...");

    const deletedCount = await Role.destroy({
      where: {},
      force: true, // Hard delete, ignora paranoid
    });

    console.log(`✅ ${deletedCount} roles eliminados`);
  } catch (error) {
    console.error("❌ Error eliminando roles:", error);
    throw error;
  }
};

export default createDefaultRoles;
