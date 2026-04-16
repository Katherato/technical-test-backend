const repository = require('./products.repository');

async function createProduct(data) {
  const existingProduct = await repository.getProductBySku(data.sku);

  if (existingProduct) {
    const error = new Error('El SKU ya está registrado');
    error.statusCode = 409;
    throw error;
  }

  return repository.createProduct(data);
}

async function getProductById(id) {
  const product = await repository.getProductById(id);

  if (!product) {
    const error = new Error('Producto no encontrado');
    error.statusCode = 404;
    throw error;
  }

  return product;
}

async function searchProducts(filters) {
  return repository.searchProducts(filters);
}

async function updateProduct(id, data) {
  const product = await repository.getProductById(id);

  if (!product) {
    const error = new Error('Producto no encontrado');
    error.statusCode = 404;
    throw error;
  }

  return repository.updateProduct(id, data);
}

module.exports = {
  createProduct,
  getProductById,
  searchProducts,
  updateProduct
};