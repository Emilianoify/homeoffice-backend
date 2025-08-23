import User from "./user.model";
import Role from "./role.model";

Role.hasMany(User, {
  foreignKey: "roleId",
  as: "users",
});

User.belongsTo(Role, {
  foreignKey: "roleId",
  as: "role",
});

export { User, Role };

export default {
  User,
  Role,
};
