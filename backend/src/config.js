require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 4000,

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/trabalhos',

  // Auth
  ADMIN_USER: process.env.ADMIN_USER || 'admin',
  ADMIN_PASS: process.env.ADMIN_PASS || 'admin123',
  STUDENT_USER: process.env.STUDENT_USER || 'aluno',
  STUDENT_PASS: process.env.STUDENT_PASS || '123456',
  JWT_SECRET: process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION_supersecretkey',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',

  // Upload
  MAX_UPLOAD_MB: parseInt(process.env.MAX_UPLOAD_MB || '50', 10),
  UPLOADS_DIR: process.env.UPLOADS_DIR || '/app/uploads',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
