const pool = require('../../db/pool');

async function createCustomer({ name, email, phone }) {
  const [result] = await pool.execute(
    `INSERT INTO customers (name, email, phone)
     VALUES (?, ?, ?)`,
    [name, email, phone]
  );

  return getCustomerById(result.insertId);
}

async function getCustomerById(id) {
  const [rows] = await pool.execute(
    `SELECT id, name, email, phone, created_at
     FROM customers
     WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );

  return rows[0] || null;
}

async function getCustomerByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT id, name, email, phone, created_at
     FROM customers
     WHERE email = ? AND deleted_at IS NULL`,
    [email]
  );

  return rows[0] || null;
}

async function searchCustomers({ search = '', cursor = null, limit = 10 }) {
  const searchTerm = `%${search}%`;
  const safeLimit = Number(limit) || 10;

  let query = `
    SELECT id, name, email, phone, created_at
    FROM customers
    WHERE deleted_at IS NULL
  `;
  const params = [];

  if (search) {
    query += ` AND (name LIKE ? OR email LIKE ?)`;
    params.push(searchTerm, searchTerm);
  }

  if (cursor) {
    query += ` AND id > ?`;
    params.push(Number(cursor));
  }

  query += ` ORDER BY id ASC LIMIT ${safeLimit}`;

  const [rows] = await pool.query(query, params);
  return rows;
}

async function updateCustomer(id, { name, email, phone }) {
  const fields = [];
  const values = [];

  if (name !== undefined) {
    fields.push('name = ?');
    values.push(name);
  }

  if (email !== undefined) {
    fields.push('email = ?');
    values.push(email);
  }

  if (phone !== undefined) {
    fields.push('phone = ?');
    values.push(phone);
  }

  if (fields.length === 0) {
    return getCustomerById(id);
  }

  values.push(id);

  await pool.execute(
    `UPDATE customers
     SET ${fields.join(', ')}
     WHERE id = ? AND deleted_at IS NULL`,
    values
  );

  return getCustomerById(id);
}

async function deleteCustomer(id) {
  const [result] = await pool.execute(
    `UPDATE customers
     SET deleted_at = NOW()
     WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );

  return result.affectedRows > 0;
}

module.exports = {
  createCustomer,
  getCustomerById,
  getCustomerByEmail,
  searchCustomers,
  updateCustomer,
  deleteCustomer
};