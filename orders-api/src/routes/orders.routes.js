const express = require('express');
const controller = require('../modules/orders/orders.controller');
const authJwt = require('../middlewares/authJwt');

const router = express.Router();

router.post('/orders', authJwt, controller.createOrder);
router.get('/orders/:id', authJwt, controller.getOrderById);
router.get('/orders', authJwt, controller.searchOrders);
router.post('/orders/:id/confirm', authJwt, controller.confirmOrder);
router.post('/orders/:id/cancel', authJwt, controller.cancelOrder);

module.exports = router;