const express = require("express");
const router = express.Router();
const pool = require("../db");

// Función para formatear la fecha
function formatDate(date) {
  if (!date || date === "1969-12-31") return null; // Cambia a null si prefieres null en lugar de cadena vacía
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

router.get("/datos", async (req, res) => {
  try {
    const { draw, start, length, search, order, columns } = req.query;

    const drawInt = parseInt(draw, 10) || 1;
    const startInt = parseInt(start, 10) || 0;
    const lengthInt = parseInt(length, 10) || 10;

    let searchValue = "";
    if (search) {
      searchValue = search;
    }

    let orderParams = [{ column: 0, dir: "asc" }];
    if (order) {
      try {
        orderParams = JSON.parse(order);
      } catch (e) {
        console.error("Order parameter is not valid JSON:", order);
      }
    }

    let columnsParams = [];
    if (columns) {
      try {
        columnsParams = JSON.parse(columns);
      } catch (e) {
        console.error("Columns parameter is not valid JSON:", columns);
      }
    }

    let query = `
      SELECT 
        f.id,
        f.numero,
        f.nombre_socio,
        f.fecha_factura,
        f.fecha_vencimiento,
        f.actividades,
        f.importe_sin_impuestos,
        f.impuestos,
        f.total,
        f.total_en_divisa,
        f.importe_adeudado,
        f.estado_pago,
        f.estado,
        f.estado_g,
        f.fecha_reprogramacion,
        f.conf_banco,
        f.nuevo_pago,
        f.empresa,
        c.cuenta AS cuenta_bancaria_numero
      FROM facturas f
      LEFT JOIN cuentas_bancarias c ON f.conf_banco = c.id
      WHERE f.estado_g = 'activo'
      ORDER BY ${columnsParams[orderParams[0].column]?.data || "f.numero"} ${
      orderParams[0].dir
    }
      LIMIT ? OFFSET ?
    `;
    let queryParams = [lengthInt, startInt];

    if (searchValue) {
      query = query.replace(
        "WHERE",
        `WHERE (f.id LIKE ? OR f.numero LIKE ? OR f.nombre_socio LIKE ?) AND`
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
      "SELECT COUNT(*) AS count FROM facturas"
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

router.get("/datos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `
      SELECT 
        f.id,
        f.numero,
        f.nombre_socio,
        f.fecha_factura,
        f.fecha_vencimiento,
        f.actividades,
        f.importe_sin_impuestos,
        f.impuestos,
        f.total,
        f.total_en_divisa,
        f.importe_adeudado,
        f.estado_pago,
        f.estado,
        f.estado_g,
        f.fecha_reprogramacion,
        f.conf_banco,
        f.nuevo_pago,
        f.empresa,
        c.cuenta AS cuenta_bancaria_numero
      FROM facturas f
      LEFT JOIN cuentas_bancarias c ON f.conf_banco = c.id
      WHERE f.id = ?
    `,
      [id]
    );

    if (rows.length > 0) {
      const factura = rows[0];

      // Formatear las fechas antes de devolver los resultados
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
// Nueva ruta para inactivar una factura
router.put("/datos/:id/inactivate", async (req, res) => {
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
    numero,
    nombre_socio,
    fecha_factura,
    fecha_vencimiento,
    actividades,
    importe_sin_impuestos,
    impuestos,
    total,
    total_en_divisa,
    importe_adeudado,
    estado_pago,
    estado,
    estado_g,
    fecha_reprogramacion,
    conf_banco,
    nuevo_pago,
    empresa,
  } = req.body;

  try {
    // Consulta de actualización
    const query = `
      UPDATE facturas 
      SET 
        numero = ?, 
        nombre_socio = ?, 
        fecha_factura = ?, 
        fecha_vencimiento = ?, 
        actividades = ?, 
        importe_sin_impuestos = ?, 
        impuestos = ?, 
        total = ?, 
        total_en_divisa = ?, 
        importe_adeudado = ?, 
        estado_pago = ?, 
        estado = ?, 
        estado_g = ?, 
        fecha_reprogramacion = ?,
        conf_banco = ?,
        nuevo_pago = ?,
        empresa = ?
      WHERE id = ?
    `;

    const queryParams = [
      numero,
      nombre_socio,
      fecha_factura,
      fecha_vencimiento,
      actividades,
      importe_sin_impuestos,
      impuestos,
      total,
      total_en_divisa,
      importe_adeudado,
      estado_pago,
      estado,
      estado_g,
      fecha_reprogramacion,
      conf_banco,
      nuevo_pago,
      empresa,
      id,
    ];

    const [result] = await pool.query(query, queryParams);

    if (result.affectedRows > 0) {
      res.json({ message: "Factura actualizada correctamente" });
    } else {
      res.status(404).json({ message: "Factura no encontrada" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al actualizar la factura");
  }
});

router.put("/datos/:id/consolidado", async (req, res) => {
  const { id } = req.params;

  try {
    const query = `UPDATE facturas SET estado_g = 'consolidado' WHERE id = ?`;
    const [result] = await pool.query(query, [id]);

    if (result.affectedRows > 0) {
      res.json({ message: "Estado de la factura actualizado a 'consolidado'" });
    } else {
      res.status(404).json({ message: "Factura no encontrada" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al actualizar el estado de la factura");
  }
});

module.exports = router;
