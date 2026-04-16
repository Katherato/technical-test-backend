const express = require('express');
const controller = require('../modules/products/products.controller');
const authJwt = require('../middlewares/authJwt');

const router = express.Router();

router.post('/products', authJwt, controller.createProduct);
router.get('/products/:id', authJwt, controller.getProductById);
router.get('/products', authJwt, controller.searchProducts);
router.patch('/products/:id', authJwt, controller.updateProduct);

module.exports = router;