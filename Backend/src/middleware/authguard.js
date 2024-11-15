const jwt = require("jsonwebtoken");

const authGuard = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Obtener el token del encabezado

  if (!token) {
    return res.status(401).json({ message: "Acceso denegado: no se proporcionó un token." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Validar el token
    req.user = decoded; // Adjuntar información del usuario al objeto `req`
    next(); // Continuar con la siguiente función
  } catch (err) {
    return res.status(403).json({ message: "Token inválido o expirado." });
  }
};

module.exports = authGuard;