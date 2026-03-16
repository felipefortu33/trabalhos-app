import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api';

const STATUS_OPTIONS = [
  { value: 'recebido', label: 'Recebido' },
  { value: 'em_correcao', label: 'Em correção' },
  { value: 'corrigido', label: 'Corrigido' },
];

export default function AdminDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit fields
  const [status, setStatus] = useState('');
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [updateMsg, setUpdateMsg] = useState('');

  useEffect(() => {
    loadSubmission();
  }, [id]);

  const loadSubmission = async () => {
    try {
      setLoading(true);
      const data = await api.getSubmission(id);
      setSubmission(data);
      setStatus(data.status);
      setGrade(data.grade === null || data.grade === undefined ? '' : String(data.grade));
      setFeedback(data.feedback || '');

      // Auto-load preview if text file
      if (data.is_previewable) {
        setPreviewLoading(true);
        try {
          const previewData = await api.getPreview(id);
          setPreview(previewData);
        } catch {
          // Preview failed, ok
        } finally {
          setPreviewLoading(false);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    setUpdateMsg('');
    try {
      const parsedGrade = grade === '' ? null : Number(grade);
      if (parsedGrade !== null && (Number.isNaN(parsedGrade) || parsedGrade < 0 || parsedGrade > 10)) {
        setUpdateMsg('Erro: nota deve estar entre 0 e 10.');
        setSaving(false);
        return;
      }

      const updated = await api.updateSubmission(id, { status, grade: parsedGrade, feedback });
      setSubmission(updated);
      setGrade(updated.grade === null || updated.grade === undefined ? '' : String(updated.grade));
      setUpdateMsg('Salvo com sucesso!');
      setTimeout(() => setUpdateMsg(''), 3000);
    } catch (err) {
      setUpdateMsg('Erro: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await api.downloadFile(id);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = submission.original_filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erro ao baixar: ' + err.message);
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
      second: '2-digit',
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <Layout title="Detalhes do Envio">
        <div className="loading-center">
          <span className="spinner" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Detalhes do Envio">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-outline" onClick={() => navigate('/admin')}>
          ← Voltar
        </button>
      </Layout>
    );
  }

  if (!submission) return null;

  return (
    <Layout title={`Envio #${id}`}>
      <button className="btn btn-outline mb-2" onClick={() => navigate('/admin')}>
        ← Voltar para lista
      </button>

      {/* Dados do envio */}
      <div className="card">
        <h3 className="mb-2">📄 Informações do Envio</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <div className="label">Aluno</div>
            <div className="value">{submission.student_name}</div>
          </div>
          <div className="detail-item">
            <div className="label">RA / Número</div>
            <div className="value">{submission.student_ra}</div>
          </div>
          <div className="detail-item">
            <div className="label">Matéria</div>
            <div className="value">{submission.subject}</div>
          </div>
          <div className="detail-item">
            <div className="label">Título</div>
            <div className="value">{submission.title}</div>
          </div>
          <div className="detail-item">
            <div className="label">Data do envio</div>
            <div className="value">{formatDate(submission.created_at)}</div>
          </div>
          <div className="detail-item">
            <div className="label">Última atualização</div>
            <div className="value">{formatDate(submission.updated_at)}</div>
          </div>
          <div className="detail-item">
            <div className="label">Arquivo</div>
            <div className="value">
              {submission.original_filename}
              <br />
              <span className="text-muted">
                {formatSize(submission.file_size)} · {submission.mime_type}
              </span>
            </div>
          </div>
          <div className="detail-item">
            <div className="label">Nota</div>
            <div className="value">{submission.grade === null || submission.grade === undefined ? '-' : Number(submission.grade).toFixed(1)}</div>
          </div>
          {submission.notes && (
            <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
              <div className="label">Observações do aluno</div>
              <div className="value">{submission.notes}</div>
            </div>
          )}
        </div>

        <div className="flex gap-1 flex-wrap mt-1">
          <button className="btn btn-primary" onClick={handleDownload}>
            📥 Baixar Arquivo
          </button>
        </div>
      </div>

      {/* Preview */}
      {submission.is_previewable && (
        <div className="card">
          <h3 className="mb-1">
            👁️ Preview do Conteúdo
            {preview && (
              <span className="text-muted" style={{ fontWeight: 'normal', marginLeft: '0.5rem' }}>
                ({preview.language})
              </span>
            )}
          </h3>

          {previewLoading ? (
            <div className="loading-center">
              <span className="spinner" />
            </div>
          ) : preview ? (
            <>
              {preview.truncated && (
                <div className="alert alert-info mb-1">
                  Arquivo grande ({formatSize(submission.file_size)}). Mostrando primeiros 500KB.
                </div>
              )}
              <div className="code-preview">{preview.content}</div>
            </>
          ) : (
            <p className="text-muted">Não foi possível carregar o preview.</p>
          )}
        </div>
      )}

      {/* Status e Feedback */}
      <div className="card">
        <h3 className="mb-2">✏️ Status e Feedback</h3>

        {updateMsg && (
          <div className={`alert ${updateMsg.startsWith('Erro') ? 'alert-error' : 'alert-success'}`}>
            {updateMsg}
          </div>
        )}

        <div className="form-group">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Nota (0 a 10)</label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="Ex: 8.5"
          />
        </div>

        <div className="form-group">
          <label>Feedback / Comentário</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            placeholder="Adicione um feedback para o aluno..."
          />
        </div>

        <button className="btn btn-success" onClick={handleUpdate} disabled={saving}>
          {saving ? (
            <>
              <span className="spinner" /> Salvando...
            </>
          ) : (
            '💾 Salvar Alterações'
          )}
        </button>
      </div>
    </Layout>
  );
}
