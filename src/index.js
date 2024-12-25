const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const app = express();
const port = 3000;

// Configurar encabezados de seguridad con Helmet
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // Permite popups sin romper la seguridad
  })
);

// Configurar CORS
const corsOptions = {
  origin: ['https://marketgog5.netlify.app'], // Orígenes permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Encabezados permitidos
  credentials: true,
};
app.use(cors(corsOptions));

// Otros middlewares
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
