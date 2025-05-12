const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const db = require("../db");
const router = express.Router();


router.post(
  "/register",
  [
    body("username").notEmpty().withMessage("El usuario es obligatorio"),
    body("password").isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres"),
    body("email").isEmail().withMessage("El email no es válido"),
    body("rol").notEmpty().withMessage("El rol es obligatorio"),
    body("estado").optional().isIn(['A','I']).withMessage("El estado debe ser 'A' o 'I'")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, email, rol, estado = 'I' } = req.body; 

    try {
      // Verificar si el usuario ya existe
      const [existingUser] = await db.execute(
        "SELECT * FROM users WHERE username = ? OR email = ?",
        [username, email]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({ message: "El usuario o email ya están en uso" });
      }

      // Hashear la contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insertar el nuevo usuario
      await db.execute(
        "INSERT INTO users (username, password, email, rol, estado) VALUES (?, ?, ?, ?, ?)",
        [username, hashedPassword, email, rol, estado]
      );

      res.status(201).json({ message: "Usuario registrado exitosamente" });
    } catch (error) {
      console.error("Error en el registro:", error);
      res.status(500).json({ message: "Error en el servidor" });
    }
  }
);

module.exports = router;
