const express = require('express');
const admin = require('../firebase'); // Importa la configuración de Firebase desde firebase.js

const router = express.Router();
const db = admin.firestore();

router.put('/:id', async (req, res) => {
  const userId = req.params.id; // ID del usuario desde la URL

  try {
    const userRef = db.collection('usuario').doc(userId);
    const userSnapshot = await userRef.get();

    // Verificar si el usuario existe
    if (!userSnapshot.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualizar el rol del usuario a "cliente"
    await userRef.update({ rol: 'cliente' });

    res.status(200).json({ message: 'Rol actualizado a cliente exitosamente', id: userId });
  } catch (error) {
    console.error('Error actualizando el rol del usuario:', error);
    res.status(500).json({ error: 'Error actualizando el rol del usuario.' });
  }
});

module.exports = router;
