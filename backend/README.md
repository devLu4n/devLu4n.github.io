# Backend do Aladin

API REST construída com Node.js, Express, Prisma e PostgreSQL.

Consulte o [README principal](../README.md) para instalação completa, arquitetura, Docker e deploy.

## Comandos

Execute dentro de `backend/`:

```bash
npm ci
npm run prisma:generate
npx prisma migrate dev
npm run dev
```

Outros comandos disponíveis:

| Comando | Descrição |
| --- | --- |
| `npm start` | Inicia a API sem recarregamento automático |
| `npm test` | Executa os testes com Jest |
| `npm run prisma:generate` | Gera o Prisma Client |
| `npm run prisma:migrate` | Cria ou aplica migrations em desenvolvimento |
| `npm run prisma:studio` | Abre a interface de inspeção do Prisma |
| `npm run prisma:seed` | Insere dados opcionais de desenvolvimento |

## Variáveis de ambiente

Crie `.env` a partir de `.env.example`:

| Variável | Obrigatoriedade | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | Obrigatória | Conexão PostgreSQL utilizada pelo Prisma e pelas sessões |
| `PORT` | Opcional | Porta da API; padrão `3333` |
| `NODE_ENV` | Recomendada | `development`, `test` ou `production` |
| `SESSION_SECRET` | Obrigatória em produção | Assinatura criptográfica da sessão |
| `CORS_ORIGIN` | Opcional | Origem autorizada; padrão `http://localhost:5173` |

## Estrutura

```text
prisma/          schema, migrations e seed
src/config/      integrações de infraestrutura
src/controllers/ adaptadores HTTP
src/middlewares/ autenticação, autorização e erros
src/routes/      endpoints da API
src/services/    regras de negócio
src/utils/       funções utilitárias
src/__tests__/   testes automatizados
```

Em produção, aplique migrations com:

```bash
npx prisma migrate deploy
```
