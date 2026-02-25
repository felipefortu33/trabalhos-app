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

export default function StudentMaterials() {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    subject: '',
    category: '',
    page: 1,
    limit: 20,
  });

  // Preview
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState(null);

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

  useEffect(() => {
    api.getMaterialSubjects().then(setSubjects).catch(() => {});
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleDownload = async (m) => {
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
      alert('Erro ao baixar: ' + err.message);
    }
  };

  const handlePreview = async (m) => {
    if (previewMaterial?.id === m.id) {
      setPreviewMaterial(null);
      setPreviewData(null);
      return;
    }
    setPreviewMaterial(m);
    setPreviewLoading(true);
    try {
      const data = await api.getMaterialPreview(m.id);
      setPreviewData(data);
    } catch {
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
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

  const isTextFile = (filename) => {
    const ext = (filename || '').split('.').pop().toLowerCase();
    const textExts = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'cs',
      'html', 'css', 'json', 'xml', 'yaml', 'yml', 'md', 'txt', 'sql', 'sh', 'bat',
      'rb', 'php', 'go', 'rs', 'swift', 'kt', 'dart', 'vue', 'svelte'];
    return textExts.includes(ext);
  };

  return (
    <Layout title="Materiais de Aula">
      <h2 className="mb-2">📂 Materiais de Aula</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Subject quick filters */}
      {subjects.length > 0 && (
        <div className="subject-chips mb-2">
          <button
            className={`chip ${filters.subject === '' ? 'chip-active' : ''}`}
            onClick={() => handleFilterChange('subject', '')}
          >
            📚 Todas ({subjects.reduce((a, s) => a + parseInt(s.total), 0)})
          </button>
          {subjects.map((s) => (
            <button
              key={s.subject}
              className={`chip ${filters.subject === s.subject ? 'chip-active' : ''}`}
              onClick={() => handleFilterChange('subject', filters.subject === s.subject ? '' : s.subject)}
            >
              📁 {s.subject} ({s.total})
            </button>
          ))}
        </div>
      )}

      {/* Search and filters */}
      <div className="card mb-2">
        <div className="filters-bar">
          <div className="form-group" style={{ flex: 2 }}>
            <label>🔍 Buscar</label>
            <input
              type="text"
              placeholder="Buscar por título, descrição, arquivo..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
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

      {/* Materials */}
      {loading ? (
        <div className="loading-center"><span className="spinner" /></div>
      ) : materials.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📭</p>
          <p className="text-muted">Nenhum material disponível{filters.subject ? ` para "${filters.subject}"` : ''}.</p>
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
                <button className="btn btn-primary btn-sm" onClick={() => handleDownload(m)}>
                  📥 Baixar
                </button>
                {isTextFile(m.original_filename) && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handlePreview(m)}
                  >
                    {previewMaterial?.id === m.id ? '✕ Fechar' : '👁️ Visualizar'}
                  </button>
                )}
              </div>

              {/* Inline preview */}
              {previewMaterial?.id === m.id && (
                <div className="material-preview mt-1">
                  {previewLoading ? (
                    <div className="loading-center"><span className="spinner" /></div>
                  ) : previewData ? (
                    <div className="code-preview">{previewData.content}</div>
                  ) : (
                    <p className="text-muted">Não foi possível carregar o preview.</p>
                  )}
                </div>
              )}
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
