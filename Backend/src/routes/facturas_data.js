const express = require("express");
const router = express.Router();
const pool = require("../db");

// Función para formatear la fecha
function formatDate(date) {
  if (!date || date === "1969-12-31") return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

router.get("/facturas", async (req, res) => {
  try {
    const { draw, start, length, search, order, columns } = req.query;

    const drawInt = parseInt(draw, 10) || 1;
    const startInt = parseInt(start, 10) || 0;
    const lengthInt = parseInt(length, 10) || 10;

    let searchValue = search || "";

    let orderParams = [{ column: 0, dir: "asc" }];
    if (order && typeof order === "string") {
      try {
        orderParams = JSON.parse(order);
      } catch (e) {
        console.error("Order parameter is not valid JSON:", order);
      }
    }

    let columnsParams = [];
    if (columns && typeof columns === "string") {
      try {
        columnsParams = JSON.parse(columns);
      } catch (e) {
        console.error("Columns parameter is not valid JSON:", columns);
      }
    }

    let query = `
        SELECT 
          id,
          factura,
          fecha,
          cuenta,
          detalle,
          debito,
          credito,
          socio,
          banco
        FROM facturas_consolidadas 
        WHERE 1 = 1
        ORDER BY ${columnsParams[orderParams[0].column]?.data || "factura"} ${
      orderParams[0].dir
    }
        LIMIT ? OFFSET ?
    `;

    const queryParams = [lengthInt, startInt];

    if (searchValue) {
      query = query.replace(
        "WHERE",
        `WHERE (id LIKE ? OR factura LIKE ? OR cuenta LIKE ?) AND`
      );
      queryParams.unshift(
        `%${searchValue}%`,
        `%${searchValue}%`,
        `%${searchValue}%`
      );
    }

    const [rows] = await pool.query(query, queryParams);

    const formattedRows = rows.map((row) => ({
      ...row,
      fecha_factura: formatDate(row.fecha_factura),
      fecha_vencimiento: formatDate(row.fecha_vencimiento),
      fecha_reprogramacion: formatDate(row.fecha_reprogramacion),
    }));

    const [totalRows] = await pool.query(
      "SELECT COUNT(*) AS count FROM facturas_consolidadas"
    );
    const recordsTotal = totalRows[0].count;

    const [filteredRows] = await pool.query(
      query.replace("LIMIT ? OFFSET ?", ""),
      queryParams.slice(0, -2)
    );
    const recordsFiltered = filteredRows.length;

    res.json({
      draw: drawInt,
      recordsTotal: recordsTotal,
      recordsFiltered: recordsFiltered,
      data: formattedRows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener los datos");
  }
});

router.get("/facturas/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `
        SELECT 
          id,
          factura,
          fecha,
          cuenta,
          detalle,
          debito,
          credito,
          socio,
          banco
        FROM facturas 
        WHERE id = ?
      `,
      [id]
    );

    if (rows.length > 0) {
      const factura = rows[0];
      factura.fecha_factura = formatDate(factura.fecha_factura);
      factura.fecha_vencimiento = formatDate(factura.fecha_vencimiento);
      factura.fecha_reprogramacion = formatDate(factura.fecha_reprogramacion);

      res.json(factura);
    } else {
      res.status(404).json({ message: "Factura no encontrada" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener la factura");
  }
});

router.put("/facturas/:id/inactivate", async (req, res) => {
  const { id } = req.params;

  try {
    const query = `UPDATE facturas SET estado_g = 'inactivo' WHERE id = ?`;
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

router.put("/datos/:id", async (req, res) => {
  const { id } = req.params;
  const {
    factura,
    fecha,
    cuenta,
    detalle,
    debito,
    credito,
    socio,
    banco,
  } = req.body;

  try {
    const query = `
        UPDATE facturas 
        SET 
          factura = ?,
          fecha = ?,
          cuenta = ?,
          detalle = ?,
          debito = ?,
          credito = ?,
          socio = ?,
          banco = ?
        WHERE id = ?
      `;

    const queryParams = [
      factura,
      fecha,
      cuenta,
      detalle,
      debito,
      credito,
      socio,
      banco,
      id,
    ];

    const [result] = await pool.query(query, queryParams);

    if (result.affectedRows > 0) {
      res.json({ message: "Factura actualizada correctamente" });
    } else {
      res.status(404).json({ message: "Factura no encontrada en edición" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al actualizar la factura");
  }
});

router.post("/datos", async (req, res) => {
  const {
    factura,
    fecha,
    cuenta,
    detalle,
    debito,
    credito,
    socio,
    banco,
  } = req.body;

  try {
    const query = `
        INSERT INTO facturas (
          factura,
          fecha,
          cuenta,
          detalle,
          debito,
          credito,
          socio,
          banco
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

    const queryParams = [
      factura,
      fecha,
      cuenta,
      detalle,
      debito,
      credito,
      socio,
      banco,
    ];

    const [result] = await pool.query(query, queryParams);

    if (result.affectedRows > 0) {
      res.json({
        message: "Factura creada correctamente",
        id: result.insertId,
      });
    } else {
      res.status(400).json({ message: "Error al crear la factura" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al crear la factura");
  }
});

module.exports = router;
