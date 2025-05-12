const pool = require('../db');

class User {
  constructor(username, password, email, rol) {
    this.username = username;
    this.password = password;
    this.email = email;
    this.rol = rol;
    this.estado = estado;
  }
  
  static async findByEmail(email) {
    const [results] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return results.length > 0 ? results[0] : null;
  }

  static async findById(id) {
    const [results] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return results.length > 0 ? results[0] : null;
  }

  static async updatePassword(id, hashedPassword) {
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
  }
}

module.exports = User;
