/**
 * Role-based access middleware factory.
 * Usage: requireRole(ROLES.SUPERVISOR, ROLES.MANAGER)
 */
const requireRole = (...allowedRoleIds) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (!allowedRoleIds.includes(req.user.role_id)) {
    return res.status(403).json({
      error: `Access denied. Required role(s): ${allowedRoleIds.join(', ')}. Your role: ${req.user.role_id}`
    });
  }
  next();
};

module.exports = requireRole;
