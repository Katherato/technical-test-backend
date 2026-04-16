const express = require('express');
const controller = require('../modules/customers/customers.controller');
const authJwt = require('../middlewares/authJwt');
const serviceTokenAuth = require('../middlewares/serviceTokenAuth');

const router = express.Router();

router.post('/customers', authJwt, controller.createCustomer);
router.get('/customers/:id', authJwt, controller.getCustomerById);
router.get('/customers', authJwt, controller.searchCustomers);
router.put('/customers/:id', authJwt, controller.updateCustomer);
router.delete('/customers/:id', authJwt, controller.deleteCustomer);

router.get(
  '/internal/customers/:id',
  serviceTokenAuth,
  controller.getCustomerById
);

module.exports = router;