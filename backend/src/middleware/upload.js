const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

// Garante que o diretório existe
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
    const uploadDir = path.join(config.UPLOADS_DIR, yearMonth);
    ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Nome aleatório + extensão original (seguro)
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const safeName = `${uuidv4()}${ext}`;
    cb(null, safeName);
  },
});

// Validação básica: não bloqueia nenhum tipo, mas sanitiza
const fileFilter = (req, file, cb) => {
  // Impede path traversal no nome original
  const originalName = file.originalname;
  if (originalName.includes('..') || originalName.includes('/') || originalName.includes('\\')) {
    return cb(new Error('Nome de arquivo inválido.'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.MAX_UPLOAD_MB * 1024 * 1024,
    files: 1,
  },
});

module.exports = upload;
