const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Gera middleware de autenticação para um role específico.
 * Roles: 'student' | 'admin'
 */
function authMiddleware(requiredRole) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ error: 'Acesso negado.' });
      }
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
  };
}

module.exports = authMiddleware;
