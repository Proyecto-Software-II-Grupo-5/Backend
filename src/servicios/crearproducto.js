  //crearproducto.js
  const express = require('express');
  const admin = require('../firebase'); // Importa la configuración de Firebase desde firebase.js
  
  const router = express.Router();
  const db = admin.firestore();
  
  router.post('/', async (req, res) => {
    const { nombre, descripcion, cantidad, catalogo, precio, iva, unidades, imagen } = req.body;
  
    // Verificar campos individualmente
    if (
      nombre === undefined || 
      descripcion === undefined || 
      cantidad === undefined || 
      catalogo === undefined || 
      precio === undefined || 
      iva === undefined || 
      unidades === undefined || 
      imagen === undefined
    ) {
      return res.status(400).json({ error: 'Todos los campos no han sido añadidos' });
    }
  
    try {
      const newProduct = {
        nombre,
        descripcion,
        cantidad,
        catalogo,
        precio,
        iva,
        unidades,
        imagen,
      };
  
      const docRef = await db.collection('producto').add(newProduct);
  
      res.status(201).json({ message: 'Producto creado exitosamente', id: docRef.id });
    } catch (error) {
      console.error('Error creando el producto:', error);
      res.status(500).json({ error: 'Error creando el producto.' });
    }
  });
  


  
  module.exports = router;
  