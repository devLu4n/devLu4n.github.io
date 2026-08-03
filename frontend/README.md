# Frontend do Aladin

Frontend multipágina construído com Vite, Tailwind CSS 4 e JavaScript vanilla.

## Comandos

```bash
npm install
npm run dev
npm run build
npm run preview
```

O servidor de desenvolvimento abre em `http://localhost:5173` e encaminha requisições `/api` para o backend em `http://localhost:3333`.

Para usar uma API em outra origem, defina:

```env
VITE_API_URL=https://api.exemplo.com/api
```

## Páginas

Todas as páginas em `src/pages` são entradas do build configuradas em `vite.config.js`. O diretório de saída preserva a mesma estrutura de caminhos.

Os estilos compartilhados ficam em `src/style.css`, os tokens em `tailwind.config.js`, as integrações comuns em `src/main.js` e o cliente HTTP em `src/api.js`.
