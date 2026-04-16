require('dotenv').config();

function serviceTokenAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({
      success: false,
      message: 'Service token requerido'
    });
  }

  const token = authHeader.split(' ')[1];

  if (token !== process.env.SERVICE_TOKEN) {
    return res.status(403).json({
      success: false,
      message: 'Service token inválido'
    });
  }

  next();
}

module.exports = serviceTokenAuth;