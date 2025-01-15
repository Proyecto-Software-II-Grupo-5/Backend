//buscarproductonombre.js
const express = require('express');
const admin = require('../firebase'); // Importa la configuración de Firebase desde firebase.js

const router = express.Router();
const db = admin.firestore();

router.get('/', async (req, res) => {
  const nombreProducto = req.query.nombre.toLowerCase(); // Convertir a minúsculas

  if (!nombreProducto) {
    return res.status(400).json({ error: 'Por favor proporciona un nombre de producto.' });
  }

  try {
    console.log('Buscando productos con coincidencias parciales:', nombreProducto);
    const productosSnapshot = await db
      .collection('producto')
      .get();

    // Filtrar productos localmente para hacer una comparación insensible a mayúsculas y minúsculas
    const productos = productosSnapshot.docs.filter(doc => 
      doc.data().nombre.toLowerCase().includes(nombreProducto)
    ).map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (productos.length === 0) {
      console.log('No se encontró ningún producto con coincidencias.');
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    res.json(productos);
  } catch (error) {
    console.error('Error buscando el producto:', error);
    res.status(500).json({ error: 'Error buscando el producto.' });
  }
});

module.exports = router;
