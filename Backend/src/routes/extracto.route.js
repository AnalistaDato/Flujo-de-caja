const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');

const router = express.Router();

// Configurar Multer para las subidas de archivo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'extracto/');  // Aquí se guarda el archivo subido
  },
  filename: (req, file, cb) => {
    // Asigna un nombre único al archivo basado en la fecha y nombre original
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  // Validación del tipo de archivo, solo se permiten CSV y XLSX
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV and XLSX files are allowed.'), false);
  }
};

const upload = multer({ storage, fileFilter });

// Ruta para subir y procesar un archivo
router.post('/extracto', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded or invalid file type.' });
  }

  const filePath = req.file.path;  // Ruta donde se ha guardado el archivo subido

  // Ruta al script de Python
  const pythonScriptPath = path.join(__dirname, '../Scripts/script_2.py');

  // Comando para ejecutar el script de Python
  const command = `python3 "${pythonScriptPath}" "${filePath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al ejecutar el script: ${error.message}`);
      return res.status(500).json({ message: 'Error ejecutando el script de Python.', error: error.message });
    }

    if (stderr) {
      console.error(`Error en la ejecución del script: ${stderr}`);
      return res.status(500).json({ message: 'Error en la ejecución del script de Python.', error: stderr });
    }

    console.log(`Salida del script: ${stdout}`);
    res.json({ message: 'Archivo cargado, procesado y script de Python ejecutado exitosamente.' });
  });
});

module.exports = router;
