USE backend_test;

INSERT INTO customers (name, email, phone)
VALUES
  ('ACME Corp', 'ops@acme.com', '3001234567'),
  ('Globex', 'admin@globex.com', '3007654321');

INSERT INTO products (sku, name, price_cents, stock)
VALUES
  ('SKU-KEYBOARD', 'Keyboard', 129900, 20),
  ('SKU-MONITOR', 'Monitor', 459900, 10),
  ('SKU-MOUSE', 'Mouse', 59900, 50);