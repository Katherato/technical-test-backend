const pool = require('../../db/pool');

async function createProduct({ sku, name, price_cents, stock }) {
  const [result] = await pool.execute(
    `INSERT INTO products (sku, name, price_cents, stock)
     VALUES (?, ?, ?, ?)`,
    [sku, name, price_cents, stock]
  );

  return getProductById(result.insertId);
}

async function getProductById(id) {
  const [rows] = await pool.execute(
    `SELECT id, sku, name, price_cents, stock, created_at
     FROM products
     WHERE id = ?`,
    [id]
  );

  return rows[0] || null;
}

async function getProductBySku(sku) {
  const [rows] = await pool.execute(
    `SELECT id, sku, name, price_cents, stock, created_at
     FROM products
     WHERE sku = ?`,
    [sku]
  );

  return rows[0] || null;
}

async function searchProducts({ search = '', cursor = null, limit = 10 }) {
  const searchTerm = `%${search}%`;
  const safeLimit = Number(limit) || 10;

  let query = `
    SELECT id, sku, name, price_cents, stock, created_at
    FROM products
    WHERE 1 = 1
  `;
  const params = [];

  if (search) {
    query += ` AND (name LIKE ? OR sku LIKE ?)`;
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

async function updateProduct(id, { price_cents, stock }) {
  const fields = [];
  const values = [];

  if (price_cents !== undefined) {
    fields.push('price_cents = ?');
    values.push(price_cents);
  }

  if (stock !== undefined) {
    fields.push('stock = ?');
    values.push(stock);
  }

  if (fields.length === 0) {
    return getProductById(id);
  }

  values.push(id);

  await pool.execute(
    `UPDATE products
     SET ${fields.join(', ')}
     WHERE id = ?`,
    values
  );

  return getProductById(id);
}

module.exports = {
  createProduct,
  getProductById,
  getProductBySku,
  searchProducts,
  updateProduct
};