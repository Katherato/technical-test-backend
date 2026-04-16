const service = require('./products.service');
const {
  createProductSchema,
  updateProductSchema
} = require('./products.schema');

async function createProduct(req, res) {
  try {
    const validatedData = createProductSchema.parse(req.body);
    const product = await service.createProduct(validatedData);

    return res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function getProductById(req, res) {
  try {
    const product = await service.getProductById(req.params.id);

    return res.json({
      success: true,
      data: product
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function searchProducts(req, res) {
  try {
    const products = await service.searchProducts({
      search: req.query.search || '',
      cursor: req.query.cursor || null,
      limit: req.query.limit || 10
    });

    return res.json({
      success: true,
      data: products
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function updateProduct(req, res) {
  try {
    const validatedData = updateProductSchema.parse(req.body);
    const product = await service.updateProduct(req.params.id, validatedData);

    return res.json({
      success: true,
      data: product
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
  createProduct,
  getProductById,
  searchProducts,
  updateProduct
};