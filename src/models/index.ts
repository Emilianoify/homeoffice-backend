import UserModel from "./user.model";
import RoleModel from "./role.model";
import UserSessionModel from "./userSession.model";
import UserStateModel from "./userState.model";
import PopupResponseModel from "./popupResponse.model";
import TaskModel from "./task.model";
import TaskFileModel from "./taskFile.model";
import DailyReportModel from "./dailyReport.model";
import AuditLogModel from "./auditLog.model";

// ===== RELACIONES EXISTENTES =====
RoleModel.hasMany(UserModel, {
  foreignKey: "roleId",
  as: "users",
});

UserModel.belongsTo(RoleModel, {
  foreignKey: "roleId",
  as: "role",
});

// ===== RELACIONES DE USER SESSIONS =====
UserModel.hasMany(UserSessionModel, {
  foreignKey: "userId",
  as: "sessions",
});

UserSessionModel.belongsTo(UserModel, {
  foreignKey: "userId",
  as: "user",
});

// ===== RELACIONES DE USER STATES =====
UserModel.hasMany(UserStateModel, {
  foreignKey: "userId",
  as: "states",
});

UserStateModel.belongsTo(UserModel, {
  foreignKey: "userId",
  as: "user",
});

UserSessionModel.hasMany(UserStateModel, {
  foreignKey: "sessionId",
  as: "stateChanges",
});

UserStateModel.belongsTo(UserSessionModel, {
  foreignKey: "sessionId",
  as: "session",
});

// ===== RELACIONES DE POPUP RESPONSES =====
UserModel.hasMany(PopupResponseModel, {
  foreignKey: "userId",
  as: "popupResponses",
});

PopupResponseModel.belongsTo(UserModel, {
  foreignKey: "userId",
  as: "user",
});

UserSessionModel.hasMany(PopupResponseModel, {
  foreignKey: "sessionId",
  as: "popups",
});

PopupResponseModel.belongsTo(UserSessionModel, {
  foreignKey: "sessionId",
  as: "session",
});

PopupResponseModel.hasOne(PopupResponseModel, {
  foreignKey: "previousPopupId",
  as: "secondChance",
});

PopupResponseModel.belongsTo(PopupResponseModel, {
  foreignKey: "previousPopupId",
  as: "firstAttempt",
});

// ===== RELACIONES DE TASKS =====
UserModel.hasMany(TaskModel, {
  foreignKey: "assignedTo",
  as: "tasksAssigned",
});

TaskModel.belongsTo(UserModel, {
  foreignKey: "assignedTo",
  as: "assignee",
});

// Usuario que asignó (coordinador)
UserModel.hasMany(TaskModel, {
  foreignKey: "assignedBy",
  as: "tasksCreated",
});

TaskModel.belongsTo(UserModel, {
  foreignKey: "assignedBy",
  as: "assigner",
});

// ===== RELACIONES DE TASK FILES =====
TaskModel.hasMany(TaskFileModel, {
  foreignKey: "taskId",
  as: "files",
});

TaskFileModel.belongsTo(TaskModel, {
  foreignKey: "taskId",
  as: "task",
});

UserModel.hasMany(TaskFileModel, {
  foreignKey: "uploadedBy",
  as: "uploadedFiles",
});

TaskFileModel.belongsTo(UserModel, {
  foreignKey: "uploadedBy",
  as: "uploader",
});

// ===== RELACIONES DE DAILY REPORTS =====
UserModel.hasMany(DailyReportModel, {
  foreignKey: "userId",
  as: "dailyReports",
});

DailyReportModel.belongsTo(UserModel, {
  foreignKey: "userId",
  as: "user",
});

// ===== RELACIONES DE AUDITORÍA =====

AuditLogModel.belongsTo(UserModel, {
  foreignKey: "adminUserId",
  as: "adminUser",
  constraints: false,
});

AuditLogModel.belongsTo(UserModel, {
  foreignKey: "targetUserId",
  as: "targetUser",
  constraints: false,
});

// ===== RELACIONES INVERSAS DE AUDITORÍA =====

UserModel.hasMany(AuditLogModel, {
  foreignKey: "adminUserId",
  as: "adminActions",
  constraints: false,
});

UserModel.hasMany(AuditLogModel, {
  foreignKey: "targetUserId",
  as: "auditHistory",
  constraints: false,
});

// ===== EXPORTACIONES =====
export {
  UserModel as User,
  RoleModel as Role,
  UserSessionModel as UserSession,
  UserStateModel,
  PopupResponseModel as PopupResponse,
  TaskModel as Task,
  TaskFileModel as TaskFile,
  DailyReportModel as DailyReport,
  AuditLogModel,
};

export default {
  User: UserModel,
  Role: RoleModel,
  UserSession: UserSessionModel,
  UserStateModel,
  PopupResponse: PopupResponseModel,
  Task: TaskModel,
  TaskFile: TaskFileModel,
  DailyReport: DailyReportModel,
  AuditLogModel,
};
