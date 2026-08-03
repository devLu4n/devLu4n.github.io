# Frontend do Aladin

Frontend multipágina construído com Vite, Tailwind CSS 4 e JavaScript.

Consulte o [README principal](../README.md) para instalação completa, funcionalidades, Docker e deploy.

## Comandos

Execute dentro de `frontend/`:

```bash
npm ci
npm run dev
npm run build
npm run preview
```

O servidor de desenvolvimento utiliza `http://localhost:5173` e encaminha `/api` para `http://localhost:3333`.

Para apontar o frontend para outra API, defina:

```env
VITE_API_URL=https://api.exemplo.com/api
```

## Estrutura

```text
public/assets/   imagens e arquivos públicos
src/components/ comportamentos visuais compartilhados
src/core/       autenticação, autorização e sessão
src/features/   funcionalidades organizadas por domínio
src/pages/      entradas HTML da aplicação multipágina
src/api.js      cliente HTTP
src/main.js     inicialização das páginas
src/style.css   estilos compartilhados
```

Todas as páginas de produção precisam estar registradas em `vite.config.js`. O build preserva a estrutura de caminhos dentro de `dist/`.
