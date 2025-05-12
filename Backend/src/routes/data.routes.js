const express = require("express");
const router = express.Router();
const pool = require("../db");
const authGuard = require("../middleware/authGuard"); // Middleware de autenticación
const authorize = require("../middleware/authorize"); // Middleware de autorización



// Función para formatear la fecha
function formatDate(date) {
  if (!date || date === "1969-12-31") return null;

  // Verificar si la fecha es válida antes de intentar formatearl
  const d = new Date(date);

  // Verificar si la conversión de la fecha fue exitosa
  if (isNaN(d.getTime())) {
    console.error("Fecha inválida:", date);
    return null; // Si la fecha no es válida, devolver null
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


router.get("/datos",authorize("Admin", "Gerente","Controller","Contador"), async (req, res) => {
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
        f.importe_adeudado_sin_signo,
        f.estado_pago,
        f.estado,
        f.estado_g,
        f.fecha_reprogramacion,
        f.nuevo_pago,
        f.empresa,
        COALESCE(f.cuenta_contable, o.cuenta_contable) AS cuenta_contable
FROM facturas f
LEFT JOIN cuentas_contables o ON f.numero = o.factura AND f.empresa = o.empresa
WHERE (f.estado_g = 'A') 
   AND f.estado != 'Cancelado'
   AND (f.estado_pago = 'Pagado Parcialmente' OR f.estado_pago = 'No pagadas')
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
        f.importe_adeudado_sin_signo,
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
    const query = `UPDATE facturas SET estado_g = 'I' WHERE id = ?`;
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
   
    
   
    total,
    fecha_reprogramacion,
    conf_banco,
    nuevo_pago,
    diferencia,
    cuenta_contable,
  } = req.body;

  try {
    // Consulta de actualización
    const formattedFechaReprogramacion = formatDate(fecha_reprogramacion);
    const query = `
      UPDATE facturas 
      SET 
        total = ?,
        fecha_reprogramacion = ?,
        conf_banco = ?,
        nuevo_pago = ?,
        diferencia = ?,
        cuenta_contable = ?
      WHERE id = ?
    `;

    const queryParams = [
      total,
      formattedFechaReprogramacion,
      conf_banco,
      nuevo_pago,
      diferencia,
      cuenta_contable,
      id,
    ];

    const [result] = await pool.query(query, queryParams);

    if (result.affectedRows > 0) {
      res.json({ message: "Factura actualizada correctamente" });
      console.log(req.body);
    } else {
      res.status(404).json({ message: "Factura no encontrada en edición" });
      console.log(req.body);
    }
  } catch (err) {
    console.log(req.body);
    console.error(err);
    res.status(500).send("Error al actualizar la factura");
  }
});

router.post("/datos", async (req, res) => {
  // Desestructurar los datos que vienen del formulario en el cuerpo de la solicitud
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
    importe_adeudado_sin_signo,
    estado_pago,
    estado,
    estado_g,
    fecha_reprogramacion,
    conf_banco,
    nuevo_pago,
    empresa,
    diferencia,
    cuenta_contable,
  } = req.body;

  try {
    // Consulta para insertar una nueva factura
    const formattedFechaFactura = formatDate(fecha_factura);
    const formattedFechaVencimiento = formatDate(fecha_vencimiento);
    const formattedFechaReprogramacion = formatDate(fecha_reprogramacion);
    const query = `
      INSERT INTO facturas (
        numero, 
        nombre_socio, 
        fecha_factura, 
        fecha_vencimiento, 
        actividades, 
        importe_sin_impuestos, 
        impuestos, 
        total, 
        total_en_divisa, 
        importe_adeudado_sin_signo, 
        estado_pago, 
        estado, 
        estado_g, 
        fecha_reprogramacion, 
        conf_banco, 
        nuevo_pago, 
        empresa, 
        diferencia,
        cuenta_contable
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Parámetros a insertar en la tabla
    const queryParams = [
      numero,
      nombre_socio,
      formattedFechaFactura,
      formattedFechaVencimiento,
      actividades,
      importe_sin_impuestos,
      impuestos,
      total,
      total_en_divisa,
      importe_adeudado_sin_signo,
      estado_pago,
      estado,
      estado_g,
      formattedFechaReprogramacion,
      conf_banco,
      nuevo_pago,
      empresa,
      diferencia,
      cuenta_contable,
    ];

    // Ejecutar la consulta de inserción
    const [result] = await pool.query(query, queryParams);

    // Verificar si la inserción fue exitosa
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
