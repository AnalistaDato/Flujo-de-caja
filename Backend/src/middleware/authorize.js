const authorize = (...allowedRoles) => {
    return (req, res, next) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "Acceso denegado: No tienes permisos." });
      }
      next();
    };
  };
  
  module.exports = authorize;
  