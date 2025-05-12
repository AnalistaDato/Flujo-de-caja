const express = require("express");
const router = express.Router();
const pool = require("../db");

// Función para formatear la fecha
function formatDate(date) {
  if (!date || date === "1969-12-31") return null;

  const d = new Date(date);
  if (isNaN(d.getTime())) {
    console.error("Fecha inválida:", date);
    return null;
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// 📌 1️⃣ Endpoint con paginación para DataTable
router.get("/proyecciones", async (req, res) => {
  try {
    const { draw, start, length, search, order, columns } = req.query;

    const drawInt = parseInt(draw, 10) || 1;
    const startInt = parseInt(start, 10) || 0;
    const lengthInt = parseInt(length, 10) || 10;

    let searchValue = search?.value || "";

    let orderParams = [{ column: 0, dir: "asc" }];
    if (order && typeof order === "string") {
      try {
        orderParams = JSON.parse(order);
      } catch (e) {
        console.error("Error en el parámetro de ordenamiento:", order);
      }
    }

    let columnsParams = [];
    if (columns && typeof columns === "string") {
      try {
        columnsParams = JSON.parse(columns);
      } catch (e) {
        console.error("Error en el parámetro de columnas:", columns);
      }
    }

    const orderByColumn = columnsParams[orderParams[0].column]?.data || "fecha";
    const orderDirection = orderParams[0].dir === "desc" ? "DESC" : "ASC";

    let whereClause = "WHERE estado = 'proyectado'";
    let queryParams = [];

    if (searchValue) {
      whereClause += ` AND (
        factura LIKE ? OR
        socio LIKE ? OR
        empresa LIKE ?
      )`;
      queryParams.push(`%${searchValue}%`, `%${searchValue}%`, `%${searchValue}%`);
    }

    let query = `
    SELECT 
      id,
      factura,
      fecha,
      cuenta,
      detalle,
      comunicacion,
      debito,
      credito,
      socio,
      banco,
      fecha_reprogramacion,
      estado,
      empresa
    FROM facturas_consolidadas
    ${whereClause}  
    ORDER BY ${orderByColumn} ${orderDirection}
    LIMIT ? OFFSET ?
  `;

    queryParams.push(lengthInt, startInt);

    const [rows] = await pool.query(query, queryParams);

    const formattedRows = rows.map(row => ({
      ...row,
      fecha: formatDate(row.fecha),
      fecha_reprogramacion: formatDate(row.fecha_reprogramacion)
    }));

    // Obtener el total de registros sin filtros
    const [totalRows] = await pool.query("SELECT COUNT(*) AS count FROM facturas_consolidadas WHERE estado = 'proyectado'");
    const recordsTotal = totalRows[0].count;

    // Obtener el total de registros filtrados
    const [filteredRows] = await pool.query(`SELECT COUNT(*) AS count FROM facturas_consolidadas ${whereClause}`, queryParams.slice(0, -2));
    const recordsFiltered = filteredRows[0].count;

    res.json({
      draw: drawInt,
      recordsTotal: recordsTotal,
      recordsFiltered: recordsFiltered,
      data: formattedRows,
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener los datos paginados");
  }
});

// 📌 2️⃣ Endpoint que trae TODAS las proyecciones (sin paginación)
router.get("/proyecciones/all", async (req, res) => {
  try {
    const query = `
      SELECT 
         id,
          factura,
          fecha,
          cuenta,
          detalle,
          comunicacion,
          debito,
          credito,
          socio,
          banco,
          fecha_reprogramacion,
          estado,
          empresa
      FROM facturas_consolidadas
      WHERE estado = 'proyectado'
    `;

    const [rows] = await pool.query(query);

    const formattedRows = rows.map(row => ({
      ...row,
      fecha: formatDate(row.fecha),
      fecha_reprogramacion: formatDate(row.fecha_reprogramacion),
    }));

    res.json(formattedRows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener todas las proyecciones");
  }
});
router.put("/proyecciones/:id/inactivate", async (req, res) => {
  const { id } = req.params;

  try {
    const query = `UPDATE facturas_consolidadas SET estado = 'inactivo' WHERE id = ?;`
    const [result] = await pool.query(query, [id]);

    if (result.affectedRows > 0) {
      res.json({ message: "Factura inactivada correctamente" });
    } else {
      res.status(404).json({ message: "Factura no encontrada" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al inactivar la factura");
  }
});

module.exports = router;
