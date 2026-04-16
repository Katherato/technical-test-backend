const repository = require('./orders.repository');
const customersApiService = require('../../services/customersApi.service');

async function createOrder(data) {
  await customersApiService.getInternalCustomer(data.customer_id);
  return repository.createOrderWithItems(data);
}

async function getOrderById(orderId) {
  const order = await repository.getOrderById(orderId);

  if (!order) {
    const error = new Error('Orden no encontrada');
    error.statusCode = 404;
    throw error;
  }

  return order;
}

async function searchOrders(filters) {
  return repository.searchOrders(filters);
}

async function confirmOrder(orderId, idempotencyKey) {
  if (!idempotencyKey) {
    const error = new Error('El header X-Idempotency-Key es obligatorio');
    error.statusCode = 400;
    throw error;
  }

  return repository.confirmOrder(orderId, idempotencyKey);
}

async function cancelOrder(orderId) {
  return repository.cancelOrder(orderId);
}

module.exports = {
  createOrder,
  getOrderById,
  searchOrders,
  confirmOrder,
  cancelOrder
};