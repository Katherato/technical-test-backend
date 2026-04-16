const service = require('./orders.service');
const { createOrderSchema } = require('./orders.schema');

async function createOrder(req, res) {
  try {
    const validatedData = createOrderSchema.parse(req.body);
    const order = await service.createOrder(validatedData);

    return res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function getOrderById(req, res) {
  try {
    const order = await service.getOrderById(req.params.id);

    return res.json({
      success: true,
      data: order
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function searchOrders(req, res) {
  try {
    const orders = await service.searchOrders({
      status: req.query.status || '',
      from: req.query.from || '',
      to: req.query.to || '',
      cursor: req.query.cursor || null,
      limit: req.query.limit || 10
    });

    return res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function confirmOrder(req, res) {
  try {
    const idempotencyKey = req.headers['x-idempotency-key'];
    const order = await service.confirmOrder(req.params.id, idempotencyKey);

    return res.json({
      success: true,
      data: order
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function cancelOrder(req, res) {
  try {
    const order = await service.cancelOrder(req.params.id);

    return res.json({
      success: true,
      data: order
    });
  } catch (error) {
    return handleError(error, res);
  }
}

function handleError(error, res) {
  if (error.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: error.issues
    });
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor'
  });
}

module.exports = {
  createOrder,
  getOrderById,
  searchOrders,
  confirmOrder,
  cancelOrder
};