const express = require('express');
const app = express();
const cors = require('cors');
const compression = require('compression');
const port = 3000;

// Configurar CORS
const corsOptions = {
  origin: ['https://marketgog5.netlify.app'], // Origen permitido
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Headers permitidos
  credentials: true, // Si necesitas enviar cookies o credenciales
};

app.use(cors(corsOptions)); // Aplica las opciones de CORS

// Middleware para analizar el cuerpo de las solicitudes en formato JSON
app.use(express.json());
app.use(compression());

// Importa los servicios
const verifyToken = require('./servicios/verificaciontoken');
const registerUser = require('./servicios/registrarusuario');
const iniciarSesion = require('./servicios/iniciarsesion');
const buscarProductoPorNombre = require('./servicios/buscarproductonombre'); // Importa el servicio de búsqueda por nombre
const buscarProducto = require('./servicios/buscarproducto'); // Importa el nuevo servicio de búsqueda de producto

// Usa los servicios
app.use('/verifyToken', verifyToken);
app.use('/registerUser', registerUser);
app.use('/signin', iniciarSesion);
app.use('/autosuggest', buscarProductoPorNombre);
app.use('/buscarproducto', buscarProducto); // Usa el nuevo servicio

// Ruta básica para verificar que el servidor está corriendo
app.get('/', (req, res) => {
  res.send('Bienvenido al servidor backend.');
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
