const express = require('express');
const router = express.Router();
const {
    cancelPayment,
    captureOrder,
    createOrder
} = require('./controllers/payment.controller');

router.get('/create-order', createOrder);
router.get('/capture-order', captureOrder);
router.get('/cancel-order', cancelPayment);

module.exports = router;
