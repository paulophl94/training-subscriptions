import { readFileSync, writeFileSync } from 'node:fs';

const templatePath = process.argv[2];
const outPath = process.argv[3];
const origin = process.argv[4];
const proxyBase = process.argv[5] || 'https://nube-auth.vercel.app';
const shortName = process.argv[6] || 'Enablement Assinaturas';

const norm = (u) => u.replace(/\/+$/, '');
const href = `${norm(proxyBase)}/api/auth?origin=${encodeURIComponent(norm(origin))}`;

let html = readFileSync(templatePath, 'utf8');
html = html.replaceAll('{{AUTH_LOGIN_HREF}}', href);
html = html.replaceAll('{{PROJECT_NAME}}', `${shortName} | Acesso`);
html = html.replaceAll('{{PROJECT_BADGE}}', 'Documento interno');
html = html.replaceAll(
  '{{LOGIN_SUBTITLE}}',
  'Acesso restrito a colaboradores.<br>Entre com a sua conta corporativa.',
);
html = html.replaceAll(
  '{{ALLOWED_DOMAINS_HTML}}',
  '<span class="login-domain">@nuvemshop.com.br</span> e <span class="login-domain">@tiendanube.com</span>',
);

writeFileSync(outPath, html, 'utf8');
console.log('OK:', outPath);
