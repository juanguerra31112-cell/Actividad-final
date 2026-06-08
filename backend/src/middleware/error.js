const { validationResult } = require('express-validator');

// Valida resultados de express-validator
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
  }
  next();
};

// Handler global de errores
const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} →`, err.message);

  // Error de PostgreSQL: violación de unicidad
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos.' });
  }
  // Error de PostgreSQL: violación de llave foránea
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referencia inválida: el recurso relacionado no existe.' });
  }
  // Error de PostgreSQL: violación de CHECK constraint
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Valor fuera del rango permitido.' });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor.' : err.message
  });
};

module.exports = { validate, errorHandler };
