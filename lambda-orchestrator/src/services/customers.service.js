const axios = require('axios');
require('dotenv').config();

async function getCustomer(customerId) {
  const response = await axios.get(
    `${process.env.CUSTOMERS_API_BASE}/internal/customers/${customerId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.SERVICE_TOKEN}`
      }
    }
  );

  return response.data.data;
}

module.exports = {
  getCustomer
};