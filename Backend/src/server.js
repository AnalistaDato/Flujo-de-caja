const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cron = require("node-cron");
const { PythonShell } = require("python-shell");
const path = require("path");
require("./db");

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: (origin, callback) => {
    if (process.env.NODE_ENV === 'production') {
      // Permitir solo solicitudes del dominio de producción
      if (origin === "http://caja.securicol.com.co") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    } else {
      // En desarrollo, permitir localhost
      callback(null, true);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};


// Configuración de CORS
app.use(cors()); // Esto permite todas las solicitudes de cualquier origen.
 // Preflight response for all routes
 app.use(express.static(path.join(__dirname, 'public')));

// Manejo del cuerpo de las solicitudes
app.use(bodyParser.json());

// Importar y usar las rutas
require("./routes")(app);

// Programar la tarea para ejecutar el script Python a medianoche
cron.schedule("0 0 * * *", () => {
  console.log("Ejecutando script Python a medianoche");
  runPythonScript();
  runPythonScript_2();
});

// Función para ejecutar el script de Python
function runPythonScript() {
  const scriptPath = path.join(__dirname, "Scripts", "script_7.py");

  PythonShell.run(scriptPath, null, (err, result) => {
    if (err) {
      console.error(`Error ejecutando el script: ${err.message}`);
      console.error("Detalles del error:", err);
      return;
    }
    if (result) {
      console.log("Resultado del script:", result.join("\n"));
    } else {
      console.log("No se recibió resultado del script.");
    }
  });
}

function runPythonScript_2() {
  const scriptPath = path.join(__dirname, "Scripts", "script_8.py");

  PythonShell.run(scriptPath, null, (err, result) => {
    if (err) {
      console.error(`Error ejecutando el script: ${err.message}`);
      console.error("Detalles del error:", err);
      return;
    }
    if (result) {
      console.log("Resultado del script:", result.join("\n"));
    } else {
      console.log("No se recibió resultado del script.");
    }
  });
}


app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});