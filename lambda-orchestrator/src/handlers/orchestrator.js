const { z } = require('zod');
const { randomUUID } = require('crypto');
const customersService = require('../services/customers.service');
const ordersService = require('../services/orders.service');

const requestSchema = z.object({
  customer_id: z.number().int().positive(),
  items: z.array(
    z.object({
      product_id: z.number().int().positive(),
      qty: z.number().int().positive()
    })
  ).min(1),
  idempotency_key: z.string().min(1),
  correlation_id: z.string().optional()
});

module.exports.createAndConfirmOrder = async (event) => {
  try {
    const body = typeof event.body === 'string'
      ? JSON.parse(event.body)
      : event.body;

    const validatedBody = requestSchema.parse(body);

    const correlationId = validatedBody.correlation_id || randomUUID();

    const customer = await customersService.getCustomer(validatedBody.customer_id);

    const token = await ordersService.loginOrdersApi();

    const createdOrder = await ordersService.createOrder(token, {
      customer_id: validatedBody.customer_id,
      items: validatedBody.items
    });

    const confirmedOrder = await ordersService.confirmOrder(
      token,
      createdOrder.id,
      validatedBody.idempotency_key
    );

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        correlationId,
        data: {
          customer,
          order: confirmedOrder
        }
      })
    };
  } catch (error) {
    if (error.name === 'ZodError') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Error de validación',
          errors: error.issues
        })
      };
    }

    return {
      statusCode: error.response?.status || error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          'Error interno del orquestador'
      })
    };
  }
};