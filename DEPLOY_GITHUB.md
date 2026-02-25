# 🚀 Deploy no GitHub - Instruções

## Passo 1: Criar Repositório no GitHub

1. Acesse: **https://github.com/new**
2. Preencha os dados:
   - **Repository name:** `trabalhos-app`
   - **Description:** `Sistema de envio e gerenciamento de trabalhos de alunos`
   - **Visibilidade:** Private ou Public (sua escolha)
   - ⚠️ **NÃO** marque "Initialize this repository with a README"
3. Clique em **"Create repository"**

## Passo 2: Configurar Remote e Fazer Push

Após criar o repositório, você verá uma página com instruções. Use os comandos abaixo:

```powershell
# Substitua SEU_USER pelo seu usuário do GitHub
git remote add origin https://github.com/SEU_USER/trabalhos-app.git

# Fazer push da branch main
git push -u origin main
```

### Exemplo completo:

```powershell
# Se seu usuário for "professor123"
git remote add origin https://github.com/professor123/trabalhos-app.git
git push -u origin main
```

## Passo 3: Verificar

Acesse `https://github.com/SEU_USER/trabalhos-app` e confirme que todos os arquivos estão lá.

---

## Autenticação

Se for a primeira vez fazendo push, o GitHub pode pedir autenticação:

### Opção 1: GitHub CLI (recomendado)
```powershell
gh auth login
```

### Opção 2: Personal Access Token
1. Vá em: https://github.com/settings/tokens
2. Generate new token (classic)
3. Marque: `repo`, `workflow`
4. Copie o token
5. Use o token como senha quando o git pedir

### Opção 3: SSH
```powershell
# Gerar chave SSH (se não tiver)
ssh-keygen -t ed25519 -C "seu_email@example.com"

# Adicionar ao ssh-agent
ssh-add ~/.ssh/id_ed25519

# Copiar chave pública
Get-Content ~/.ssh/id_ed25519.pub | Set-Clipboard

# Adicionar em: https://github.com/settings/ssh/new
```

Depois usar URL SSH:
```powershell
git remote set-url origin git@github.com:SEU_USER/trabalhos-app.git
git push -u origin main
```

---

## Comandos Úteis

```powershell
# Ver remote configurado
git remote -v

# Remover remote (caso precise reconfigurar)
git remote remove origin

# Ver status dos commits
git log --oneline

# Ver diferenças
git status
```

---

## Próximos Passos

Após subir para o GitHub, você pode:

1. **Fazer deploy no EasyPanel** seguindo o [README.md](README.md#e-deploy-no-easypanel--passo-a-passo)
2. **Clonar em outro computador:** `git clone URL_DO_REPO`
3. **Fazer atualizações:** Edite, `git commit`, `git push`
