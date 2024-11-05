const express = require("express");
const router = express.Router();
const db = require("../db"); // Asegúrate de que esta es la ruta correcta a tu archivo de conexión a la base de datos

// Ruta para obtener los eventos
router.get("/events", async (req, res) => {
  const query = `SELECT 
                  id, 
                  nombre_socio AS title,
                  COALESCE(fecha_vencimiento, fecha_reprogramacion) AS start, 
                  COALESCE(fecha_vencimiento, fecha_reprogramacion) AS end, 
                  total AS description, 
                  estado_pago AS status
                FROM facturas`;

  try {
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
