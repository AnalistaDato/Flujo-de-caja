const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../db"); // Conexión a la BD
require("dotenv").config();

const SECRET_KEY = process.env.JWT_SECRET;

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Buscar el usuario en la base de datos
    const [results] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (results.length === 0) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    const user = results[0];

    // Verificar si el usuario está inactivo
    if (user.estado === "I") {
      return res.status(403).json({ message: "Usuario inactivo" });
    }

    // Verificar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // Verificar si el usuario tiene un rol asignado
    if (!user.rol) {
      return res
        .status(403)
        .json({ message: "Acceso denegado: Usuario sin rol asignado" });
    }

    // Generar un token JWT seguro
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.rol,
        estado: user.estado,
      },
      SECRET_KEY,
      { expiresIn: "1h" } // Expira en 1 hora
    );

    // Enviar el token como respuesta
    return res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error en el servidor" });
  }
});

module.exports = router;
