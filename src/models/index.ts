import User from "./user.model";
import Role from "./role.model";
import UserSession from "./userSession.model";
import UserStateModel from "./userState.model";
import PopupResponse from "./popupResponse.model";
import Task from "./task.model";
import TaskFile from "./taskFile.model";
import DailyReport from "./dailyReport.model";

// ===== RELACIONES EXISTENTES =====
Role.hasMany(User, {
  foreignKey: "roleId",
  as: "users",
});

User.belongsTo(Role, {
  foreignKey: "roleId",
  as: "role",
});

// ===== RELACIONES DE USER SESSIONS =====
User.hasMany(UserSession, {
  foreignKey: "userId",
  as: "sessions",
});

UserSession.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// ===== RELACIONES DE USER STATES =====
User.hasMany(UserStateModel, {
  foreignKey: "userId",
  as: "states",
});

UserStateModel.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

UserSession.hasMany(UserStateModel, {
  foreignKey: "sessionId",
  as: "stateChanges",
});

UserStateModel.belongsTo(UserSession, {
  foreignKey: "sessionId",
  as: "session",
});

// ===== RELACIONES DE POPUP RESPONSES =====
User.hasMany(PopupResponse, {
  foreignKey: "userId",
  as: "popupResponses",
});

PopupResponse.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

UserSession.hasMany(PopupResponse, {
  foreignKey: "sessionId",
  as: "popups",
});

PopupResponse.belongsTo(UserSession, {
  foreignKey: "sessionId",
  as: "session",
});

// Auto-relación para segundas oportunidades
PopupResponse.hasOne(PopupResponse, {
  foreignKey: "previousPopupId",
  as: "secondChance",
});

PopupResponse.belongsTo(PopupResponse, {
  foreignKey: "previousPopupId",
  as: "firstAttempt",
});

// ===== RELACIONES DE TASKS =====
// Usuario asignado (quien debe hacer la tarea)
User.hasMany(Task, {
  foreignKey: "assignedTo",
  as: "tasksAssigned",
});

Task.belongsTo(User, {
  foreignKey: "assignedTo",
  as: "assignee",
});

// Usuario que asignó (coordinador)
User.hasMany(Task, {
  foreignKey: "assignedBy",
  as: "tasksCreated",
});

Task.belongsTo(User, {
  foreignKey: "assignedBy",
  as: "assigner",
});

// ===== RELACIONES DE TASK FILES =====
Task.hasMany(TaskFile, {
  foreignKey: "taskId",
  as: "files",
});

TaskFile.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
});

User.hasMany(TaskFile, {
  foreignKey: "uploadedBy",
  as: "uploadedFiles",
});

TaskFile.belongsTo(User, {
  foreignKey: "uploadedBy",
  as: "uploader",
});

// ===== RELACIONES DE DAILY REPORTS =====
User.hasMany(DailyReport, {
  foreignKey: "userId",
  as: "dailyReports",
});

DailyReport.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// ===== EXPORTACIONES =====
export {
  User,
  Role,
  UserSession,
  UserStateModel,
  PopupResponse,
  Task,
  TaskFile,
  DailyReport,
};

export default {
  User,
  Role,
  UserSession,
  UserStateModel,
  PopupResponse,
  Task,
  TaskFile,
  DailyReport,
};
