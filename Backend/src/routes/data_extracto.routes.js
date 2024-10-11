const express = require("express");
const router = express.Router();
const pool = require("../db");

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

router.get("/data_extracto", async (req, res) => {
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

    let columnsParams = [];
    if (columns) {
      try {
        columnsParams = JSON.parse(columns);
      } catch (e) {
        console.error("Columns parameter is not valid JSON:", columns);
      }
    }

    // Construcción de la consulta SQL
    let query = "SELECT * FROM extracto WHERE estado = 'activo'";
    let queryParams = [];

    if (searchValue) {
      query += " AND (id LIKE ? OR fecha LIKE ? OR valor LIKE ?)";
      queryParams.push(
        `%${searchValue}%`,
        `%${searchValue}%`,
        `%${searchValue}%`
      );
    }

    const orderColumn = columnsParams[orderParams[0].column]?.data || "id";
    const orderDir = orderParams[0].dir || "asc";
    query += ` ORDER BY ${orderColumn} ${orderDir}`;

    query += " LIMIT ? OFFSET ?";
    queryParams.push(lengthInt, startInt);

    // Ejecutar consulta
    const [rows] = await pool.query(query, queryParams);

    // Formatear las fechas en los resultados
    const formattedRows = rows.map((row) => {
      return {
        ...row,
        fecha: formatDate(row.fecha)
      };
    });

    const [totalRows] = await pool.query(
      "SELECT COUNT(*) AS count FROM extracto"
    );
    const recordsTotal = totalRows[0].count;

    // Contar registros filtrados
    const [filteredRows] = await pool.query(
      query.replace("LIMIT ? OFFSET ?", ""),
      queryParams.slice(0, -2)
    );
    const recordsFiltered = filteredRows.length;

    // Enviar respuesta con fechas formateadas
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

router.put("/data_extracto/:id", async (req, res) => {
    const { id } = req.params;
    const {
      fecha,
      descripcion,
      valor,
      saldo,
    } = req.body;
  
    const formattedFecha = formatDate(fecha);
  
    try {
      const [result] = await pool.query(
        "UPDATE extracto SET fecha = ?, descripcion = ?, valor = ?, saldo = ? WHERE id = ?",
        [
          fecha,
          descripcion,
          valor,
          saldo,
          id
        ]
      );
      res.json({ message: "Registro actualizado exitosamente" });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error al actualizar el registro");
    }
  });
  
  module.exports = router;