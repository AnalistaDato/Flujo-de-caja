const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../db'); // Usa el pool de conexiones

const SECRET_KEY = '1234'; // Cambia esta clave por una más segura en producción

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Buscar el usuario en la base de datos
    const [results] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (results.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const user = results[0];

    // Verificar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Generar un token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      SECRET_KEY,
      { expiresIn: '01h' }  // 24 horas de expiración
    );    

    // Enviar el token como respuesta
    return res.status(200).json({ token });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error en la base de datos' });
  }
});

module.exports = router;
