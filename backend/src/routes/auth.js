const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config');

const router = express.Router();

/**
 * POST /auth/student-login
 * Body: { username, password }
 */
router.post('/student-login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  if (username !== config.STUDENT_USER || password !== config.STUDENT_PASS) {
    return res.status(401).json({ error: 'Credenciais de aluno inválidas.' });
  }

  const token = jwt.sign({ role: 'student' }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });

  res.json({ token, role: 'student' });
});

/**
 * POST /auth/admin-login
 * Body: { username, password }
 */
router.post('/admin-login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  if (username !== config.ADMIN_USER || password !== config.ADMIN_PASS) {
    return res.status(401).json({ error: 'Credenciais de admin inválidas.' });
  }

  const token = jwt.sign({ role: 'admin' }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });

  res.json({ token, role: 'admin' });
});

module.exports = router;
