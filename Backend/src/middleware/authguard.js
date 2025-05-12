const jwt = require("jsonwebtoken");

const authGuard = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    // Validar que el encabezado de autorización esté presente y bien formado
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({
          message: "Acceso denegado: No se proporcionó un token válido.",
        });
    }

    const token = authHeader.split(" ")[1]; // Obtener el token

    // Obtener la clave secreta desde variables de entorno
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      console.error("Error en configuración: JWT_SECRET no está definido.");
      return res
        .status(500)
        .json({
          message: "Error en el servidor: clave secreta no configurada.",
        });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, secretKey);

    // Validar si el token contiene el rol necesario
    if (!decoded.role) {
      return res
        .status(403)
        .json({ message: "Acceso denegado: No tienes permisos suficientes." });
    }

    req.user = decoded; // Adjuntar la info del usuario al request
    next(); // Continuar con la siguiente función
  } catch (err) {
    console.error("Error en authGuard:", err);

    if (err.name === "TokenExpiredError") {
      return res
        .status(403)
        .json({ message: "Token expirado, inicia sesión nuevamente." });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Token inválido." });
    } else {
      return res.status(403).json({ message: "Acceso denegado." });
    }
  }
};

module.exports = authGuard;
