const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const { isTextFile, getPreview } = require('../utils/preview');

const router = express.Router();

// ========================================
// POST /submissions — Aluno envia trabalho
// ========================================
router.post(
  '/',
  authMiddleware('student'),
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'Arquivo excede o tamanho máximo permitido.' });
        }
        return res.status(400).json({ error: err.message || 'Erro no upload.' });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const { student_name, student_ra, subject, title, notes } = req.body;

      // Validações
      if (!student_name || !student_name.trim()) {
        return res.status(400).json({ error: 'Nome do aluno é obrigatório.' });
      }
      if (!student_ra || !student_ra.trim()) {
        return res.status(400).json({ error: 'RA/Número do aluno é obrigatório.' });
      }
      if (!subject || !subject.trim()) {
        return res.status(400).json({ error: 'Matéria é obrigatória.' });
      }
      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Título do trabalho é obrigatório.' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'Arquivo é obrigatório.' });
      }

      const result = await db.query(
        `INSERT INTO submissions 
          (student_name, student_ra, subject, title, notes, 
           original_filename, stored_filename, file_path, file_size, mime_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, created_at`,
        [
          student_name.trim(),
          student_ra.trim(),
          subject.trim(),
          title.trim(),
          (notes || '').trim(),
          req.file.originalname,
          req.file.filename,
          req.file.path,
          req.file.size,
          req.file.mimetype || 'application/octet-stream',
        ]
      );

      console.log(`[SUBMISSION] Nova entrega: ID=${result.rows[0].id} aluno="${student_name}" RA="${student_ra}" matéria="${subject}"`);

      res.status(201).json({
        message: 'Trabalho enviado com sucesso!',
        id: result.rows[0].id,
        created_at: result.rows[0].created_at,
      });
    } catch (err) {
      console.error('[SUBMISSION ERROR]', err);
      res.status(500).json({ error: 'Erro interno ao salvar o envio.' });
    }
  }
);

// ========================================
// GET /submissions — Admin lista envios
// ========================================
router.get('/', authMiddleware('admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      subject,
      status,
      student_name,
      student_ra,
      date_from,
      date_to,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = req.query;

    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit)));

    // Allowed sort columns
    const allowedSorts = ['created_at', 'student_name', 'subject', 'status', 'student_ra'];
    const safeSortBy = allowedSorts.includes(sort_by) ? sort_by : 'created_at';
    const safeSortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let where = [];
    let params = [];
    let paramIdx = 1;

    if (subject) {
      where.push(`subject ILIKE $${paramIdx++}`);
      params.push(`%${subject}%`);
    }
    if (status) {
      where.push(`status = $${paramIdx++}`);
      params.push(status);
    }
    if (student_name) {
      where.push(`student_name ILIKE $${paramIdx++}`);
      params.push(`%${student_name}%`);
    }
    if (student_ra) {
      where.push(`student_ra ILIKE $${paramIdx++}`);
      params.push(`%${student_ra}%`);
    }
    if (date_from) {
      where.push(`created_at >= $${paramIdx++}`);
      params.push(date_from);
    }
    if (date_to) {
      where.push(`created_at <= $${paramIdx++}`);
      params.push(date_to + 'T23:59:59Z');
    }
    if (search) {
      where.push(`(student_name ILIKE $${paramIdx} OR student_ra ILIKE $${paramIdx} OR subject ILIKE $${paramIdx} OR title ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    // Count total
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM submissions ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Fetch data
    const dataResult = await db.query(
      `SELECT id, student_name, student_ra, subject, title, notes,
              original_filename, file_size, mime_type, status, feedback,
              created_at, updated_at
       FROM submissions ${whereClause}
       ORDER BY ${safeSortBy} ${safeSortOrder}
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, safeLimit, offset]
    );

    res.json({
      data: dataResult.rows,
      pagination: {
        page: parseInt(page),
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  } catch (err) {
    console.error('[LIST ERROR]', err);
    res.status(500).json({ error: 'Erro ao listar envios.' });
  }
});

// ========================================
// GET /submissions/export/csv — Admin exporta CSV
// ========================================
router.get('/export/csv', authMiddleware('admin'), async (req, res) => {
  try {
    const { subject, status, date_from, date_to } = req.query;

    let where = [];
    let params = [];
    let paramIdx = 1;

    if (subject) {
      where.push(`subject ILIKE $${paramIdx++}`);
      params.push(`%${subject}%`);
    }
    if (status) {
      where.push(`status = $${paramIdx++}`);
      params.push(status);
    }
    if (date_from) {
      where.push(`created_at >= $${paramIdx++}`);
      params.push(date_from);
    }
    if (date_to) {
      where.push(`created_at <= $${paramIdx++}`);
      params.push(date_to + 'T23:59:59Z');
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT id, student_name, student_ra, subject, title, notes,
              original_filename, file_size, mime_type, status, feedback,
              created_at
       FROM submissions ${whereClause}
       ORDER BY created_at DESC`,
      params
    );

    // Build CSV
    const header = 'ID,Nome,RA,Matéria,Título,Observações,Arquivo,Tamanho(bytes),Status,Feedback,Data Envio';
    const rows = result.rows.map((r) => {
      const escapeCsv = (val) => `"${String(val || '').replace(/"/g, '""')}"`;
      return [
        r.id,
        escapeCsv(r.student_name),
        escapeCsv(r.student_ra),
        escapeCsv(r.subject),
        escapeCsv(r.title),
        escapeCsv(r.notes),
        escapeCsv(r.original_filename),
        r.file_size,
        escapeCsv(r.status),
        escapeCsv(r.feedback),
        escapeCsv(r.created_at),
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="envios.csv"');
    // BOM for Excel compatibility
    res.send('\uFEFF' + csv);
  } catch (err) {
    console.error('[CSV EXPORT ERROR]', err);
    res.status(500).json({ error: 'Erro ao exportar CSV.' });
  }
});

// ========================================
// GET /submissions/:id — Admin vê detalhes
// ========================================
router.get('/:id', authMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT * FROM submissions WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Envio não encontrado.' });
    }

    const submission = result.rows[0];
    submission.is_previewable = isTextFile(submission.original_filename);

    res.json(submission);
  } catch (err) {
    console.error('[DETAIL ERROR]', err);
    res.status(500).json({ error: 'Erro ao buscar envio.' });
  }
});

// ========================================
// GET /submissions/:id/download — Admin baixa arquivo
// ========================================
router.get('/:id/download', authMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT original_filename, file_path, mime_type FROM submissions WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Envio não encontrado.' });
    }

    const { original_filename, file_path, mime_type } = result.rows[0];

    if (!fs.existsSync(file_path)) {
      return res.status(404).json({ error: 'Arquivo não encontrado no servidor.' });
    }

    res.setHeader('Content-Type', mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(original_filename)}"`);
    fs.createReadStream(file_path).pipe(res);
  } catch (err) {
    console.error('[DOWNLOAD ERROR]', err);
    res.status(500).json({ error: 'Erro ao baixar arquivo.' });
  }
});

// ========================================
// GET /submissions/:id/preview — Admin preview de texto
// ========================================
router.get('/:id/preview', authMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT original_filename, file_path FROM submissions WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Envio não encontrado.' });
    }

    const { original_filename, file_path } = result.rows[0];

    if (!isTextFile(original_filename)) {
      return res.status(400).json({ error: 'Este arquivo não suporta preview de texto.' });
    }

    if (!fs.existsSync(file_path)) {
      return res.status(404).json({ error: 'Arquivo não encontrado no servidor.' });
    }

    const preview = getPreview(file_path, original_filename);
    res.json(preview);
  } catch (err) {
    console.error('[PREVIEW ERROR]', err);
    res.status(500).json({ error: 'Erro ao gerar preview.' });
  }
});

// ========================================
// PATCH /submissions/:id — Admin atualiza status/feedback
// ========================================
router.patch('/:id', authMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;

    const validStatuses = ['recebido', 'em_correcao', 'corrigido'];

    // Build dynamic update
    let sets = [];
    let params = [];
    let paramIdx = 1;

    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Status inválido. Use: ${validStatuses.join(', ')}` });
      }
      sets.push(`status = $${paramIdx++}`);
      params.push(status);
    }

    if (feedback !== undefined) {
      sets.push(`feedback = $${paramIdx++}`);
      params.push(feedback);
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    sets.push(`updated_at = NOW()`);
    params.push(id);

    const result = await db.query(
      `UPDATE submissions SET ${sets.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Envio não encontrado.' });
    }

    console.log(`[UPDATE] Envio ID=${id} atualizado: status=${status || 'n/a'}, feedback=${feedback ? 'sim' : 'n/a'}`);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[UPDATE ERROR]', err);
    res.status(500).json({ error: 'Erro ao atualizar envio.' });
  }
});

module.exports = router;
