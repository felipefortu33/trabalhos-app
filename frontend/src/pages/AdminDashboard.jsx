import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'recebido', label: 'Recebido' },
  { value: 'em_correcao', label: 'Em correção' },
  { value: 'corrigido', label: 'Corrigido' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [stats, setStats] = useState({
    total: 0,
    recebido: 0,
    em_correcao: 0,
    corrigido: 0,
    last_7_days: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    subject: '',
    status: '',
    date_from: '',
    date_to: '',
    page: 1,
    limit: 20,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [submissionsData, statsData] = await Promise.all([
        api.listSubmissions(filters),
        api.getSubmissionStats(),
      ]);
      setSubmissions(submissionsData.data);
      setPagination(submissionsData.pagination);
      setStats(statsData);
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
    setSelectedIds([]);
  }, [submissions]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (checked) => {
    if (!checked) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(submissions.map((submission) => submission.id));
  };

  const handleBulkUpdate = async () => {
    setError('');
    setSuccess('');

    if (selectedIds.length === 0) {
      setError('Selecione ao menos um envio para atualizar.');
      return;
    }

    if (!bulkStatus) {
      setError('Selecione um status para aplicar em lote.');
      return;
    }

    setBulkLoading(true);
    try {
      const result = await api.bulkUpdateSubmissionsStatus(selectedIds, bulkStatus);
      setSuccess(`${result.updated} envio(s) atualizado(s) com sucesso.`);
      setBulkStatus('');
      setSelectedIds([]);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.exportCsv(filters);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'envios.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erro ao exportar: ' + err.message);
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatGrade = (grade) => {
    if (grade === null || grade === undefined) return '-';
    return Number(grade).toFixed(1);
  };

  const statusBadge = (s) => {
    const labels = { recebido: 'Recebido', em_correcao: 'Em correção', corrigido: 'Corrigido' };
    return <span className={`badge badge-${s}`}>{labels[s] || s}</span>;
  };

  const allSelected = submissions.length > 0 && selectedIds.length === submissions.length;

  return (
    <Layout title="Painel Admin">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-1">
        <h2>📋 Envios ({pagination.total})</h2>
        <button className="btn btn-success btn-sm" onClick={handleExportCsv}>
          📥 Exportar CSV
        </button>
      </div>

      <div className="stats-grid mb-2">
        <div className="card stat-card">
          <span className="stat-label">Total</span>
          <strong className="stat-value">{stats.total}</strong>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Recebidos</span>
          <strong className="stat-value">{stats.recebido}</strong>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Em correção</span>
          <strong className="stat-value">{stats.em_correcao}</strong>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Corrigidos</span>
          <strong className="stat-value">{stats.corrigido}</strong>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Últimos 7 dias</span>
          <strong className="stat-value">{stats.last_7_days}</strong>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-2">
        <div className="filters-bar">
          <div className="form-group">
            <label>Busca</label>
            <input
              type="text"
              placeholder="Nome, RA, matéria ou título..."
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
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Data de</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Data até</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
            />
          </div>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card mb-2">
        <div className="bulk-actions">
          <div className="text-muted">{selectedIds.length} selecionado(s)</div>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            disabled={bulkLoading}
          >
            <option value="">Selecionar status...</option>
            {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleBulkUpdate}
            disabled={bulkLoading || selectedIds.length === 0 || !bulkStatus}
          >
            {bulkLoading ? 'Atualizando...' : 'Aplicar em lote'}
          </button>
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="loading-center">
          <span className="spinner" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="text-muted">Nenhum envio encontrado.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: '0' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>ID</th>
                  <th>Aluno</th>
                  <th>RA</th>
                  <th>Matéria</th>
                  <th>Título</th>
                  <th>Arquivo</th>
                  <th>Status</th>
                  <th>Nota</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(s.id)}
                        onChange={() => handleToggleSelect(s.id)}
                      />
                    </td>
                    <td>{s.id}</td>
                    <td>{s.student_name}</td>
                    <td>{s.student_ra}</td>
                    <td>{s.subject}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.title}
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {s.original_filename}
                      <br />
                      ({formatSize(s.file_size)})
                    </td>
                    <td>{statusBadge(s.status)}</td>
                    <td>{formatGrade(s.grade)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(s.created_at)}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/admin/envios/${s.id}`)}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginação */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            ← Anterior
          </button>
          <span className="current">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Próxima →
          </button>
        </div>
      )}
    </Layout>
  );
}
