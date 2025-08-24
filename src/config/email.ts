// src/config/email.ts
import nodemailer from "nodemailer";
import { EmailType } from "../utils/enums/EmailType";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
  type: EmailType;
  metadata?: {
    userId?: string;
    taskId?: string;
    adminId?: string;
    reason?: string;
  };
}

export async function sendEmail(options: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"Sistema Home Office" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    // Log para auditoría con el tipo de email
    console.log(`📧 [EMAIL SENT] Tipo: ${options.type}`);
    console.log(`   Para: ${options.to}`);
    console.log(`   Asunto: ${options.subject}`);
    if (options.metadata?.userId) {
      console.log(`   Usuario ID: ${options.metadata.userId}`);
    }
    if (options.metadata?.adminId) {
      console.log(`   Admin ID: ${options.metadata.adminId}`);
    }
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    return info;
  } catch (error) {
    console.error(`❌ [EMAIL ERROR] Tipo: ${options.type}, Error:`, error);
    throw error;
  }
}

// Funciones helper para diferentes tipos de email
export function createPasswordResetEmail(
  email: string,
  token: string,
  userId: string,
): EmailOptions {
  return {
    to: email,
    subject: "Recuperación de contraseña - Sistema Home Office",
    html: `
      <h2>Recuperación de contraseña</h2>
      <p>Has solicitado restablecer tu contraseña.</p>
      <p>Tu código de recuperación es: <strong>${token}</strong></p>
      <p>Este código expira en 30 minutos.</p>
      <p>Si no solicitaste este cambio, ignora este email.</p>
    `,
    type: EmailType.PASSWORD_RESET,
    metadata: { userId },
  };
}

export function createTaskAssignedEmail(
  email: string,
  taskTitle: string,
  assignedBy: string,
  dueDate: Date | null,
  taskId: string,
  userId: string,
): EmailOptions {
  return {
    to: email,
    subject: `Nueva tarea asignada: ${taskTitle}`,
    html: `
      <h2>Nueva tarea asignada</h2>
      <p><strong>Tarea:</strong> ${taskTitle}</p>
      <p><strong>Asignada por:</strong> ${assignedBy}</p>
      ${dueDate ? `<p><strong>Fecha límite:</strong> ${dueDate.toLocaleDateString()}</p>` : ""}
      <p>Por favor, revisa los detalles en el sistema.</p>
    `,
    type: EmailType.TASK_ASSIGNED,
    metadata: { userId, taskId },
  };
}

export function createAccountStatusEmail(
  email: string,
  isActivated: boolean,
  reason: string,
  adminUsername: string,
  userId: string,
  adminId: string,
): EmailOptions {
  const action = isActivated ? "activada" : "desactivada";
  const type = isActivated
    ? EmailType.ACCOUNT_ACTIVATED
    : EmailType.ACCOUNT_DEACTIVATED;

  return {
    to: email,
    subject: `Cuenta ${action} - Sistema Home Office`,
    html: `
      <h2>Estado de cuenta actualizado</h2>
      <p>Tu cuenta ha sido <strong>${action}</strong> por un administrador.</p>
      <p><strong>Administrador:</strong> ${adminUsername}</p>
      <p><strong>Razón:</strong> ${reason}</p>
      ${!isActivated ? "<p>Si tienes dudas, contacta con el administrador.</p>" : "<p>Ya puedes acceder al sistema nuevamente.</p>"}
    `,
    type,
    metadata: { userId, adminId, reason },
  };
}

export default transporter;
