const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const { isTextFile, getPreview } = require('../utils/preview');

const router = express.Router();

// ========================================
// POST /materials — Admin envia material
// ========================================
router.post(
  '/',
  authMiddleware('admin'),
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
      const { title, description, subject, category } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Título é obrigatório.' });
      }
      if (!subject || !subject.trim()) {
        return res.status(400).json({ error: 'Matéria/Turma é obrigatória.' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'Arquivo é obrigatório.' });
      }

      const result = await db.query(
        `INSERT INTO materials 
          (title, description, subject, category,
           original_filename, stored_filename, file_path, file_size, mime_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, created_at`,
        [
          title.trim(),
          (description || '').trim(),
          subject.trim(),
          (category || 'geral').trim(),
          req.file.originalname,
          req.file.filename,
          req.file.path,
          req.file.size,
          req.file.mimetype || 'application/octet-stream',
        ]
      );

      console.log(`[MATERIAL] Novo material: ID=${result.rows[0].id} "${title}" matéria="${subject}"`);

      res.status(201).json({
        message: 'Material enviado com sucesso!',
        id: result.rows[0].id,
        created_at: result.rows[0].created_at,
      });
    } catch (err) {
      console.error('[MATERIAL UPLOAD ERROR]', err);
      res.status(500).json({ error: 'Erro interno ao salvar material.' });
    }
  }
);

// ========================================
// GET /materials — Lista materiais (admin e aluno)
// ========================================
router.get('/', authMiddleware(), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      subject,
      category,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = req.query;

    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit)));

    const allowedSorts = ['created_at', 'title', 'subject', 'category', 'file_size'];
    const safeSortBy = allowedSorts.includes(sort_by) ? sort_by : 'created_at';
    const safeSortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let where = [];
    let params = [];
    let paramIdx = 1;

    if (subject) {
      where.push(`subject ILIKE $${paramIdx++}`);
      params.push(`%${subject}%`);
    }
    if (category) {
      where.push(`category = $${paramIdx++}`);
      params.push(category);
    }
    if (search) {
      where.push(`(title ILIKE $${paramIdx} OR description ILIKE $${paramIdx} OR subject ILIKE $${paramIdx} OR original_filename ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM materials ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    const dataResult = await db.query(
      `SELECT id, title, description, subject, category,
              original_filename, file_size, mime_type,
              created_at, updated_at
       FROM materials ${whereClause}
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
    console.error('[MATERIALS LIST ERROR]', err);
    res.status(500).json({ error: 'Erro ao listar materiais.' });
  }
});

// ========================================
// GET /materials/subjects — Lista matérias com materiais
// ========================================
router.get('/subjects', authMiddleware(), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT subject, COUNT(*) as total
       FROM materials
       GROUP BY subject
       ORDER BY subject ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[SUBJECTS ERROR]', err);
    res.status(500).json({ error: 'Erro ao listar matérias.' });
  }
});

// ========================================
// GET /materials/:id — Detalhes de um material
// ========================================
router.get('/:id', authMiddleware(), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`SELECT * FROM materials WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material não encontrado.' });
    }

    const material = result.rows[0];
    material.is_previewable = isTextFile(material.original_filename);

    res.json(material);
  } catch (err) {
    console.error('[MATERIAL DETAIL ERROR]', err);
    res.status(500).json({ error: 'Erro ao buscar material.' });
  }
});

// ========================================
// GET /materials/:id/download — Download do arquivo
// ========================================
router.get('/:id/download', authMiddleware(), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT original_filename, file_path, mime_type FROM materials WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material não encontrado.' });
    }

    const { original_filename, file_path, mime_type } = result.rows[0];

    if (!fs.existsSync(file_path)) {
      return res.status(404).json({ error: 'Arquivo não encontrado no servidor.' });
    }

    res.setHeader('Content-Type', mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(original_filename)}"`);
    fs.createReadStream(file_path).pipe(res);
  } catch (err) {
    console.error('[MATERIAL DOWNLOAD ERROR]', err);
    res.status(500).json({ error: 'Erro ao baixar arquivo.' });
  }
});

// ========================================
// GET /materials/:id/preview — Preview de texto/código
// ========================================
router.get('/:id/preview', authMiddleware(), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT original_filename, file_path FROM materials WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material não encontrado.' });
    }

    const { original_filename, file_path } = result.rows[0];

    if (!isTextFile(original_filename)) {
      return res.status(400).json({ error: 'Este arquivo não suporta preview.' });
    }

    if (!fs.existsSync(file_path)) {
      return res.status(404).json({ error: 'Arquivo não encontrado no servidor.' });
    }

    const preview = getPreview(file_path, original_filename);
    res.json(preview);
  } catch (err) {
    console.error('[MATERIAL PREVIEW ERROR]', err);
    res.status(500).json({ error: 'Erro ao gerar preview.' });
  }
});

// ========================================
// PATCH /materials/:id — Admin atualiza material
// ========================================
router.patch('/:id', authMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, subject, category } = req.body;

    let sets = [];
    let params = [];
    let paramIdx = 1;

    if (title !== undefined) {
      sets.push(`title = $${paramIdx++}`);
      params.push(title.trim());
    }
    if (description !== undefined) {
      sets.push(`description = $${paramIdx++}`);
      params.push(description.trim());
    }
    if (subject !== undefined) {
      sets.push(`subject = $${paramIdx++}`);
      params.push(subject.trim());
    }
    if (category !== undefined) {
      sets.push(`category = $${paramIdx++}`);
      params.push(category.trim());
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    sets.push(`updated_at = NOW()`);
    params.push(id);

    const result = await db.query(
      `UPDATE materials SET ${sets.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[MATERIAL UPDATE ERROR]', err);
    res.status(500).json({ error: 'Erro ao atualizar material.' });
  }
});

// ========================================
// DELETE /materials/:id — Admin exclui material
// ========================================
router.delete('/:id', authMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT file_path FROM materials WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material não encontrado.' });
    }

    // Exclui arquivo do disco
    const { file_path } = result.rows[0];
    if (fs.existsSync(file_path)) {
      fs.unlinkSync(file_path);
    }

    await db.query(`DELETE FROM materials WHERE id = $1`, [id]);

    console.log(`[MATERIAL] Material ID=${id} excluído.`);
    res.json({ message: 'Material excluído com sucesso.' });
  } catch (err) {
    console.error('[MATERIAL DELETE ERROR]', err);
    res.status(500).json({ error: 'Erro ao excluir material.' });
  }
});

module.exports = router;
