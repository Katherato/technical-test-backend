const axios = require('axios');
require('dotenv').config();

async function loginOrdersApi() {
  const response = await axios.post(
    `${process.env.ORDERS_API_BASE}/auth/login`,
    {
      email: 'admin@test.com',
      password: '123456'
    }
  );

  return response.data.token;
}

async function createOrder(token, payload) {
  const response = await axios.post(
    `${process.env.ORDERS_API_BASE}/orders`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data.data;
}

async function confirmOrder(token, orderId, idempotencyKey) {
  const response = await axios.post(
    `${process.env.ORDERS_API_BASE}/orders/${orderId}/confirm`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Idempotency-Key': idempotencyKey
      }
    }
  );

  return response.data.data;
}

module.exports = {
  loginOrdersApi,
  createOrder,
  confirmOrder
};