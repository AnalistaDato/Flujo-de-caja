const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const uploadRoutes = require('./routes/upload.routes');
const dataRoutes = require('./routes/data.routes'); 
const eventRoutes = require('./routes/event.route')
require('./db'); 

const app = express();
const port = process.env.PORT || 3000;

// Configuración de CORS
app.use(cors({
  origin: 'http://localhost:4200', // Permitir solo este origen
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Manejo del cuerpo de las solicitudes
app.use(bodyParser.json());

app.use('/api/auth', authRoutes); // Ruta para autenticación JWT
app.use('/api', uploadRoutes); // Ruta para subida de archivos
app.use('/api/datos', dataRoutes); // Ruta para operaciones con datos
app.use('/api', eventRoutes); // Ruta para manejar eventos desde la base de datos

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
