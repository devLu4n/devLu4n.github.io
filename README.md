# Aladin

Plataforma de vagas de tecnologia em Alagoas, organizada em frontend multipágina e API REST.

## Estrutura

- `frontend/`: Vite, Tailwind CSS e JavaScript vanilla.
- `backend/`: Express, Prisma, PostgreSQL e autenticação por sessão.

## Requisitos

- Node.js 20.19 ou superior.
- PostgreSQL.

## Desenvolvimento

Instale as dependências em cada aplicação:

```bash
cd frontend
npm install

cd ../backend
npm install
```

Copie `backend/.env.example` para `backend/.env`, preencha `DATABASE_URL` e `SESSION_SECRET`, e execute as migrations:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Em outro terminal:

```bash
npm run dev:frontend
```

O frontend usa `http://localhost:5173` e encaminha `/api` para `http://localhost:3333` durante o desenvolvimento.

## Qualidade

Na raiz do repositório:

```bash
npm test
npm run build
npm run audit
```

Consulte [frontend/README.md](frontend/README.md) e [backend/README.md](backend/README.md) para detalhes de cada aplicação.
