const express = require("express");
const router = express.Router();
const db = require("../db"); // Asegúrate de que esta es la ruta correcta a tu archivo de conexión a la base de datos

// Ruta para obtener los eventos
router.get("/events", async (req, res) => {
  const query = `SELECT 
                  id, 
                  detalle AS title,
                  COALESCE(fecha_reprogramacion, fecha) AS start, 
                  COALESCE(fecha_reprogramacion, fecha) AS end, 
                  COALESCE(debito, credito) AS description, 
                  estado AS status
                FROM facturas_consolidadas`;

  try {
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
