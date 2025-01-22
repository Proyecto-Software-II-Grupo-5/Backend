const express = require('express');
const admin = require('../firebase');
const router = express.Router();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

router.post('/', async (req, res) => {
  const { productos, clienteId } = req.body;

  if (!productos || !clienteId) {
    return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
  }

  const batch = db.batch();
  const reservasRef = db.collection('reservas').doc(clienteId);

  try {
    const reserva = productos.map((producto) => ({
      id: producto.id,
      cantidad: producto.cantidad,
      timestamp: Date.now(),
    }));

    batch.set(reservasRef, { productos: reserva });

    for (const producto of productos) {
      const productoRef = db.collection('producto').doc(producto.id);
      batch.update(productoRef, {
        stockReservado: FieldValue.increment(producto.cantidad),
      });
    }

    await batch.commit();
    res.status(200).json({ success: true, message: 'Reserva realizada exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
