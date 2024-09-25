const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const uploadRoutes = require('./routes/upload.routes');
const dataRoutes = require('./routes/data.routes'); 
const eventRoutes = require('./routes/event.route')
const extractoRoutes = require('./routes/extracto.route')
const dataExtrtactoRoutes = require('./routes/data_extracto.routes')
const cuentasRoutes = require('./routes/cuentas.routes')
const consolidadoRoutes = require('./routes/consolidado.routes')
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
app.use('/api/datos', dataExtrtactoRoutes); // Ruta para operaciones con datos
app.use('/api', eventRoutes); // Ruta para manejar eventos desde la base de datos
app.use('/api', extractoRoutes)// Ruta para subida de extracto
app.use('/api', cuentasRoutes)// Ruta para subida de extracto
app.use('/api', consolidadoRoutes)// Consulta de estractos para consolidación
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
