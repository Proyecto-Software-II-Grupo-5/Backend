//usuarioHandler.js
const admin = require('firebase-admin');

const verificarYRegistrarUsuario = async (idToken, registrar = false) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, name, email, picture } = decodedToken;

    const db = admin.firestore();
    const userRef = db.collection('usuario').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      return {
        isValid: true,
        mensaje: 'El usuario ya existe',
        usuario: { ...userData, rol: userData.rol || '' }, // Incluir el rol aunque no esté definido
        registrado: false
      };
    }
    if (registrar) {
      const newUser = { name, email, picture, rol: 'cliente' }; // Asignar un rol por defecto
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

module.exports = verificarYRegistrarUsuario;
