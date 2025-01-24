const express = require('express');
const admin = require('../firebase'); // Importa la configuración de Firebase desde firebase.js

const router = express.Router();
const db = admin.firestore();

// Ruta para buscar un usuario por correo electrónico
router.get('/:email', async (req, res) => {
  const userEmail = req.params.email;

  try {
    const usuariosRef = db.collection('usuario');
    const snapshot = await usuariosRef.where('email', '==', userEmail).get();

    // Verificar si no se encontraron usuarios
    if (snapshot.empty) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Obtener los datos del usuario encontrado
    let usuario;
    snapshot.forEach((doc) => {
      usuario = { id: doc.id, ...doc.data() }; // Incluye el ID del documento
    });

    res.status(200).json({ usuario });
  } catch (error) {
    console.error('Error al buscar usuario:', error);
    res.status(500).json({ error: 'Error al buscar usuario.' });
  }
});

module.exports = router;
