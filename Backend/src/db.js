const mysql = require('mysql2/promise'); // Importa mysql2/promise

// Configura el pool de conexiones
const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '', // Tu contraseña
  database: 'flujo_de_caja' // Nombre de la base de datos
});

module.exports = pool;
