const pool = require('../../db/pool');

async function createOrderWithItems({ customer_id, items }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const detailedItems = [];
    let total_cents = 0;

    for (const item of items) {
      const [productRows] = await connection.execute(
        `SELECT id, sku, name, price_cents, stock
         FROM products
         WHERE id = ?
         FOR UPDATE`,
        [item.product_id]
      );

      const product = productRows[0];

      if (!product) {
        const error = new Error(`Producto ${item.product_id} no encontrado`);
        error.statusCode = 404;
        throw error;
      }

      if (product.stock < item.qty) {
        const error = new Error(`Stock insuficiente para el producto ${item.product_id}`);
        error.statusCode = 409;
        throw error;
      }

      const subtotal_cents = product.price_cents * item.qty;
      total_cents += subtotal_cents;

      detailedItems.push({
        product_id: product.id,
        qty: item.qty,
        unit_price_cents: product.price_cents,
        subtotal_cents
      });
    }

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (customer_id, status, total_cents)
       VALUES (?, 'CREATED', ?)`,
      [customer_id, total_cents]
    );

    const orderId = orderResult.insertId;

    for (const item of detailedItems) {
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, qty, unit_price_cents, subtotal_cents)
         VALUES (?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.qty,
          item.unit_price_cents,
          item.subtotal_cents
        ]
      );

      await connection.execute(
        `UPDATE products
         SET stock = stock - ?
         WHERE id = ?`,
        [item.qty, item.product_id]
      );
    }

    await connection.commit();

    return getOrderById(orderId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getOrderById(orderId) {
  const [orderRows] = await pool.execute(
    `SELECT id, customer_id, status, total_cents, created_at, confirmed_at, canceled_at
     FROM orders
     WHERE id = ?`,
    [orderId]
  );

  const order = orderRows[0];

  if (!order) {
    return null;
  }

  const [itemRows] = await pool.execute(
    `SELECT product_id, qty, unit_price_cents, subtotal_cents
     FROM order_items
     WHERE order_id = ?`,
    [orderId]
  );

  return {
    ...order,
    items: itemRows
  };
}

async function searchOrders({ status = '', from = '', to = '', cursor = null, limit = 10 }) {
  const safeLimit = Number(limit) || 10;

  let query = `
    SELECT id, customer_id, status, total_cents, created_at, confirmed_at, canceled_at
    FROM orders
    WHERE 1 = 1
  `;
  const params = [];

  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }

  if (from) {
    query += ` AND created_at >= ?`;
    params.push(from);
  }

  if (to) {
    query += ` AND created_at <= ?`;
    params.push(to);
  }

  if (cursor) {
    query += ` AND id > ?`;
    params.push(Number(cursor));
  }

  query += ` ORDER BY id ASC LIMIT ${safeLimit}`;

  const [rows] = await pool.query(query, params);
  return rows;
}

async function getIdempotencyKey(key) {
  const [rows] = await pool.execute(
    `SELECT \`key\`, target_type, target_id, status, response_body, created_at, expires_at
     FROM idempotency_keys
     WHERE \`key\` = ?`,
    [key]
  );

  return rows[0] || null;
}

async function confirmOrder(orderId, idempotencyKey) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingKeyRows] = await connection.execute(
      `SELECT \`key\`, target_type, target_id, status, response_body
       FROM idempotency_keys
       WHERE \`key\` = ?`,
      [idempotencyKey]
    );

    const existingKey = existingKeyRows[0];

    if (existingKey) {
      if (
        existingKey.target_type !== 'order_confirm' ||
        Number(existingKey.target_id) !== Number(orderId)
      ) {
        const error = new Error('La idempotency key ya fue usada para otro recurso');
        error.statusCode = 409;
        throw error;
      }

      await connection.commit();

      if (typeof existingKey.response_body === 'string') {
        return JSON.parse(existingKey.response_body);
      }

      return existingKey.response_body;
    }

    const [orderRows] = await connection.execute(
      `SELECT id, customer_id, status, total_cents, created_at, confirmed_at, canceled_at
       FROM orders
       WHERE id = ?
       FOR UPDATE`,
      [orderId]
    );

    const order = orderRows[0];

    if (!order) {
      const error = new Error('Orden no encontrada');
      error.statusCode = 404;
      throw error;
    }

    if (order.status === 'CANCELED') {
      const error = new Error('No se puede confirmar una orden cancelada');
      error.statusCode = 409;
      throw error;
    }

    if (order.status === 'CREATED') {
      await connection.execute(
        `UPDATE orders
         SET status = 'CONFIRMED', confirmed_at = NOW()
         WHERE id = ?`,
        [orderId]
      );
    }

    const [updatedOrderRows] = await connection.execute(
      `SELECT id, customer_id, status, total_cents, created_at, confirmed_at, canceled_at
       FROM orders
       WHERE id = ?`,
      [orderId]
    );

    const updatedOrder = updatedOrderRows[0];

    const [itemRows] = await connection.execute(
      `SELECT product_id, qty, unit_price_cents, subtotal_cents
       FROM order_items
       WHERE order_id = ?`,
      [orderId]
    );

    const responseBody = {
      ...updatedOrder,
      items: itemRows
    };

    await connection.execute(
      `INSERT INTO idempotency_keys (\`key\`, target_type, target_id, status, response_body)
       VALUES (?, 'order_confirm', ?, 'SUCCESS', ?)`,
      [idempotencyKey, orderId, JSON.stringify(responseBody)]
    );

    await connection.commit();

    return responseBody;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function cancelOrder(orderId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [orderRows] = await connection.execute(
      `SELECT id, customer_id, status, total_cents, created_at, confirmed_at, canceled_at
       FROM orders
       WHERE id = ?
       FOR UPDATE`,
      [orderId]
    );

    const order = orderRows[0];

    if (!order) {
      const error = new Error('Orden no encontrada');
      error.statusCode = 404;
      throw error;
    }

    if (order.status === 'CANCELED') {
      const error = new Error('La orden ya está cancelada');
      error.statusCode = 409;
      throw error;
    }

    if (order.status === 'CONFIRMED') {
      const confirmedAt = new Date(order.confirmed_at);
      const now = new Date();
      const diffMinutes = (now - confirmedAt) / 1000 / 60;

      if (diffMinutes > 10) {
        const error = new Error('La orden confirmada solo puede cancelarse dentro de los 10 minutos');
        error.statusCode = 409;
        throw error;
      }
    }

    const [itemRows] = await connection.execute(
      `SELECT product_id, qty
       FROM order_items
       WHERE order_id = ?`,
      [orderId]
    );

    for (const item of itemRows) {
      await connection.execute(
        `UPDATE products
         SET stock = stock + ?
         WHERE id = ?`,
        [item.qty, item.product_id]
      );
    }

    await connection.execute(
      `UPDATE orders
       SET status = 'CANCELED', canceled_at = NOW()
       WHERE id = ?`,
      [orderId]
    );

    await connection.commit();

    return getOrderById(orderId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  createOrderWithItems,
  getOrderById,
  searchOrders,
  getIdempotencyKey,
  confirmOrder,
  cancelOrder
};