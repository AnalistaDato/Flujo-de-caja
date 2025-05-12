const express = require("express");
const router = express.Router();
const pool = require("../db");
const authGuard = require("../middleware/authGuard"); // Middleware de autenticación
const authorize = require("../middleware/authorize"); // Middleware de autorización

// 🔒 Solo Admin y Gerente pueden ver todos los usuarios
router.get(
  "/users",
  authorize("Admin", "Gerente"),
  async (req, res) => {
    try {
      const { draw, start, length, search } = req.query;
      const drawInt = parseInt(draw, 10) || 1;
      const startInt = parseInt(start, 10) || 0;
      const lengthInt = parseInt(length, 10) || 10;
      let searchValue = `%${(search || "").trim()}%`;

      let query = `
      SELECT Id, Username, Email, Rol, Estado
      FROM users
      WHERE Username LIKE ? OR Email LIKE ?
      ORDER BY Id ASC
      LIMIT ? OFFSET ?
    `;

      const [rows] = await pool.query(query, [
        searchValue,
        searchValue,
        lengthInt,
        startInt,
      ]);
      const [totalRows] = await pool.query(
        "SELECT COUNT(*) AS count FROM users"
      );

      res.json({
        draw: drawInt,
        recordsTotal: totalRows[0].count,
        recordsFiltered: rows.length,
        data: rows,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error al obtener los usuarios");
    }
  }
);

// 🔒 Solo Admin y Gerente pueden ver un usuario por ID
router.get(
  "/users/:id",
  authorize("Admin", "Gerente"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query(
        "SELECT Id, Username, Email, Rol, Estado FROM users WHERE Id = ?",
        [id]
      );

      if (rows.length > 0) {
        res.json(rows[0]);
      } else {
        res.status(404).json({ message: "Usuario no encontrado" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Error al obtener el usuario");
    }
  }
);

// 🔒 Solo Admin puede crear usuarios
router.post("/users", authorize("Admin"), async (req, res) => {
  try {
    const { Username, Email, Rol, Estado } = req.body;

    if (!Username || !Email || !Rol || !Estado) {
      return res
        .status(400)
        .json({ message: "Todos los campos son obligatorios." });
    }

    const query =
      "INSERT INTO users (username, email, rol, estado) VALUES (?, ?, ?, ?)";
    const [result] = await pool.query(query, [Username, Email, Rol, Estado]);

    if (result.affectedRows > 0) {
      res.json({
        message: "Usuario creado correctamente",
        id: result.insertId,
      });
    } else {
      res.status(400).json({ message: "Error al crear el usuario" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al crear el usuario");
  }
});

// 🔒 Solo Admin puede activar o inactivar usuarios
router.put(
  "/users/:id/status",
  authorize("Admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (status !== "A" && status !== "I") {
        return res
          .status(400)
          .json({ message: "Estado inválido. Usa 'A' o 'I'." });
      }

      const query = "UPDATE users SET estado = ? WHERE id = ?";
      const [result] = await pool.query(query, [status, id]);

      if (result.affectedRows > 0) {
        const action = status === "A" ? "activado" : "inactivado";
        res.json({ message: `Usuario ${action} correctamente` });
      } else {
        res.status(404).json({ message: "Usuario no encontrado" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Error al actualizar el estado del usuario");
    }
  }
);

// 🔒 Solo Admin y Gerente pueden actualizar usuarios
router.put(
  "/users/:id",
  authorize("Admin", "Gerente"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { username, email, rol, estado } = req.body;

      if (!username || !email || !rol || !estado) {
        return res
          .status(400)
          .json({ message: "Todos los campos son obligatorios." });
      }

      const query =
        "UPDATE users SET username = ?, email = ?, rol = ?, estado = ? WHERE id = ?";
      const [result] = await pool.query(query, [
        username,
        email,
        rol,
        estado,
        id,
      ]);

      if (result.affectedRows > 0) {
        res.json({ message: "Usuario actualizado exitosamente" });
      } else {
        res.status(404).json({ message: "Usuario no encontrado" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Error al actualizar el usuario");
    }
  }
);

module.exports = router;
