const { z } = require('zod');

const createProductSchema = z.object({
  sku: z.string().min(1, 'El SKU es obligatorio'),
  name: z.string().min(1, 'El nombre es obligatorio'),
  price_cents: z.number().int().positive('El precio debe ser mayor que cero'),
  stock: z.number().int().min(0, 'El stock no puede ser negativo')
});

const updateProductSchema = z.object({
  price_cents: z.number().int().positive('El precio debe ser mayor que cero').optional(),
  stock: z.number().int().min(0, 'El stock no puede ser negativo').optional()
});

module.exports = {
  createProductSchema,
  updateProductSchema
};