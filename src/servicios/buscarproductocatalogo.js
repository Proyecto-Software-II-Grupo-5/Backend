const express = require('express');
const admin = require('../firebase'); // Importa la configuración de Firebase desde firebase.js

const router = express.Router();
const db = admin.firestore();

router.get('/', async (req, res) => {
  const nombreCatalogo = req.query.catalogo; // No convertir a minúsculas

  if (!nombreCatalogo) {
    return res.status(400).json({ error: 'Por favor proporciona un nombre de catálogo.' });
  }

  try {
    console.log('Buscando productos del catálogo:', nombreCatalogo);
    const productosSnapshot = await db
      .collection('producto')
      .where('catalogo', '==', nombreCatalogo)
      .get();

    if (productosSnapshot.empty) {
      console.log('No se encontraron productos para el catálogo:', nombreCatalogo);
      return res.status(404).json({ error: 'No se encontraron productos para este catálogo.' });
    }

    const productos = productosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(productos); // Devolver todos los productos encontrados
  } catch (error) {
    console.error('Error buscando los productos por catálogo:', error);
    res.status(500).json({ error: 'Error buscando los productos por catálogo.' });
  }
});

module.exports = router;
