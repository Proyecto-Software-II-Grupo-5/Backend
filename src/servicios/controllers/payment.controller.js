//payment.controller.js
const { application } = require("express");
const admin = require('../../firebase'); // Importar la configuración de Firebase
const axios = require('axios');
const { enviarCorreoConPDF } = require('../sendMail'); // Asegúrate de importar la función

// Leer las variables de entorno desde process.env
const PAYPAL_API = process.env.PAYPAL_API;
const PAYPAL_API_SECRET = process.env.PAYPAL_API_SECRET;
const PAYPAL_API_CLIENT = process.env.PAYPAL_API_CLIENT;

let tempClientData = {};
let tempCartData = {}; 
let tempCartSummary = {};


const createOrder = async (req, res) => {
    const { emailUserMarketgo, cartItems, total, subtotal, iva, datosCliente, cartSummary } = req.body;

    tempClientData = datosCliente;
    tempCartData = cartItems;
    tempCartSummary = cartSummary;
    tempemailUserMarketgo = emailUserMarketgo;

    // Validaciones básicas
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({ error: 'El carrito está vacío o no es un array válido.' });
    }

    if (!total || isNaN(total)) {
        return res.status(400).json({ error: 'El total es inválido o no fue proporcionado.' });
    }

    const calculatedTotal = (parseFloat(subtotal) + parseFloat(iva)).toFixed(2);
    if (parseFloat(total) !== parseFloat(calculatedTotal)) {
        return res.status(400).json({ error: 'El total no coincide con la suma del subtotal y el IVA.' });
    }

    const order = {
        intent: "CAPTURE",
        purchase_units: [
            {
                amount: {
                    currency_code: "USD",
                    value: total.toFixed(2),
                    breakdown: {
                        item_total: { currency_code: "USD", value: subtotal.toFixed(2) },
                        tax_total: { currency_code: "USD", value: iva.toFixed(2) },
                    },
                },
                description: "Compra en MarketGo",
                items: cartItems.map(item => ({
                    name: item.name,
                    unit_amount: { currency_code: "USD", value: item.price.toFixed(2) },
                    quantity: item.quantity.toString(),
                })),
            },
        ],
        application_context: {
            brand_name: "marketgo",
            landing_page: "NO_PREFERENCE",
            user_action: "PAY_NOW",
            return_url: "https://backend-marketgo.onrender.com/payment/capture-order",
            cancel_url: "https://backend-marketgo.onrender.com/payment/cancel-order",
        },
    };

    try {
        const access_token = await getPayPalToken();
        const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders`, order, {
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
        });

        const approveLink = response.data.links.find(link => link.rel === 'approve');
        if (!approveLink) {
            return res.status(500).json({ error: 'No se encontró la URL de aprobación de PayPal' });
        }

        return res.json({ approveUrl: approveLink.href });
    } catch (error) {
        console.error('Error al crear la orden:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Error al crear la orden en PayPal' });
    }
};

const captureOrder = async (req, res) => {
    const { token } = req.query;

    try {
        const access_token = await getPayPalToken();
        const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders/${token}/capture`, {}, {
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
        });

        const datosCliente = tempClientData;
        const cartItems = tempCartData;
        const cartSummary = tempCartSummary;
        const metodoPago = 'PayPal';
        const emailUserMarketgo = tempemailUserMarketgo;

        console.log('Procesando los siguientes productos del carrito:', cartItems);

        const db = admin.firestore();
        const productosSinStock = [];
        const productosConStock = [];

        // Validar stock antes de la transacción
        const productosSnapshot = await db
            .collection('producto')
            .where('nombre', 'in', cartItems.map(item => item.name))
            .get(); 

        // Validar stock antes de escribir
        for (const item of cartItems) {
            const productoDoc = productosSnapshot.docs.find(doc => doc.data().nombre === item.name);
            if (!productoDoc) {
                console.log(`Producto no encontrado: ${item.name}`);
                productosSinStock.push(item.name);
                continue;
            }

            const productoData = productoDoc.data();
            const unidadesActuales = productoData.unidades || 0;

            if (unidadesActuales < item.quantity) {
                console.log(`Stock insuficiente para producto: ${item.name}, Unidades disponibles: ${unidadesActuales}, Requeridas: ${item.quantity}`);
                productosSinStock.push(item.name);
            } else {
                productosConStock.push({ ...item, docRef: productoDoc.ref, unidadesActuales });
            }
        }

        // Si hay productos sin stock, redirigir
        if (productosSinStock.length > 0) {
            console.log('Productos sin stock:', productosSinStock);
            const productosQuery = encodeURIComponent(productosSinStock.join(','));
            return res.redirect(`https://marketgog5.netlify.app/transaccion-fallida?productos=${productosQuery}`);
        }

        // Transacción para reducir el stock
        try {
            await db.runTransaction(async (transaction) => {
                for (const item of productosConStock) {
                    console.log(`Actualizando stock para producto: ${item.name}`);
                    transaction.update(item.docRef, {
                        unidades: item.unidadesActuales - item.quantity,
                    });
                }
            });
        } catch (error) {
            console.error('Error al reducir el stock:', error.message);
            return res.redirect('https://marketgog5.netlify.app/transaccion-fallida?error=stock_error');
        }

        // Datos de la factura
        const facturaData = {
            emailusuariomarketgo: emailUserMarketgo,
            id: response.data.id,
            status: response.data.status,
            email_address: response.data.payer.email_address,
            account_id: response.data.payer.payer_id,
            account_status: response.data.payment_source.paypal.account_status,
            name: response.data.payer.name,
            address: response.data.payer.address,
            datosCliente,
            cartItems: cartItems.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                iva: item.iva,
                subtotal: item.subtotal,
                total: item.total,
                ivaIndicador: item.ivaIndicador,
            })),
            cartSummary: {
                subtotal: cartSummary.subtotal || 0,
                iva: cartSummary.iva || 0,
                total: cartSummary.total || 0,
            },
            metodoPago,
        };

        // Guardar factura en Firebase
        const facturaRef = db.collection('factura').doc(facturaData.id);
        console.log('Guardando la factura en Firebase con los datos:', facturaData);
        await facturaRef.set(facturaData);

        // Enviar el correo con la factura al usuario
        console.log('Preparando los datos para enviar el correo:', {
            numero: facturaData.id,
            fecha: new Date().toLocaleDateString(),
            cliente: datosCliente.nombre || 'N/A',
            cedula: datosCliente.cedula || 'N/A',
            telefono: datosCliente.telefono || 'N/A',
            correo: datosCliente.correo || 'N/A',
            direccion: datosCliente.direccion || 'N/A',
            productos: facturaData.cartItems,
            subtotal: facturaData.cartSummary.subtotal,
            iva: facturaData.cartSummary.iva,
            total: facturaData.cartSummary.total,
            metodoPago: facturaData.metodoPago,
        });

        await enviarCorreoConPDF(emailUserMarketgo, {
            numero: facturaData.id,
            fecha: new Date().toLocaleDateString(),
            cliente: datosCliente.nombre || 'N/A',
            cedula: datosCliente.cedula || 'N/A',
            telefono: datosCliente.telefono || 'N/A',
            correo: datosCliente.correo || 'N/A',
            direccion: datosCliente.direccion || 'N/A',
            productos: facturaData.cartItems,
            subtotal: facturaData.cartSummary.subtotal,
            iva: facturaData.cartSummary.iva,
            total: facturaData.cartSummary.total,
            metodoPago: facturaData.metodoPago,
        });

        // Redirigir al frontend después de capturar el pago y actualizar los datos

        return res.redirect('https://marketgog5.netlify.app/transaccion-exitosa?success=true');
    } catch (error) {
        console.error('Error al capturar la orden:', error.response?.data || error.message);
        return res.redirect('https://marketgog5.netlify.app/transaccion-fallida?error=otro_problema');
    }
};



const cancelPayment = (req, res) => {
    console.log('El usuario ha cancelado el pago.'); // Registro en consola
    // Redirigir al frontend en caso de cancelar el pago
    return res.redirect('https://marketgog5.netlify.app/home');
};

let paypalToken = null;
let tokenExpirationTime = null;

const getPayPalToken = async () => {
    if (paypalToken && tokenExpirationTime > Date.now()) {
        // El token actual sigue siendo válido
        return paypalToken;
    }

    console.log('Obteniendo un nuevo token de PayPal...');
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');

    const { data } = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, params, {
        auth: {
            username: PAYPAL_API_CLIENT,
            password: PAYPAL_API_SECRET,
        },
    });

    // Guarda el nuevo token y su tiempo de expiración
    paypalToken = data.access_token;
    tokenExpirationTime = Date.now() + data.expires_in * 1000; // Tiempo de expiración en milisegundos

    return paypalToken;
};



module.exports = { createOrder, captureOrder, cancelPayment };