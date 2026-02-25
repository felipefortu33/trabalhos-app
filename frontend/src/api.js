// URL base da API — em produção, virá da variável de ambiente no build
const BASE = import.meta.env.VITE_API_URL || '';

class ApiClient {
  constructor() {
    this.baseUrl = BASE;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  setAuth(token, role) {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
  }

  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  }

  getRole() {
    return localStorage.getItem('role');
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = { ...options.headers };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      this.clearAuth();
      window.location.href = '/login';
      throw new Error('Sessão expirada');
    }

    return res;
  }

  // Auth
  async studentLogin(username, password) {
    const res = await this.request('/auth/student-login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    this.setAuth(data.token, data.role);
    return data;
  }

  async adminLogin(username, password) {
    const res = await this.request('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    this.setAuth(data.token, data.role);
    return data;
  }

  // Submissions
  async submitWork(formData) {
    const res = await this.request('/submissions', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  async listSubmissions(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, v);
    });
    const res = await this.request(`/submissions?${query.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  async getSubmission(id) {
    const res = await this.request(`/submissions/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  async getPreview(id) {
    const res = await this.request(`/submissions/${id}/preview`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  getDownloadUrl(id) {
    return `${this.baseUrl}/submissions/${id}/download`;
  }

  async downloadFile(id) {
    const res = await this.request(`/submissions/${id}/download`);
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    return res;
  }

  async updateSubmission(id, body) {
    const res = await this.request(`/submissions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  async exportCsv(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, v);
    });
    const res = await this.request(`/submissions/export/csv?${query.toString()}`);
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    return res;
  }

  // ============ Materials ============

  async uploadMaterial(formData) {
    const res = await this.request('/materials', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  async listMaterials(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, v);
    });
    const res = await this.request(`/materials?${query.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  async getMaterialSubjects() {
    const res = await this.request('/materials/subjects');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  async getMaterial(id) {
    const res = await this.request(`/materials/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  async getMaterialPreview(id) {
    const res = await this.request(`/materials/${id}/preview`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  async downloadMaterial(id) {
    const res = await this.request(`/materials/${id}/download`);
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    return res;
  }

  async updateMaterial(id, body) {
    const res = await this.request(`/materials/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  async deleteMaterial(id) {
    const res = await this.request(`/materials/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }
}

const api = new ApiClient();
export default api;
