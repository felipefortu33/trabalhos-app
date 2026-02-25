const fs = require('fs');
const path = require('path');

// Extensões consideradas "texto" para preview
const TEXT_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
  '.cs', '.rb', '.go', '.rs', '.php', '.swift', '.kt', '.scala',
  '.html', '.htm', '.css', '.scss', '.sass', '.less',
  '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
  '.md', '.txt', '.csv', '.log', '.sh', '.bash', '.bat', '.ps1',
  '.sql', '.r', '.m', '.lua', '.pl', '.asm', '.s',
  '.dockerfile', '.makefile', '.gitignore', '.env',
  '.vue', '.svelte', '.astro',
]);

// Mapeia extensão para linguagem (para syntax highlighting)
const LANG_MAP = {
  '.js': 'javascript', '.jsx': 'javascript', '.ts': 'typescript', '.tsx': 'typescript',
  '.py': 'python', '.java': 'java', '.c': 'c', '.cpp': 'cpp', '.h': 'c', '.hpp': 'cpp',
  '.cs': 'csharp', '.rb': 'ruby', '.go': 'go', '.rs': 'rust', '.php': 'php',
  '.html': 'html', '.htm': 'html', '.css': 'css', '.scss': 'scss',
  '.json': 'json', '.xml': 'xml', '.yaml': 'yaml', '.yml': 'yaml',
  '.md': 'markdown', '.txt': 'text', '.sql': 'sql', '.sh': 'bash',
  '.bat': 'batch', '.ps1': 'powershell', '.r': 'r', '.lua': 'lua',
  '.vue': 'vue', '.svelte': 'svelte',
};

/**
 * Verifica se um arquivo é "texto" (previewável).
 */
function isTextFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

/**
 * Lê o conteúdo do arquivo para preview (limitado a 500KB).
 */
function getPreview(filePath, filename) {
  const ext = path.extname(filename).toLowerCase();
  const language = LANG_MAP[ext] || 'text';
  const maxBytes = 500 * 1024; // 500KB

  const stats = fs.statSync(filePath);
  const truncated = stats.size > maxBytes;

  const buffer = Buffer.alloc(Math.min(stats.size, maxBytes));
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, buffer.length, 0);
  fs.closeSync(fd);

  const content = buffer.toString('utf8');

  return {
    language,
    content,
    truncated,
    totalSize: stats.size,
  };
}

module.exports = { isTextFile, getPreview };
