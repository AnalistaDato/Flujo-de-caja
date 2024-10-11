const express = require('express');
const multer = require('multer');
const pool = require("../db");
const path = require('path');
const { exec } = require('child_process');


const router = express.Router();

router.get('/provedores', async (req, res) => {
    try {
      const { empresa } = req.query;

      let query = "SELECT * FROM provedores WHERE 1=1";
      let queryParams = [];

      if (empresa){
        query += " AND empresa = ?";
        queryParams.push(empresa);
      }

      const [rows] = await pool.query(query, queryParams);
      res.json(rows); // Devolvemos los resultados en formato JSON
    } catch (error) {
      console.error('Error al obtener los datos:', error);
      res.status(500).json({ message: 'Error al obtener los datos', error: error.message });
    }
  });
  
  module.exports = router;
  
  