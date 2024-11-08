const express = require("express");
const multer = require("multer");
const path = require("path");
const { exec } = require("child_process");

const router = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
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
      new Error("Invalid file type. Only CSV and XLSX files are allowed."),
      false
    );
  }
};

const upload = multer({ storage, fileFilter });

// Route to upload and process a file
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ message: "No file uploaded or invalid file type." });
  }

  const filePath = req.file.path;

  // Ruta al archivo de Python
  const pythonScriptPath = path.join(__dirname, "../Scripts/script.py");

  // Comando para ejecutar el script de Python
  const command = `python "${pythonScriptPath}" "${filePath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al ejecutar el script: ${error.message}`);
      return res
        .status(500)
        .json({
          message: "Error ejecutando el script de Python.",
          error: error.message,
        });
    }

    if (stderr) {
      console.error(`Error en la ejecución del script: ${stderr}`);
      return res
        .status(500)
        .json({
          message: "Error en la ejecución del script de Python.",
          error: stderr,
        });
    }

    console.log(`Salida del script: ${stdout}`);
    res.json({
      message:
        "File uploaded, processed, and Python script executed successfully.",
    });
  });
});

module.exports = router;
