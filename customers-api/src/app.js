const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const customersRoutes = require('./routes/customers.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ success: true, service: 'customers-api' });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (
    email !== process.env.AUTH_USER ||
    password !== process.env.AUTH_PASSWORD
  ) {
    return res.status(401).json({
      success: false,
      message: 'Credenciales inválidas'
    });
  }

  const token = jwt.sign(
    {
      sub: 1,
      role: 'operator',
      email
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return res.json({
    success: true,
    token
  });
});

app.use(customersRoutes);

module.exports = app;