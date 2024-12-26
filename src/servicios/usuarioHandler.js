const admin = require('firebase-admin');

const verificarYRegistrarUsuario = async (idToken, registrar = false) => {
  const cache = new Map();

  try {
    let decodedToken;
    if (cache.has(idToken)) {
      decodedToken = cache.get(idToken);
    } else {
      decodedToken = await admin.auth().verifyIdToken(idToken);
      cache.set(idToken, decodedToken);
    }

    const { uid, name, email, picture } = decodedToken;
    const db = admin.firestore();
    const userRef = db.collection('usuario').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return {
        isValid: true,
        mensaje: 'El usuario ya existe',
        usuario: userDoc.data(),
        registrado: false
      };
    }

    if (registrar) {
      const newUser = { name, email, picture };
      await userRef.set(newUser);
      return {
        isValid: true,
        mensaje: 'Usuario registrado exitosamente',
        usuario: newUser,
        registrado: true
      };
    }

    return { isValid: false, mensaje: 'El usuario no existe' };
  } catch (error) {
    console.error('Error al procesar usuario:', error);
    throw new Error('Error interno del servidor');
  }
};
