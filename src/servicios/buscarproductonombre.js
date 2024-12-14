const express = require('express');
const admin = require('../firebase'); // Importa la configuración de Firebase desde firebase.js

const router = express.Router();
const db = admin.firestore();

router.get('/', async (req, res) => {
  const nombreProducto = req.query.nombre;

  if (!nombreProducto) {
    return res.status(400).json({ error: 'Por favor proporciona un nombre de producto.' });
  }

  try {
    console.log('Buscando producto con el nombre exacto:', nombreProducto); // Log del nombre
    const productosSnapshot = await db
      .collection('producto')
      .where('nombre', '==', nombreProducto)
      .get();

    if (productosSnapshot.empty) {
      console.log('No se encontró ningún producto con ese nombre.');
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    // Extrae los productos encontrados
    const productos = productosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(productos);
  } catch (error) {
    console.error('Error buscando el producto:', error);
    res.status(500).json({ error: 'Error buscando el producto.' });
  }
});

module.exports = router;