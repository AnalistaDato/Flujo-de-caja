class ClientePrivada {
  constructor({
    numero = null,
    nombreSocio = null,
    fechaFactura = null,
    fechaVencimiento = null,
    referencia = null,
    actividades = null,
    importeSinImpuestos = null,
    total = null,
    totalEnDivisa = null,
    importeAdeudado = null,
    estadoPago = null,
    estado = null
  } = {}) {
    this.numero = numero;
    this.nombreSocio = nombreSocio;
    this.fechaFactura = fechaFactura;
    this.fechaVencimiento = fechaVencimiento;
    this.referencia = referencia;
    this.actividades = actividades;
    this.importeSinImpuestos = importeSinImpuestos;
    this.total = total;
    this.totalEnDivisa = totalEnDivisa;
    this.importeAdeudado = importeAdeudado;
    this.estadoPago = estadoPago;
    this.estado = estado;
  }

  // Método para validar datos antes de guardarlos
  validate() {
    // Añadir validaciones según tus necesidades
    if (this.numero && typeof this.numero !== 'number') {
      throw new Error('Número debe ser un número');
    }
    // Añadir más validaciones aquí
  }

  // Método para convertir el objeto a un formato para SQL
  toSQL() {
    return {
      numero: this.numero,
      nombreSocio: this.nombreSocio,
      fechaFactura: this.fechaFactura,
      fechaVencimiento: this.fechaVencimiento,
      referencia: this.referencia,
      actividades: this.actividades,
      importeSinImpuestos: this.importeSinImpuestos,
      total: this.total,
      totalEnDivisa: this.totalEnDivisa,
      importeAdeudado: this.importeAdeudado,
      estadoPago: this.estadoPago,
      estado: this.estado
    };
  }

  // Método para guardar en la base de datos (ejemplo con consultas SQL)
  async save(connection) {
    this.validate();
    const sql = `INSERT INTO facturas 
      (nombreSocio, fechaFactura, fechaVencimiento, referencia, actividades, importeSinImpuestos, total, totalEnDivisa, importeAdeudado, estadoPago, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      this.nombreSocio,
      this.fechaFactura,
      this.fechaVencimiento,
      this.referencia,
      this.actividades,
      this.importeSinImpuestos,
      this.total,
      this.totalEnDivisa,
      this.importeAdeudado,
      this.estadoPago,
      this.estado
    ];
    await connection.query(sql, values);
  }

  // Método para actualizar un registro en la base de datos
  async update(connection) {
    this.validate();
    const sql = `UPDATE facturas SET
      nombreSocio = ?, fechaFactura = ?, fechaVencimiento = ?, referencia = ?, actividades = ?, importeSinImpuestos = ?,
      total = ?, totalEnDivisa = ?, importeAdeudado = ?, estadoPago = ?, estado = ?
      WHERE numero = ?`;
    const values = [
      this.nombreSocio,
      this.fechaFactura,
      this.fechaVencimiento,
      this.referencia,
      this.actividades,
      this.importeSinImpuestos,
      this.total,
      this.totalEnDivisa,
      this.importeAdeudado,
      this.estadoPago,
      this.estado,
      this.numero
    ];
    await connection.query(sql, values);
  }
}

module.exports = ClientePrivada;
