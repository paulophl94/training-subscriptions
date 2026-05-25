import { securePart } from '../lib/cookie-attrs.js';

export default function handler(req, res) {
  const sec = securePart(req);
  const clearSession = `__session=; Path=/; HttpOnly${sec}; SameSite=Lax; Max-Age=0`;

  res.setHeader('Set-Cookie', clearSession);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(
    `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Sessao encerrada</title></head>
<body style="font-family:system-ui;padding:2rem;">
  <p>Voce saiu. <a href="/">Entrar novamente</a>.</p>
</body>
</html>`,
  );
}
