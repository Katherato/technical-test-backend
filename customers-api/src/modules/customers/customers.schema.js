const { z } = require('zod');

const createCustomerSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('El email no es válido'),
  phone: z.string().min(1, 'El teléfono es obligatorio')
});

const updateCustomerSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').optional(),
  email: z.string().email('El email no es válido').optional(),
  phone: z.string().min(1, 'El teléfono es obligatorio').optional()
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema
};