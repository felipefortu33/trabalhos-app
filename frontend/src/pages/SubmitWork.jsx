import React, { useState } from 'react';
import Layout from '../components/Layout';
import api from '../api';

export default function SubmitWork() {
  const [form, setForm] = useState({
    student_name: '',
    student_ra: '',
    subject: '',
    title: '',
    notes: '',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file) {
      setError('Selecione um arquivo para envio.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('student_name', form.student_name);
      formData.append('student_ra', form.student_ra);
      formData.append('subject', form.subject);
      formData.append('title', form.title);
      formData.append('notes', form.notes);
      formData.append('file', file);

      const data = await api.submitWork(formData);
      setSuccess(`Trabalho enviado com sucesso! (ID: ${data.id})`);

      // Reset
      setForm({ student_name: '', student_ra: '', subject: '', title: '', notes: '' });
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err.message || 'Erro ao enviar trabalho');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Layout title="Enviar Trabalho">
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card">
          <h2 className="mb-2">📤 Enviar Trabalho</h2>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="student_name">Nome Completo *</label>
              <input
                id="student_name"
                name="student_name"
                type="text"
                value={form.student_name}
                onChange={handleChange}
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="student_ra">RA / Número do Aluno *</label>
              <input
                id="student_ra"
                name="student_ra"
                type="text"
                value={form.student_ra}
                onChange={handleChange}
                placeholder="Ex: 12345"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Matéria *</label>
              <input
                id="subject"
                name="subject"
                type="text"
                value={form.subject}
                onChange={handleChange}
                placeholder="Ex: Programação Web"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="title">Título / Assunto do Trabalho *</label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="Ex: Projeto Final - Sistema de Login"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Observações (opcional)</label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Alguma observação sobre o trabalho..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="file-input">Arquivo *</label>
              <input
                id="file-input"
                type="file"
                className="file-input"
                onChange={(e) => setFile(e.target.files[0])}
                required
              />
              {file && (
                <p className="text-muted mt-1">
                  📎 {file.name} ({formatSize(file.size)})
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Enviando...
                </>
              ) : (
                '📤 Enviar Trabalho'
              )}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
