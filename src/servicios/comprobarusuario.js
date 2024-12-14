const admin = require('firebase-admin');

const comprobarusuario = async (uid) => {
  const db = admin.firestore();
  const userRef = db.collection('usuario').doc(uid);
  const doc = await userRef.get();

  return doc.exists;
};

module.exports = comprobarusuario;
