const express = require("express");
const router = express.Router();
const db = require("../db"); // Ruta a la conexión de base de datos

// Ruta para obtener eventos
router.get("/events", async (req, res) => {
  // Consulta para obtener los eventos
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
    return res.json(results); // Termina la ejecución aquí si todo sale bien
  } catch (err) {
    return res.status(500).json({ error: err.message }); // Termina aquí en caso de error
  }
});

module.exports = router;
