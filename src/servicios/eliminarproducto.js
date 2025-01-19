const express = require('express');
const admin = require('../firebase'); // Importa la configuración de Firebase desde firebase.js

const router = express.Router();
const db = admin.firestore();

router.delete('/:id', async (req, res) => {
  const productId = req.params.id; // ID del producto desde la URL

  try {
    const productRef = db.collection('producto').doc(productId);
    const productSnapshot = await productRef.get();

    // Verificar si el producto existe
    if (!productSnapshot.exists) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Eliminar el producto
    await productRef.delete();

    res.status(200).json({ message: 'Producto eliminado exitosamente', id: productId });
  } catch (error) {
    console.error('Error eliminando el producto:', error);
    res.status(500).json({ error: 'Error eliminando el producto.' });
  }
});

module.exports = router;
