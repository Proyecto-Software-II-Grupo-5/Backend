const express = require('express');
const admin = require('../firebase'); // Importa la configuración de Firebase desde firebase.js

const router = express.Router();
const db = admin.firestore();

router.put('/:id', async (req, res) => {
  const productId = req.params.id; // ID del producto desde la URL
  const { nombre, descripcion, cantidad, catalogo, precio, iva, unidades, imagen } = req.body;

  // Verificar que al menos un campo sea enviado
  if (
    nombre === undefined &&
    descripcion === undefined &&
    cantidad === undefined &&
    catalogo === undefined &&
    precio === undefined &&
    iva === undefined &&
    unidades === undefined &&
    imagen === undefined
  ) {
    return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
  }

  try {
    const productRef = db.collection('producto').doc(productId);
    const productSnapshot = await productRef.get();

    // Verificar si el producto existe
    if (!productSnapshot.exists) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Crear un objeto con los campos a actualizar
    const updatedFields = {};
    if (nombre !== undefined) updatedFields.nombre = nombre;
    if (descripcion !== undefined) updatedFields.descripcion = descripcion;
    if (cantidad !== undefined) updatedFields.cantidad = cantidad;
    if (catalogo !== undefined) updatedFields.catalogo = catalogo;
    if (precio !== undefined) updatedFields.precio = precio;
    if (iva !== undefined) updatedFields.iva = iva;
    if (unidades !== undefined) updatedFields.unidades = unidades;
    if (imagen !== undefined) updatedFields.imagen = imagen;

    // Actualizar el producto en Firestore
    await productRef.update(updatedFields);

    res.status(200).json({ message: 'Producto actualizado exitosamente', id: productId });
  } catch (error) {
    console.error('Error actualizando el producto:', error);
    res.status(500).json({ error: 'Error actualizando el producto.' });
  }
});

module.exports = router;
