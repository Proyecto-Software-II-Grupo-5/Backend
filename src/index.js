//index.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const app = express();
const port = 3000;
 

// Configurar encabezados de seguridad con Helmet
app.use(helmet({
  crossOriginOpenerPolicy: false // Desactiva esta política
}));

app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.originalUrl}`, req.headers, req.body);
  next();
});

// Configurar CORS
const corsOptions = {
  origin: ['https://marketgog5.netlify.app', 'https://frontend-5884f.firebaseapp.com', 'http://localhost:4200'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions)); 

// Otros middlewares
app.use(express.json());
app.use(compression());
app.use(express.urlencoded({ extended: true })); // Para datos codificados en URL

// Importa los servicios
const registerUser = require('./servicios/registrarusuario');
const iniciarSesion = require('./servicios/iniciarsesion');
const buscarProductoPorNombre = require('./servicios/buscarproductonombre'); // Importa el servicio de búsqueda por nombre
const buscarProducto = require('./servicios/buscarproducto'); // Importa el nuevo servicio de búsqueda de producto
const paymentRoutes = require('./servicios/payment.routes');
const buscarProductosPorCatalogo = require('./servicios/buscarproductocatalogo');
const validarDatos = require('./servicios/validarDatos');
const createproduct = require('./servicios/crearproducto');
const modifyproduct = require('./servicios/modificarproducto');
const deleteproduct = require('./servicios/eliminarproducto');
const buscarAdmin = require('./servicios/buscaradmin');
const eliminarAdmin = require('./servicios/eliminaradmin');
const buscarUsuario = require('./servicios/buscarusuario'); // Importa el nuevo servicio
const invitacion = require('./servicios/invitacion');
const agregaradmin = require('./servicios/agregaradmin');

// Middleware de rutas de pagos
app.use('/payment', paymentRoutes);

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${req.method}] ${req.originalUrl} - ${duration}ms`);
  });
  next();
});

//app.set('etag', 'strong'); // Configura ETag para cacheo


// Usa los servicios
app.use('/registerUser', registerUser);
app.use('/signin', iniciarSesion);
app.use('/autosuggest', buscarProductoPorNombre);
app.use('/buscarproducto', buscarProducto); // Usa el nuevo servicio
app.use('/buscarproductosxcatalogo', buscarProductosPorCatalogo);
app.use('/validacionDatos', validarDatos);
app.use('/createproduct', createproduct);
app.use('/modifyproduct', modifyproduct);
app.use('/deleteproduct', deleteproduct);
app.use('/buscaradmin', buscarAdmin);
app.use('/eliminaradmin', eliminarAdmin);
app.use('/buscarusuario', buscarUsuario); // Usa el nuevo servicio
app.use('/invitacion', invitacion); 
app.use('/agregaradmin', agregaradmin);
// Ruta básica para verificar que el servidor está corriendo
app.get('/', (req, res) => {
  res.send('Bienvenido al servidor backend.');
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
