const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const db = require('./db');
const authRoutes = require('./routes/auth');
const submissionRoutes = require('./routes/submissions');

const app = express();

// Trust proxy (Traefik/Nginx/EasyPanel)
app.set('trust proxy', true);

// ========================================
// Middlewares globais
// ========================================

// Segurança headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS
app.use(cors({
  origin: config.CORS_ORIGIN.split(',').map(s => s.trim()),
  credentials: true,
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
});
app.use(globalLimiter);

// Rate limiting para login (mais restritivo)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

// ========================================
// Rotas
// ========================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth
app.use('/auth', loginLimiter, authRoutes);

// Submissions
app.use('/submissions', submissionRoutes);

// ========================================
// Erro 404
// ========================================
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// ========================================
// Error handler global
// ========================================
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// ========================================
// Auto-migrate e iniciar servidor
// ========================================
async function start() {
  // Garante pasta de uploads
  if (!fs.existsSync(config.UPLOADS_DIR)) {
    fs.mkdirSync(config.UPLOADS_DIR, { recursive: true });
  }

  // Auto-migrate: roda a migration na inicialização
  try {
    const migrationFile = path.join(__dirname, '..', 'migrations', '001_init.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    await db.query(sql);
    console.log('[DB] Migration aplicada com sucesso.');
  } catch (err) {
    console.error('[DB] Erro ao aplicar migration:', err.message);
    // Não mata o processo — pode ser que a tabela já exista
  }

  app.listen(config.PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Rodando na porta ${config.PORT}`);
    console.log(`[CONFIG] CORS: ${config.CORS_ORIGIN}`);
    console.log(`[CONFIG] Max upload: ${config.MAX_UPLOAD_MB}MB`);
    console.log(`[CONFIG] Uploads dir: ${config.UPLOADS_DIR}`);
  });
}

start();
