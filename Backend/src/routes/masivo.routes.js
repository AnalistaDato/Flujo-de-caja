const express = require("express");
const multer = require("multer");
const path = require("path");
const { exec } = require("child_process");
const authorize = require("../middleware/authorize"); // Middleware de autorización

const router = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "masivo/");
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedMimeTypes = [
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Tipo de archivo invalido. Solo los archivos CSV y XLSX estan permitidos."),
      false
    );
  }
};

const upload = multer({ storage, fileFilter });

// Route to upload and process a file
router.post("/masivo", upload.single("file"),   authorize("Admin", "Controller"),(req, res) => {
  // Check if a file is uploaded
  if (!req.file) {
    return res.status(400).json({
      status: "error",
      body: {
        message: "Archivo no encontrado o de tipo incorrecto.",
      },
    });
  }

  const filePath = req.file.path;

  // Ruta al archivo de Python
  const pythonScriptPath = path.join(__dirname, "../Scripts/script_6.py");

  // Comando para ejecutar el script de Python
  const command = `python "${pythonScriptPath}" "${filePath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al ejecutar el script: ${error.message}`);
      return res.status(500).json({
        status: "error",
        body: {
          message: "Error ejecutando el script de Python.",
          error: error.message,
        },
      });
    }
    
    if (stderr) {
      console.error(`Error en la ejecución del script: ${stderr}`);
      return res.status(500).json({
        status: "error",
        body: {
          message: "Error en la ejecución del script de Python.",
          error: stderr,
        },
      });
    }

    // Asegúrate de que no haya salida intermedia que cause eventos desconocidos
    console.log(`Salida del script: ${stdout}`);
    
    // Responder solo cuando todo haya finalizado correctamente
    return res.json({
      status: "success",
      body: {
        message: "Archivo subido y script ejecutado correctamente.",
      },
    });
  });
});

module.exports = router;
