const axios = require('axios');
require('dotenv').config();

async function getInternalCustomer(customerId) {
  try {
    const response = await axios.get(
      `${process.env.CUSTOMERS_API_BASE}/internal/customers/${customerId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SERVICE_TOKEN}`
        }
      }
    );

    return response.data.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      const customError = new Error('Cliente no encontrado');
      customError.statusCode = 404;
      throw customError;
    }

    const customError = new Error('Error consultando Customers API');
    customError.statusCode = 502;
    throw customError;
  }
}

module.exports = {
  getInternalCustomer
};