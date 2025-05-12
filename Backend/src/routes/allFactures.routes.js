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
router.get("/", async (req, res) => {
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

    const orderByColumn = columnsParams[orderParams[0].column]?.data || "fecha_factura";
    const orderDirection = orderParams[0].dir === "desc" ? "DESC" : "ASC";

    let whereClause = `
      WHERE (estado_g = 'A')
      AND estado != 'cancelado'
      AND (estado_pago = 'Pagado Parcialmente' OR estado_pago = 'No pagadas')
    `;

    let queryParams = [];

    if (searchValue) {
      whereClause += ` AND (
        numero LIKE ? OR
        nombre_socio LIKE ? OR
        empresa LIKE ?
      )`;
      queryParams.push(`%${searchValue}%`, `%${searchValue}%`, `%${searchValue}%`);
    }

    let query = `
      SELECT 
        id,
        numero,
        nombre_socio,
        fecha_factura,
        fecha_vencimiento,
        total_en_divisa,
        importe_adeudado_sin_signo,
        estado_pago,
        estado,
        estado_g,
        fecha_reprogramacion,
        empresa
      FROM facturas 
      ${whereClause}
      ORDER BY ${orderByColumn} ${orderDirection}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(lengthInt, startInt);

    const [rows] = await pool.query(query, queryParams);

    const formattedRows = rows.map(row => ({
      ...row,
      fecha_factura: formatDate(row.fecha_factura),
      fecha_reprogramacion: formatDate(row.fecha_reprogramacion),
      fecha_vencimiento: formatDate(row.fecha_vencimiento),
    }));

    // Obtener el total de registros sin filtros
    const [totalRows] = await pool.query(`
      SELECT COUNT(*) AS count FROM facturas 
      WHERE (estado_g = 'A') 
      AND estado != 'cancelado'
      AND (estado_pago = 'Pagado Parcialmente' OR estado_pago = 'No pagadas')
    `);
    const recordsTotal = totalRows[0].count;

    // Obtener el total de registros filtrados
    const [filteredRows] = await pool.query(`
      SELECT COUNT(*) AS count FROM facturas ${whereClause}
    `, queryParams.slice(0, -2));
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
router.get("/all", async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        numero,
        nombre_socio,
        fecha_factura,
        fecha_vencimiento,
        total_en_divisa,
        importe_adeudado_sin_signo,
        estado_pago,
        estado,
        estado_g,
        fecha_reprogramacion,
        empresa
      FROM facturas 
      WHERE (estado_g = 'A')
      AND estado != 'cancelado'
      AND (estado_pago = 'Pagado Parcialmente' OR estado_pago = 'No pagadas')
    `;

    const [rows] = await pool.query(query);

    const formattedRows = rows.map(row => ({
      ...row,
      fecha_factura: formatDate(row.fecha_factura),
      fecha_reprogramacion: formatDate(row.fecha_reprogramacion),
      fecha_vencimiento: formatDate(row.fecha_vencimiento),
    }));

    res.json(formattedRows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener todas las proyecciones");
  }
});

module.exports = router;
