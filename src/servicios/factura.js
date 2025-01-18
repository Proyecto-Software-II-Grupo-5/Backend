// crearFactura.js
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');

router.get('/', (req, res) => {
    const doc = new PDFDocument();

    // Configuración del encabezado de la respuesta para un PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=factura.pdf');

    // Generar contenido del PDF
    doc.pipe(res); // Enviar el PDF generado al cliente directamente

    // Datos de ejemplo estáticos
    const factura = {
        numero: '001-001-000000123',
        fecha: '2025-01-18',
        cliente: 'Juan Pérez',
        direccion: 'Calle Falsa 123, Ciudad Ficticia',
        productos: [
            { descripcion: 'Producto A', cantidad: 2, precioUnitario: 15.0 },
            { descripcion: 'Producto B', cantidad: 1, precioUnitario: 25.0 },
        ],
        subtotal: 55.0,
        iva: 6.6,
        total: 61.6,
    };

    // Encabezado de la factura
    doc.fontSize(16).text('Factura de Venta', { align: 'center' });
    doc.moveDown();

    // Detalles de la factura
    doc.fontSize(12).text(`Número: ${factura.numero}`);
    doc.text(`Fecha: ${factura.fecha}`);
    doc.text(`Cliente: ${factura.cliente}`);
    doc.text(`Dirección: ${factura.direccion}`);
    doc.moveDown();

    // Tabla de productos
    doc.text('Productos:');
    doc.moveDown();
    factura.productos.forEach((producto) => {
        doc.text(
            `${producto.descripcion} - Cantidad: ${producto.cantidad} - Precio Unitario: $${producto.precioUnitario} - Total: $${(
                producto.cantidad * producto.precioUnitario
            ).toFixed(2)}`
        );
    });

    // Totales
    doc.moveDown();
    doc.text(`Subtotal: $${factura.subtotal.toFixed(2)}`);
    doc.text(`IVA: $${factura.iva.toFixed(2)}`);
    doc.text(`Total: $${factura.total.toFixed(2)}`);

    // Finalizar y enviar el PDF
    doc.end();
});

module.exports = router;
