const PermissionService = require('../services/PermissionService');

const dataPermission = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const consultantIds = await PermissionService.getUserConsultantIds(userId);
    req.consultantIds = consultantIds;
    
    const dataScope = await PermissionService.getUserRoleDataScope(userId);
    req.dataScope = dataScope;
    
    next();
  } catch (error) {
    console.error('Data permission middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = dataPermission;