# 📚 Sistema de Envio de Trabalhos de Alunos

Sistema web completo para envio e gerenciamento de trabalhos acadêmicos (códigos, PDFs, etc.), com painel de aluno e painel administrativo para o professor.

---

## A) Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Navegador do Usuário                  │
│                                                         │
│   /login  /enviar  /admin/login  /admin  /admin/envios  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS (Traefik / EasyPanel)
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Frontend (React + Vite + Nginx)             │
│                   Container: frontend                    │
│  - Serve SPA (HTML/JS/CSS)                              │
│  - Proxy reverso /auth/* e /submissions/* → backend     │
│  - Porta interna: 80                                    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP interno (Docker network)
                         ▼
┌─────────────────────────────────────────────────────────┐
│             Backend (Node.js + Express)                  │
│                   Container: backend                     │
│  - API REST com JWT                                     │
│  - Upload multipart (Multer)                            │
│  - Rate limiting, Helmet, CORS                          │
│  - Auto-migration na inicialização                      │
│  - Porta interna: 4000                                  │
└─────────┬──────────────────────────┬────────────────────┘
          │                          │
          ▼                          ▼
┌──────────────────┐    ┌──────────────────────┐
│   PostgreSQL 16  │    │    Volume: uploads    │
│  Container: pg   │    │  /app/uploads/        │
│  Volume: pgdata  │    │  YYYY_MM/uuid.ext     │
└──────────────────┘    └──────────────────────┘
```

**Stack:**
- **Frontend:** React 18 + Vite + React Router v6, servido por Nginx com proxy reverso integrado
- **Backend:** Node.js 20 + Express 4 + Multer + JWT + pg
- **Banco de dados:** PostgreSQL 16
- **Deploy:** Docker Compose (compatível com EasyPanel)

**Fluxo:**
1. O Nginx serve o SPA e faz proxy de `/auth/*` e `/submissions/*` para o backend
2. O frontend nunca acessa o backend diretamente — tudo passa pelo Nginx (mesma origem = sem CORS para o browser)
3. Arquivos ficam no volume `uploads` com nomes UUID; metadados no PostgreSQL

---

## B) Estrutura de Pastas

```
trabalhos-app/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── migrations/
│   │   └── 001_init.sql
│   └── src/
│       ├── index.js          # Entry point, auto-migrate
│       ├── config.js         # Variáveis de ambiente
│       ├── db.js             # Pool PostgreSQL
│       ├── migrate.js        # Script de migração manual
│       ├── middleware/
│       │   ├── auth.js       # JWT middleware
│       │   └── upload.js     # Multer config
│       ├── routes/
│       │   ├── auth.js       # Login aluno/admin
│       │   └── submissions.js # CRUD de envios
│       └── utils/
│           └── preview.js    # Preview de arquivos texto
└── frontend/
    ├── Dockerfile
    ├── .dockerignore
    ├── nginx.conf            # Proxy reverso + SPA
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx           # Rotas
        ├── api.js            # API client
        ├── index.css         # Estilos globais
        ├── context/
        │   └── AuthContext.jsx
        ├── components/
        │   └── Layout.jsx
        └── pages/
            ├── StudentLogin.jsx
            ├── SubmitWork.jsx
            ├── AdminLogin.jsx
            ├── AdminDashboard.jsx
            └── AdminDetail.jsx
```

---

## C) Rotas da API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/student-login` | — | Login do aluno |
| POST | `/auth/admin-login` | — | Login do admin |
| POST | `/submissions` | student | Upload de trabalho |
| GET | `/submissions` | admin | Lista com filtros e paginação |
| GET | `/submissions/export/csv` | admin | Exporta CSV |
| GET | `/submissions/:id` | admin | Detalhes do envio |
| GET | `/submissions/:id/download` | admin | Download do arquivo |
| GET | `/submissions/:id/preview` | admin | Preview texto/código |
| PATCH | `/submissions/:id` | admin | Atualiza status/feedback |
| GET | `/health` | — | Health check |

---

## D) Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `POSTGRES_PASSWORD` | `postgres_secret_2024` | Senha do PostgreSQL |
| `ADMIN_USER` | `admin` | Usuário do painel admin |
| `ADMIN_PASS` | `admin123` | Senha do painel admin |
| `STUDENT_USER` | `aluno` | Usuário de login dos alunos |
| `STUDENT_PASS` | `123456` | Senha de login dos alunos |
| `JWT_SECRET` | — | **OBRIGATÓRIO**: String longa aleatória |
| `JWT_EXPIRES_IN` | `8h` | Tempo de expiração do token |
| `MAX_UPLOAD_MB` | `50` | Tamanho máximo de upload (MB) |
| `CORS_ORIGIN` | `*` | Origens permitidas (CORS) |
| `APP_PORT` | `3000` | Porta exposta no host |

---

## E) Deploy no EasyPanel — Passo a Passo

### 1. Preparar o código

```bash
# Na sua máquina local
cd trabalhos-app
cp .env.example .env
# Edite o .env com suas senhas reais
```

Suba para um repositório Git (GitHub, GitLab, etc.) ou transfira via `scp` para a VPS.

### 2. Opção A: Deploy via Docker Compose direto na VPS

```bash
# Na VPS, clone o repositório
git clone https://github.com/seu-user/trabalhos-app.git
cd trabalhos-app

# Configurar variáveis
cp .env.example .env
nano .env  # Configure TODAS as variáveis (especialmente JWT_SECRET, senhas)

# Subir tudo
docker compose up -d --build

# Verificar logs
docker compose logs -f

# Testar
curl http://localhost:3000/health
```

### 3. Opção B: Deploy via EasyPanel

#### 3.1 Criar projeto no EasyPanel

1. Acesse o painel do EasyPanel (`https://seu-servidor:3000` ou a porta configurada)
2. Clique em **"Create Project"** → dê o nome `trabalhos`

#### 3.2 Adicionar serviço PostgreSQL

1. Dentro do projeto, clique **"+ Service"** → **"Database"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `postgres`
   - **Password:** Defina uma senha forte
3. O EasyPanel gera a `DATABASE_URL` automaticamente. Anote-a.

#### 3.3 Adicionar serviço Backend

1. **"+ Service"** → **"App"**
2. Configure:
   - **Name:** `backend`
   - **Source:** Git Repository (aponte para o repo, subpath: `backend`)
   - **Dockerfile path:** `./Dockerfile`
3. **Environment Variables:**
   ```
   PORT=4000
   DATABASE_URL=postgresql://postgres:SUA_SENHA@postgres.trabalhos.internal:5432/trabalhos
   ADMIN_USER=admin
   ADMIN_PASS=SuaSenhaForteAqui
   STUDENT_USER=aluno
   STUDENT_PASS=123456
   JWT_SECRET=string_aleatoria_com_pelo_menos_32_caracteres
   MAX_UPLOAD_MB=50
   UPLOADS_DIR=/app/uploads
   CORS_ORIGIN=*
   ```
4. **Volumes:** Monte `/app/uploads` (persistente)
5. **Networking:** Porta 4000 (interna, sem expor publicamente)

#### 3.4 Adicionar serviço Frontend

1. **"+ Service"** → **"App"**
2. Configure:
   - **Name:** `frontend`
   - **Source:** Git Repository (subpath: `frontend`)
   - **Dockerfile path:** `./Dockerfile`
   - **Build args:** `VITE_API_URL=` (vazio)
3. **Networking:** Porta 80
4. **Domain:** Configure o domínio (ex: `trabalhos.seudominio.com`)
5. **HTTPS:** O EasyPanel + Traefik configuram SSL automaticamente

> **IMPORTANTE:** No `nginx.conf` do frontend, mude `backend:4000` para `backend.trabalhos.internal:4000` (nome DNS interno do EasyPanel). Caso o nome seja diferente, verifique no painel do EasyPanel o hostname interno do serviço backend.

#### 3.5 Verificar deploy

1. Acesse `https://trabalhos.seudominio.com/health` — deve retornar `{"status":"ok"}`
2. Acesse `https://trabalhos.seudominio.com/login` — tela de login do aluno
3. Acesse `https://trabalhos.seudominio.com/admin/login` — tela de login admin

---

## F) Guia de Uso

### Para Alunos

1. Acesse o site → página de login
2. Entre com as credenciais fornecidas pelo professor (ex: `aluno` / `123456`)
3. Preencha o formulário:
   - **Nome completo**
   - **RA / Número**
   - **Matéria**
   - **Título do trabalho**
   - **Observações** (opcional)
   - **Arquivo** (qualquer tipo, até 50MB)
4. Clique em **"Enviar Trabalho"**
5. Anote o ID do envio para referência

### Para o Professor (Admin)

1. Acesse `/admin/login`
2. Entre com credenciais de admin
3. No painel:
   - **Filtrar** por busca, matéria, status, data
   - **Clicar em "Ver"** para abrir detalhes de um envio
   - **Preview:** Arquivos de texto/código (.js, .py, .html, etc.) são exibidos diretamente
   - **Download:** Qualquer arquivo pode ser baixado
   - **Status:** Altere para "Em correção" ou "Corrigido"
   - **Feedback:** Adicione comentários
   - **Exportar CSV:** Botão no topo da lista

---

## G) Segurança — Boas Práticas

### Implementado

- **JWT com expiração** (8h padrão) para autenticação
- **Rate limiting**: 300 req/15min geral, 20 req/15min para login
- **Helmet**: Headers de segurança (XSS, MIME sniffing, etc.)
- **Nomes aleatórios (UUID)**: Arquivos salvos com nome UUID, sem relação com o original
- **Path traversal prevention**: Valida nome do arquivo, rejeita `..`, `/`, `\`
- **Nunca executa arquivos enviados**: Nginx bloqueia acesso direto à pasta de uploads
- **Tamanho máximo configurável** por ENV
- **CORS configurável** por ENV

### Recomendações adicionais

1. **Troque TODAS as senhas padrão** antes de colocar em produção
2. **JWT_SECRET**: Use pelo menos 32 caracteres aleatórios:
   ```bash
   openssl rand -hex 32
   ```
3. **HTTPS obrigatório**: O Traefik do EasyPanel cuida disso automaticamente
4. **Antivírus (opcional)**: Para adicionar ClamAV:
   ```yaml
   # Adicione ao docker-compose.yml
   clamav:
     image: clamav/clamav:latest
     restart: always
     volumes:
       - uploads:/scandir:ro
   ```
   E no backend, antes de salvar, chame `clamdscan` no arquivo.

5. **Backup — PostgreSQL:**
   ```bash
   # Backup
   docker compose exec postgres pg_dump -U postgres trabalhos > backup_$(date +%Y%m%d).sql
   
   # Restore
   docker compose exec -T postgres psql -U postgres trabalhos < backup_20240101.sql
   ```

6. **Backup — Uploads:**
   ```bash
   # Backup da pasta de uploads
   docker compose cp backend:/app/uploads ./backup_uploads_$(date +%Y%m%d)
   
   # Ou via volume
   docker run --rm -v trabalhos-app_uploads:/data -v $(pwd):/backup alpine \
     tar czf /backup/uploads_$(date +%Y%m%d).tar.gz /data
   ```

7. **Script de backup automático (cron):**
   ```bash
   # Adicione ao crontab (crontab -e)
   0 3 * * * cd /path/to/trabalhos-app && docker compose exec -T postgres pg_dump -U postgres trabalhos | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
   0 3 * * * docker run --rm -v trabalhos-app_uploads:/data -v /backups:/backup alpine tar czf /backup/uploads_$(date +\%Y\%m\%d).tar.gz /data
   ```

---

## H) Checklist de Testes

- [ ] **Login aluno:** Acessar `/login`, entrar com `aluno`/`123456`
- [ ] **Login admin:** Acessar `/admin/login`, entrar com `admin`/`admin123`
- [ ] **Login inválido:** Tentar credenciais erradas → mensagem de erro
- [ ] **Enviar trabalho:** Preencher formulário + arquivo → mensagem de sucesso
- [ ] **Validação:** Tentar enviar sem nome/RA/arquivo → erros de validação
- [ ] **Arquivo grande:** Testar upload próximo do limite (50MB)
- [ ] **Lista admin:** Ver todos os envios na tabela
- [ ] **Filtros:** Filtrar por matéria, status, busca textual, data
- [ ] **Paginação:** Criar 25+ envios e navegar páginas
- [ ] **Detalhes:** Clicar "Ver" e verificar informações corretas
- [ ] **Preview:** Enviar um `.js` ou `.py` e verificar preview no admin
- [ ] **Download:** Baixar o arquivo e verificar integridade
- [ ] **Status + Feedback:** Alterar status, adicionar feedback, salvar
- [ ] **CSV:** Exportar CSV e abrir no Excel
- [ ] **Expiração JWT:** Esperar token expirar → redirect para login
- [ ] **Responsivo:** Testar em celular/tablet
- [ ] **Health check:** Acessar `/health` → `{"status":"ok"}`

---

## I) Atualização do Sistema

```bash
# Na VPS
cd /path/to/trabalhos-app
git pull
docker compose up -d --build
```

O backend aplica migrations automaticamente ao iniciar. Dados e uploads são preservados nos volumes Docker.

---

## Licença

Projeto interno para uso educacional.
