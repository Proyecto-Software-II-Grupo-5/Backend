const express = require('express');
const router = express.Router();

const validarNombre = (nombre) => {
  if (!nombre?.trim()) return 'El nombre es requerido';
  if (nombre.length < 3) return 'El nombre debe contener al menos 3 caracteres';
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) return 'El nombre solo debe contener letras';
  return '';
};

const validarCorreo = (correo) => {
  if (!correo?.trim()) return 'El correo es requerido';
  const correoRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!correoRegex.test(correo)) return 'Correo electrónico no válido';
  return '';
};

const validarTelefono = (telefono) => {
  if (!telefono?.trim()) return 'El teléfono es requerido';
  if (!/^09[0-9]{8}$/.test(telefono)) return 'Debe ser un número válido de Ecuador (10 dígitos) y comenzar con 09';
  return '';
};

const validarCedula = (cedula) => {
  if (!cedula?.trim()) return 'La cédula es requerida';
  if (!/^\d{10}$/.test(cedula)) return 'La cédula debe tener 10 dígitos';
  
  const provincia = parseInt(cedula.substring(0, 2));
  if (provincia < 1 || provincia > 24) return 'Código de provincia inválido';

  const tercerDigito = parseInt(cedula.charAt(2));
  if (tercerDigito > 6) return 'Tercer dígito inválido';

  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(cedula.charAt(i));
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    suma += digit;
  }

  const ultimoDigito = parseInt(cedula.charAt(9));
  const total = (Math.ceil(suma / 10) * 10) - suma;
  if (total !== ultimoDigito) return 'Número de cédula inválido';
  
  return '';
};

const validarDireccion = (direccion) => {
  if (!direccion?.trim()) return 'La dirección es requerida';
  if (direccion.length < 10) return 'Ingrese una dirección más específica';
  return '';
};

// Endpoint para validar datos
router.post('/', (req, res) => {
  const { nombre, correo, telefono, direccion, cedula } = req.body;

  const errores = {
    nombre: validarNombre(nombre),
    correo: validarCorreo(correo),
    telefono: validarTelefono(telefono),
    direccion: validarDireccion(direccion),
    cedula: validarCedula(cedula),
  };

  const esValido = Object.values(errores).every((error) => !error);

  res.json({ esValido, errores });
});

module.exports = router;
