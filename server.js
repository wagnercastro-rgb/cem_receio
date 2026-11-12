const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const envPath = path.join(root, '.env');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function loadDotEnv() {
  if (!fs.existsSync(envPath)) return;
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv();

function assertPublicSupabaseKey(key) {
  if (!key) return;
  if (/^sb_secret_/i.test(key)) {
    throw new Error('SUPABASE_ANON_KEY precisa ser uma chave pública anon/publishable; chaves secretas não podem ser enviadas ao navegador.');
  }
  const parts = key.split('.');
  if (parts.length !== 3) return;
  try {
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (claims.role === 'service_role') {
      throw new Error('SUPABASE_ANON_KEY precisa ser uma chave pública anon/publishable; chaves privilegiadas não podem ser enviadas ao navegador.');
    }
  } catch (error) {
    if (error.message.includes('SUPABASE_ANON_KEY')) throw error;
    // Publishable keys are not JWTs; malformed non-JWT values will fail in the client.
  }
}

assertPublicSupabaseKey(process.env.SUPABASE_ANON_KEY || '');

// Somente a URL e a chave pública anon/publishable são enviadas ao navegador.
// Não inclua service_role ou qualquer credencial privilegiada nesta resposta.
const publicConfig = [
  `export const SUPABASE_URL = ${JSON.stringify(process.env.SUPABASE_URL || '')};`,
  `export const SUPABASE_ANON_KEY = ${JSON.stringify(process.env.SUPABASE_ANON_KEY || '')};`,
  ''
].join('\n');

const server = http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end('Método não permitido.');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  } catch {
    response.writeHead(400).end('Endereço inválido.');
    return;
  }

  if (pathname === '/js/config.js') {
    response.writeHead(200, {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    response.end(request.method === 'HEAD' ? undefined : publicConfig);
    return;
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const segments = relativePath.replace(/\\/g, '/').split('/');
  const publicRoots = new Set(['css', 'js', 'images']);
  const isPublicFile = relativePath === 'index.html' || publicRoots.has(segments[0]);
  if (!isPublicFile || segments.some((segment) => segment.startsWith('.'))) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Página não encontrada.');
    return;
  }

  const filePath = path.resolve(root, relativePath);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end('Acesso negado.');
    return;
  }

  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Página não encontrada.');
      return;
    }
    response.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': path.extname(filePath).toLowerCase() === '.html' ? 'no-cache' : 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY'
    });
    if (request.method === 'HEAD') { response.end(); return; }
    fs.createReadStream(filePath)
      .on('error', () => {
        if (!response.headersSent) response.writeHead(500);
        response.end('Erro ao ler o arquivo.');
      })
      .pipe(response);
  });
});

const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT precisa ser um número inteiro entre 1 e 65535.');
}

server.listen(port, '0.0.0.0', () => {
  console.log(`Site disponível na porta ${port} (local: http://127.0.0.1:${port})`);
});
