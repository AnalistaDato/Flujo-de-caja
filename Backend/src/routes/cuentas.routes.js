const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/cuentas", async (req, res) => {
  try {
    const { empresa } = req.query; // Obtener el parámetro empresa de la consulta

    // Construir la consulta SQL
    let query = "SELECT * FROM cuentas_bancarias WHERE 1=1";
    let queryParams = [];

    // Agregar condición para el parámetro empresa si está presente
    if (empresa) {
      query += " AND empresa = ?";
      queryParams.push(empresa);
    }

    // Ejecutar la consulta
    const [rows] = await pool.query(query, queryParams);

    // Enviar respuesta con los datos
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener los datos");
  }
});

module.exports = router;
