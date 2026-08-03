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

## CI/CD na AWS

O workflow `.github/workflows/ci-cd.yml` executa testes, build e validação da imagem Docker em pull requests. Em pushes na branch `main`, ele publica a imagem no Amazon ECR e atualiza o serviço no Amazon ECS.

Configure o environment `production` no GitHub com:

- Secret `AWS_ROLE_TO_ASSUME`: ARN da IAM Role autorizada para GitHub Actions via OIDC.
- Variables `AWS_REGION`, `ECR_REPOSITORY`, `ECS_CLUSTER`, `ECS_SERVICE`, `ECS_TASK_DEFINITION` e `ECS_CONTAINER_NAME`.

A task definition deve fornecer `DATABASE_URL`, `SESSION_SECRET` e as demais variáveis de produção ao contêiner. As migrations do Prisma devem ser executadas como uma etapa controlada de deploy antes de alterações que modifiquem o banco.
