const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/datos", async (req, res) => {
  try {
    const { draw, start, length, search, order, columns } = req.query;

    // Conversión de parámetros
    const drawInt = parseInt(draw, 10) || 1;
    const startInt = parseInt(start, 10) || 0;
    const lengthInt = parseInt(length, 10) || 10;

    // Manejar el parámetro de búsqueda
    let searchValue = "";
    if (search) {
      searchValue = search;
    }

    // Manejar los parámetros de orden
    let orderParams = [{ column: 0, dir: "asc" }];
    if (order) {
      try {
        orderParams = JSON.parse(order);
      } catch (e) {
        console.error("Order parameter is not valid JSON:", order);
      }
    }

    // Manejar los parámetros de columnas
    let columnsParams = [];
    if (columns) {
      try {
        columnsParams = JSON.parse(columns);
      } catch (e) {
        console.error("Columns parameter is not valid JSON:", columns);
      }
    }

    // Construcción de la consulta SQL
    let query = "SELECT * FROM facturas WHERE estado_g != 'inactivo'";
    let queryParams = [];

    if (searchValue) {
      query += " AND (id LIKE ? OR numero LIKE ? OR nombre_socio LIKE ?)";
      queryParams.push(`%${searchValue}%`,`%${searchValue}%`, `%${searchValue}%`);
    }

    const orderColumn = columnsParams[orderParams[0].column]?.data || "numero";
    const orderDir = orderParams[0].dir || "asc";
    query += ` ORDER BY ${orderColumn} ${orderDir}`;

    query += " LIMIT ? OFFSET ?";
    queryParams.push(lengthInt, startInt);

    // Ejecutar consulta
    const [rows] = await pool.query(query, queryParams);

    // Contar registros totales sin filtro
    const [totalRows] = await pool.query(
      "SELECT COUNT(*) AS count FROM facturas"
    );
    const recordsTotal = totalRows[0].count;

    // Contar registros filtrados
    const [filteredRows] = await pool.query(
      query.replace("LIMIT ? OFFSET ?", ""),
      queryParams.slice(0, -2)
    );
    const recordsFiltered = filteredRows.length;

    // Enviar respuesta
    res.json({
      draw: drawInt,
      recordsTotal: recordsTotal,
      recordsFiltered: recordsFiltered,
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener los datos");
  }
  
});

router.put("/datos/:id/inactivate", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "UPDATE facturas SET estado_g = 'inactivo' WHERE id = ?",
      [id]
    );
    res.json({ message: "Registro inactivado exitosamente" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al inactivar el registro");
  }
});

router.put("/datos/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre_socio, fecha_factura, fecha_vencimiento, total, importe_adeudado, estado_pago, estado } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE facturas SET nombre_socio = ?, fecha_factura = ?, fecha_vencimiento = ?, total = ?, importe_adeudado = ?, estado_pago = ?, estado = ? WHERE id = ?",
      [nombre_socio, fecha_factura, fecha_vencimiento, total, importe_adeudado, estado_pago, estado, id]
    );
    res.json({ message: "Registro actualizado exitosamente" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al actualizar el registro");
  }
});


module.exports = router;
