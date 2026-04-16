const { z } = require('zod');

const createOrderSchema = z.object({
  customer_id: z.number().int().positive('El customer_id es obligatorio'),
  items: z.array(
    z.object({
      product_id: z.number().int().positive('El product_id es obligatorio'),
      qty: z.number().int().positive('La cantidad debe ser mayor que cero')
    })
  ).min(1, 'Debe enviar al menos un item')
});

module.exports = {
  createOrderSchema
};