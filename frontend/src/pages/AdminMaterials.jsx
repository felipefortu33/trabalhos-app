import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../api';

const CATEGORY_OPTIONS = [
  { value: 'codigo', label: 'Código' },
  { value: 'apresentacao', label: 'Apresentação' },
  { value: 'documento', label: 'Documento' },
  { value: 'exercicio', label: 'Exercício' },
  { value: 'geral', label: 'Geral' },
];

export default function AdminMaterials() {
  const [materials, setMaterials] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Upload form
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    category: 'geral',
  });
  const [file, setFile] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    subject: '',
    category: '',
    page: 1,
    limit: 20,
  });

  // Edit modal
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listMaterials(filters);
      setMaterials(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file) {
      setError('Selecione um arquivo.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('subject', form.subject);
      formData.append('category', form.category);
      formData.append('file', file);

      await api.uploadMaterial(formData);
      setSuccess('Material enviado com sucesso!');
      setForm({ title: '', description: '', subject: '', category: 'geral' });
      setFile(null);
      setShowForm(false);
      const fileInput = document.getElementById('material-file-input');
      if (fileInput) fileInput.value = '';
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Erro ao enviar material');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Excluir o material "${title}"?`)) return;
    try {
      await api.deleteMaterial(id);
      setSuccess('Material excluído.');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditSave = async () => {
    try {
      await api.updateMaterial(editing.id, editForm);
      setEditing(null);
      setSuccess('Material atualizado.');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const openEdit = (m) => {
    setEditing(m);
    setEditForm({
      title: m.title,
      description: m.description || '',
      subject: m.subject,
      category: m.category,
    });
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const categoryLabel = (c) => {
    const found = CATEGORY_OPTIONS.find((o) => o.value === c);
    return found ? found.label : c;
  };

  const categoryIcon = (c) => {
    const icons = {
      codigo: '💻', apresentacao: '📊', documento: '📄', exercicio: '✏️', geral: '📁',
    };
    return icons[c] || '📁';
  };

  return (
    <Layout title="Materiais de Aula">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-1">
        <h2>📂 Materiais de Aula ({pagination.total})</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Fechar' : '➕ Novo Material'}
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Upload Form */}
      {showForm && (
        <div className="card mb-2">
          <h3 className="mb-2">📤 Enviar Novo Material</h3>
          <form onSubmit={handleUpload}>
            <div className="filters-bar">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Introdução ao JavaScript"
                  required
                />
              </div>
              <div className="form-group">
                <label>Matéria / Turma *</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Ex: Programação Web"
                  required
                />
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Descrição (opcional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Breve descrição do material..."
                rows={2}
              />
            </div>
            <div className="form-group">
              <label>Arquivo *</label>
              <input
                id="material-file-input"
                type="file"
                className="file-input"
                onChange={(e) => setFile(e.target.files[0])}
                required
              />
              {file && (
                <p className="text-muted mt-1">📎 {file.name} ({formatSize(file.size)})</p>
              )}
            </div>
            <button type="submit" className="btn btn-success" disabled={uploading}>
              {uploading ? (<><span className="spinner" /> Enviando...</>) : '📤 Enviar Material'}
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-2">
        <div className="filters-bar">
          <div className="form-group">
            <label>Busca</label>
            <input
              type="text"
              placeholder="Título, matéria, arquivo..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Matéria</label>
            <input
              type="text"
              placeholder="Filtrar por matéria"
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Categoria</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">Todas</option>
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2">✏️ Editar Material</h3>
            <div className="form-group">
              <label>Título</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Matéria / Turma</label>
              <input
                type="text"
                value={editForm.subject}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Categoria</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Descrição</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-1">
              <button className="btn btn-success" onClick={handleEditSave}>💾 Salvar</button>
              <button className="btn btn-outline" onClick={() => setEditing(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Materials List */}
      {loading ? (
        <div className="loading-center"><span className="spinner" /></div>
      ) : materials.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="text-muted">Nenhum material encontrado.</p>
        </div>
      ) : (
        <div className="materials-grid">
          {materials.map((m) => (
            <div key={m.id} className="material-card card">
              <div className="material-header">
                <span className="material-icon">{categoryIcon(m.category)}</span>
                <div className="material-info">
                  <h4>{m.title}</h4>
                  <span className="badge badge-material">{categoryLabel(m.category)}</span>
                </div>
              </div>
              {m.description && (
                <p className="text-muted material-desc">{m.description}</p>
              )}
              <div className="material-meta">
                <span>📚 {m.subject}</span>
                <span>📎 {m.original_filename}</span>
                <span>💾 {formatSize(m.file_size)}</span>
                <span>📅 {formatDate(m.created_at)}</span>
              </div>
              <div className="material-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={async () => {
                    try {
                      const res = await api.downloadMaterial(m.id);
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = m.original_filename;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch (err) {
                      alert('Erro: ' + err.message);
                    }
                  }}
                >📥 Baixar</button>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(m)}>✏️ Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id, m.title)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1}>
            ← Anterior
          </button>
          <span className="current">Página {pagination.page} de {pagination.totalPages}</span>
          <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>
            Próxima →
          </button>
        </div>
      )}
    </Layout>
  );
}
