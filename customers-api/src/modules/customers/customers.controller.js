const service = require('./customers.service');
const {
  createCustomerSchema,
  updateCustomerSchema
} = require('./customers.schema');

async function createCustomer(req, res) {
  try {
    const validatedData = createCustomerSchema.parse(req.body);
    const customer = await service.createCustomer(validatedData);

    return res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function getCustomerById(req, res) {
  try {
    const customer = await service.getCustomerById(req.params.id);

    return res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function searchCustomers(req, res) {
  try {
    const customers = await service.searchCustomers({
      search: req.query.search || '',
      cursor: req.query.cursor || null,
      limit: req.query.limit || 10
    });

    return res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function updateCustomer(req, res) {
  try {
    const validatedData = updateCustomerSchema.parse(req.body);
    const customer = await service.updateCustomer(req.params.id, validatedData);

    return res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function deleteCustomer(req, res) {
  try {
    const result = await service.deleteCustomer(req.params.id);

    return res.json(result);
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
  createCustomer,
  getCustomerById,
  searchCustomers,
  updateCustomer,
  deleteCustomer
};