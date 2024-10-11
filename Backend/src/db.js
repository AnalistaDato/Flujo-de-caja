const mysql = require('mysql2/promise'); // Importa mysql2/promise

// Configura el pool de conexiones
const pool = mysql.createPool({
  host: '10.10.12.221',
  port: 3306,
  user: 'userDBFlujoCaja',
  password: '&%Kuin899675GTRE*$kjhPOWqe', // Tu contraseña
  database: 'flujo_de_caja' // Nombre de la base de datos
});

module.exports = pool;
