const { Role, Permission, UserRole, RolePermission, User } = require('../models');

class PermissionService {
  static async getUserRoles(userId) {
    const user = await User.findByPk(userId, {
      include: [Role]
    });
    if (!user) return [];
    return user.Roles || [];
  }

  static async getUserPermissions(userId) {
    const userRoles = await this.getUserRoles(userId);
    const roleIds = userRoles.map(r => r.id);
    
    const permissions = [];
    for (const roleId of roleIds) {
      const role = await Role.findByPk(roleId, { include: [Permission] });
      if (role && role.Permissions) {
        permissions.push(...role.Permissions);
      }
    }
    
    return [...new Map(permissions.map(p => [p.code, p])).values()];
  }

  static async hasPermission(userId, permissionCode) {
    const permissions = await this.getUserPermissions(userId);
    return permissions.some(p => p.code === permissionCode);
  }

  static async getUserRoleDataScope(userId) {
    const roles = await this.getUserRoles(userId);
    if (roles.some(r => r.code === 'admin')) {
      return 'global';
    }
    const maxLevelRole = roles.reduce((max, r) => r.level > max.level ? r : max, roles[0]);
    return maxLevelRole?.dataScope || 'self';
  }

  static async getUserSubordinates(userId, includeSelf = false) {
    const subordinates = [];
    const visited = new Set();
    
    const findSubordinates = async (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      if (includeSelf) {
        subordinates.push(id);
      }
      
      const subs = await User.findAll({ where: { managerId: id } });
      for (const sub of subs) {
        subordinates.push(sub.id);
        await findSubordinates(sub.id);
      }
    };
    
    await findSubordinates(userId);
    return subordinates;
  }

  static async getUserConsultantIds(userId) {
    const dataScope = await this.getUserRoleDataScope(userId);
    
    if (dataScope === 'global') {
      const users = await User.findAll({ where: { isActive: true } });
      return users.map(u => u.id);
    }
    
    if (dataScope === 'subordinate') {
      return await this.getUserSubordinates(userId, true);
    }
    
    return [userId];
  }

  static async getMenuPermissions(userId) {
    const permissions = await this.getUserPermissions(userId);
    return permissions.filter(p => p.type === 'menu');
  }

  static async getButtonPermissions(userId) {
    const permissions = await this.getUserPermissions(userId);
    return permissions.filter(p => p.type === 'button');
  }

  static async getRolePermissions(roleId) {
    const role = await Role.findByPk(roleId, { include: [Permission] });
    if (!role) return [];
    return role.Permissions || [];
  }

  static async assignPermissionsToRole(roleId, permissionIds) {
    await RolePermission.destroy({ where: { roleId } });
    
    for (const permissionId of permissionIds) {
      await RolePermission.create({ roleId, permissionId });
    }
  }

  static async assignRolesToUser(userId, roleIds) {
    await UserRole.destroy({ where: { userId } });
    
    for (const roleId of roleIds) {
      await UserRole.create({ userId, roleId });
    }
  }
}

module.exports = PermissionService;