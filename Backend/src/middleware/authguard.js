const jwt = require("jsonwebtoken");

const authGuard = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Obtener el token del encabezado

  if (!token) {
    return res.status(401).json({ message: "Acceso denegado: no se proporcionó un token." });
  }

  // Verifica que la clave secreta esté configurada correctamente
  if (!"1234") {
    return res.status(500).json({ message: "Error en el servidor: clave secreta no configurada." });
  }

  try {
    const decoded = jwt.verify(token, "1234"); // Validar el token
    req.user = decoded; // Adjuntar información del usuario al objeto `req`
    next(); // Continuar con la siguiente función
  } catch (err) {
    return res.status(403).json({ message: "Token inválido o expirado." });
  }
};

module.exports = authGuard;
