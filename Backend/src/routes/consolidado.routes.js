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

router.get("/consolidado", async (req, res) => {
  try {
    const {
      draw,
      start,
      length,
      search,
      order,
      columns,
      valor,
      fecha, // Cambiar a fecha
      tolerancia,
    } = req.query;

    // Conversión de parámetros
    const drawInt = parseInt(draw, 10) || 1;
    const startInt = parseInt(start, 10) || 0;
    const lengthInt = parseInt(length, 10) || 10;

    // Manejar el parámetro de búsqueda
    let searchValue = search || "";

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
    let query = "SELECT * FROM extracto WHERE estado != 'inactivo'";
    let queryParams = [];

    // Filtrar por valor si está presente
    if (valor) {
      if (tolerancia) {
        // Filtrar por valor y tolerancia si están presentes
        const minValor = parseFloat(valor) - parseFloat(tolerancia);
        const maxValor = parseFloat(valor) + parseFloat(tolerancia);
        query += " AND valor >= ? AND valor <= ?";
        queryParams.push(minValor, maxValor);
      } else {
        // Filtrar por valor exacto
        query += " AND valor = ?";
        queryParams.push(valor);
      }
    }

    // Filtrar por fecha si está presente
    if (fecha) { // Cambiar a fecha
      const formattedDate = formatDate(fecha); // Convertimos la fecha al formato YYYY-MM-DD
      console.log("Fecha formateada:", formattedDate); // Imprimir la fecha formateada
      query += " AND fecha >= ?";
      queryParams.push(formattedDate);
    }

    // Búsqueda general
    if (searchValue) {
      query += " AND (id LIKE ? OR fecha LIKE ? OR valor LIKE ?)";
      queryParams.push(
        `%${searchValue}%`,
        `%${searchValue}%`,
        `%${searchValue}%`
      );
    }

    // Ordenar resultados
    const orderColumn = columnsParams[orderParams.column]?.data || "id";
    const orderDir = orderParams.dir || "asc";
    query += ` ORDER BY ${orderColumn} ${orderDir}`;

    // Limitar y paginar los resultados
    query += " LIMIT ? OFFSET ?";
    queryParams.push(lengthInt, startInt);

    // Mostrar la consulta SQL antes de ejecutarla
    console.log("Consulta SQL:", query);
    console.log("Parámetros:", queryParams);

    // Ejecutar consulta
    const [rows] = await pool.query(query, queryParams);

    // Formatear las fechas en los resultados
    const formattedRows = rows.map((row) => ({
      ...row,
      fecha: formatDate(row.fecha),
    }));

    // Contar el total de registros
    const [totalRows] = await pool.query(
      "SELECT COUNT(*) AS count FROM extracto WHERE estado = 'activo'"
    );
    const recordsTotal = totalRows.count;

    // Contar registros filtrados
    const filteredQuery = query.replace("LIMIT ? OFFSET ?", "");
    const filteredParams = queryParams.slice(0, -2);
    const [filteredRows] = await pool.query(filteredQuery, filteredParams);
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

// Nueva ruta para actualizar el estado a 'consolidado'
router.put("/consolidado", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || ids.length === 0) {
      return res.status(400).json({ error: "No se proporcionaron IDs" });
    }

    // Construir la consulta para actualizar el estado a 'consolidado'
    const query = `UPDATE extracto SET estado = 'consolidado' WHERE id IN (?)`;
    
    // Ejecutar la consulta
    const [result] = await pool.query(query, [ids]);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: `Estado actualizado para ${result.affectedRows} registros` });
    } else {
      res.status(404).json({ message: "No se encontraron registros con los IDs proporcionados" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al actualizar los datos");
  }
});


module.exports = router;
