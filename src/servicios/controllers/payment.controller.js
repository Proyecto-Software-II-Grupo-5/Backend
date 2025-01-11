const { application } = require("express");
const admin = require('../../firebase'); // Importar la configuración de Firebase
const axios = require('axios');

// Leer las variables de entorno desde process.env
const PAYPAL_API = process.env.PAYPAL_API;
const PAYPAL_API_SECRET = process.env.PAYPAL_API_SECRET;
const PAYPAL_API_CLIENT = process.env.PAYPAL_API_CLIENT;

const createOrder = async (req, res) => {
    const { cartItems, total, subtotal, iva, datosCliente, cartSummary } = req.body;

    // Validar datos del frontend
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        console.error('Error: El carrito está vacío o no es un array válido.');
        return res.status(400).json({ error: 'El carrito está vacío o no es un array válido.' });
    }

    if (!total || isNaN(total)) {
        console.error('Error: El total es inválido o no fue proporcionado.');
        return res.status(400).json({ error: 'El total es inválido o no fue proporcionado.' });
    }

    console.log('Datos recibidos del frontend:', { cartItems, total, subtotal, iva });

    const itemTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);

    // Asegurarse de que el total sea la suma exacta del subtotal y el IVA
    const calculatedTotal = (parseFloat(subtotal) + parseFloat(iva)).toFixed(2);

    // Comparar el total calculado con el total proporcionado
    if (parseFloat(total) !== parseFloat(calculatedTotal)) {
        console.error('Error: El total no coincide con la suma del subtotal y el IVA.');
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
                        item_total: {
                            currency_code: "USD",
                            value: subtotal.toFixed(2),
                        },
                        tax_total: {
                            currency_code: "USD",
                            value: iva.toFixed(2),
                        }
                    }
                },
                description: "Compra en MarketGo",
                items: cartItems.map(item => ({
                    name: item.name,
                    unit_amount: {
                        currency_code: "USD",
                        value: item.price.toFixed(2),
                    },
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
        console.log('Iniciando autenticación con PayPal...');
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');

        const { data: { access_token } } = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, params, {
            auth: {
                username: PAYPAL_API_CLIENT,
                password: PAYPAL_API_SECRET,
            },
        });

        console.log('Token obtenido:', access_token);

        console.log('Creando la orden en PayPal...');
        const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders`, order, {
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('Orden creada:', response.data);

        const approveLink = response.data.links.find(link => link.rel === 'approve');

        if (!approveLink) {
            console.error('Error: No se encontró la URL de aprobación de PayPal');
            return res.status(500).json({ error: 'No se encontró la URL de aprobación de PayPal' });
        }

        // Agregar los datos adicionales al payload para `captureOrder` 
        req.body.datosCliente = datosCliente; 
        req.body.cartSummary = cartSummary;


        return res.json({ approveUrl: approveLink.href });
    } catch (error) {
        console.error('Error al crear la orden:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Error al crear la orden en PayPal' });
    }
};

const captureOrder = async (req, res) => {
    const { token } = req.query;
    try {
        // Capturar la orden de PayPal
        const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders/${token}/capture`, {}, {
            auth: {
                username: PAYPAL_API_CLIENT,
                password: PAYPAL_API_SECRET
            }
        });

        console.log('Orden capturada:', response.data);

        // Extraer los datos necesarios
        const orderData = {
            id: response.data.id,
            status: response.data.status,
            email_address: response.data.payer.email_address,
            account_id: response.data.payer.payer_id,
            account_status: response.data.payment_source.paypal.account_status,
            name: response.data.payer.name,
            address: response.data.payer.address,
        };
        // Datos adicionales del pedido 
        const datosPedido = req.body.datosCliente; // Añadir datos del cliente desde el body de la solicitud 
        const cartItems = req.body.cartItems; // Añadir items del carrito desde el body de la solicitud 
        const cartSummary = req.body.cartSummary;
    
        // Datos para guardar en Firestore
        const facturaData = { ...orderData, ...datosPedido, cartItems, cartSummary, metodoPago: 'PayPal' };



        // Guardar en la base de datos
        const db = admin.firestore();
        const facturaRef = db.collection('factura').doc(orderData.id);
        await facturaRef.set(orderData);

        console.log('Orden guardada en Firestore:', orderData);

        // Redirigir al frontend tras capturar la orden
        return res.redirect('https://marketgog5.netlify.app/home');
    } catch (error) {
        console.error('Error al capturar la orden:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Error al capturar la orden en PayPal' });
    }
};

const cancelPayment = (req, res) => {
    console.log('El usuario ha cancelado el pago.'); // Registro en consola
    // Redirigir al frontend en caso de cancelar el pago
    return res.redirect('https://marketgog5.netlify.app/home');
};

module.exports = { createOrder, captureOrder, cancelPayment };