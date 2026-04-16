const repository = require('./customers.repository');

async function createCustomer(data) {
  const existingCustomer = await repository.getCustomerByEmail(data.email);

  if (existingCustomer) {
    const error = new Error('El email ya está registrado');
    error.statusCode = 409;
    throw error;
  }

  return repository.createCustomer(data);
}

async function getCustomerById(id) {
  const customer = await repository.getCustomerById(id);

  if (!customer) {
    const error = new Error('Cliente no encontrado');
    error.statusCode = 404;
    throw error;
  }

  return customer;
}

async function searchCustomers(filters) {
  return repository.searchCustomers(filters);
}

async function updateCustomer(id, data) {
  const currentCustomer = await repository.getCustomerById(id);

  if (!currentCustomer) {
    const error = new Error('Cliente no encontrado');
    error.statusCode = 404;
    throw error;
  }

  if (data.email && data.email !== currentCustomer.email) {
    const existingCustomer = await repository.getCustomerByEmail(data.email);

    if (existingCustomer) {
      const error = new Error('El email ya está registrado');
      error.statusCode = 409;
      throw error;
    }
  }

  return repository.updateCustomer(id, data);
}

async function deleteCustomer(id) {
  const deleted = await repository.deleteCustomer(id);

  if (!deleted) {
    const error = new Error('Cliente no encontrado');
    error.statusCode = 404;
    throw error;
  }

  return { success: true, message: 'Cliente eliminado correctamente' };
}

module.exports = {
  createCustomer,
  getCustomerById,
  searchCustomers,
  updateCustomer,
  deleteCustomer
};