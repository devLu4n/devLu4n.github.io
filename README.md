# Aladin

Plataforma de recrutamento voltada a vagas de tecnologia. O sistema conecta candidatos e empresas em um fluxo completo de publicação, candidatura e acompanhamento de processo seletivo.

## Funcionalidades

### Candidato

- Cadastro e autenticação com sessão.
- Perfil profissional com foto, biografia, localização e tecnologias.
- Busca e filtragem de vagas por área, cidade e modalidade.
- Visualização completa da vaga e da empresa responsável.
- Candidatura com currículo obrigatório em PDF ou DOCX.
- Acompanhamento das próprias candidaturas.
- Status do processo seletivo: `Novo`, `Em análise`, `Entrevista`, `Aprovado` ou `Rejeitado`.
- Exclusão da própria conta e dos dados relacionados.

### Empresa

- Perfil empresarial com foto, biografia e localização.
- Publicação, edição, gerenciamento e encerramento de vagas.
- Visualização dos candidatos de cada vaga.
- Download do currículo enviado pelo candidato.
- Gerenciamento do processo seletivo com transições de status controladas.
- Exclusão da própria conta, vagas e dados relacionados.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | Vite, Tailwind CSS 4 e JavaScript |
| Backend | Node.js, Express e Prisma ORM |
| Banco de dados | PostgreSQL |
| Autenticação | Express Session, PostgreSQL Session Store e bcryptjs |
| Testes | Jest |
| Conteinerização | Docker multi-stage |
| AWS | Lambda, API Gateway HTTP API, Amazon RDS e Secrets Manager |
| CI/CD | GitHub Actions e AWS SAM |

## Arquitetura

O frontend é uma aplicação multipágina. Cada arquivo HTML é uma entrada do build do Vite, enquanto regras compartilhadas são organizadas por responsabilidade.

```text
frontend/
├── public/assets/                  arquivos estáticos
├── src/
│   ├── components/                componentes e comportamentos compartilhados
│   ├── core/                      autenticação, autorização e sessão
│   ├── features/                  módulos organizados por domínio
│   ├── pages/
│   │   ├── login/
│   │   ├── signup/
│   │   └── main/
│   │       ├── empresa/           páginas exclusivas da empresa
│   │       └── user/              páginas do candidato
│   ├── api.js                     cliente HTTP
│   ├── main.js                    inicialização das páginas
│   └── style.css                  estilos compartilhados
└── vite.config.js                 entradas do build multipágina
```

O backend segue uma separação entre transporte HTTP, regras de negócio e persistência.

```text
backend/
├── prisma/
│   ├── migrations/                histórico versionado do banco
│   ├── schema.prisma              entidades e relacionamentos
│   └── seed.js                    dados opcionais de desenvolvimento
└── src/
    ├── __tests__/                 testes automatizados
    ├── config/                    configuração do Prisma
    ├── controllers/               entrada e saída das requisições
    ├── middlewares/               autenticação, papéis e erros
    ├── routes/                    definição dos endpoints
    ├── services/                  regras de negócio reutilizáveis
    ├── utils/                     utilitários puros
    ├── app.js                     configuração do Express
    ├── lambda.js                  adaptador para AWS Lambda
    └── server.js                  inicialização do servidor local
```

O mesmo Express continua funcionando localmente por `server.js`. Na AWS, `lambda.js` entrega a aplicação ao API Gateway sem abrir uma porta HTTP.

## Pré-requisitos

- Node.js 20.19 ou superior.
- npm 10 ou superior.
- PostgreSQL acessível pela aplicação.
- Docker, opcional para execução conteinerizada.

## Configuração local

Clone o repositório e instale as dependências:

```bash
npm ci
npm ci --prefix frontend
npm ci --prefix backend
```

Crie `backend/.env` a partir de `backend/.env.example` e configure:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/aladin?schema=public"
PORT=3333
NODE_ENV=development
SESSION_SECRET="substitua-por-um-segredo-longo-e-aleatorio"
CORS_ORIGIN="http://localhost:5173"
```

`SESSION_SECRET` é obrigatório em produção e deve ser diferente do valor utilizado no desenvolvimento.

Prepare o banco de dados:

```bash
cd backend
npm run prisma:generate
npx prisma migrate dev
npm run prisma:seed
cd ..
```

O seed é opcional e deve ser utilizado apenas em ambientes de desenvolvimento.

Inicie frontend e backend simultaneamente:

```bash
npm run dev
```

Serviços locais:

- Frontend: `http://localhost:5173`
- API: `http://localhost:3333/api`
- Health check: `http://localhost:3333/health`

Durante o desenvolvimento, o Vite encaminha chamadas de `/api` para o backend. Para utilizar uma API em outra origem, configure `VITE_API_URL` no ambiente do frontend.

## Comandos

Execute os comandos a partir da raiz do projeto:

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia frontend e backend em modo de desenvolvimento |
| `npm run dev:frontend` | Inicia apenas o Vite |
| `npm run dev:backend` | Inicia apenas a API |
| `npm run build` | Gera o build de produção do frontend |
| `npm test` | Executa os testes do backend |
| `npm run audit` | Verifica vulnerabilidades conhecidas nas dependências |

## Fluxo das candidaturas

As mudanças de status são validadas no backend. Não é permitido pular etapas ou reabrir um processo concluído.

```text
Novo
  └── Em análise
        └── Entrevista
              ├── Aprovado
              └── Rejeitado
```

`Aprovado` e `Rejeitado` são estados finais.

## API

A API utiliza o prefixo `/api` e autenticação por cookie de sessão.

| Recurso | Base | Responsabilidade |
| --- | --- | --- |
| Autenticação | `/api/auth` | Cadastro, login, logout, sessão e exclusão da conta |
| Empresas | `/api/empresas` | Perfis empresariais e consulta pública |
| Vagas | `/api/vagas` | Publicação, filtros, atualização e encerramento |
| Candidatos | `/api/candidatos` | Perfil profissional do candidato |
| Candidaturas | `/api/candidaturas` | Inscrição, acompanhamento e processo seletivo |

Principais regras de segurança:

- Senhas são armazenadas somente como hash bcrypt.
- Sessões usam cookies `httpOnly`.
- Rotas privadas validam autenticação e papel da conta.
- Empresas só podem alterar suas próprias vagas e candidaturas.
- Candidatos só podem alterar os próprios dados.
- A exclusão da conta usa o usuário da sessão, sem aceitar um ID informado pelo cliente.
- Relações dependentes são removidas pelo banco com `ON DELETE CASCADE`.

## Testes e build

Antes de abrir um pull request, execute:

```bash
npm test
npm run build
git diff --check
```

Os testes cobrem autenticação, candidatos, empresas, vagas, candidaturas, validação de transições e utilitários.

## Docker

O `Dockerfile` usa múltiplos estágios para compilar o frontend e instalar somente as dependências necessárias em produção. O mesmo contêiner serve a API e os arquivos estáticos gerados pelo Vite.

Crie a imagem:

```bash
docker build -t aladin:local .
```

Execute o contêiner com variáveis de produção:

```bash
docker run --rm -p 3333:3333 --env-file backend/.env aladin:local
```

Quando o PostgreSQL estiver na máquina hospedeira, ajuste o host de `DATABASE_URL` para um endereço alcançável pelo contêiner, como `host.docker.internal` no Docker Desktop.

O contêiner expõe a porta `3333` e possui health check em `/health`.

## Backend serverless na AWS

O arquivo `template.yaml` descreve a API como infraestrutura versionada:

- API Gateway HTTP API como entrada pública.
- Lambda empacotada pela imagem `Dockerfile.lambda`.
- acesso ao PostgreSQL do RDS por subnets e security groups informados no deploy.
- `DATABASE_URL` e `SESSION_SECRET` obtidos de um segredo do Secrets Manager.
- retenção dos logs da Lambda por sete dias.
- limite de conexões configurado na `DATABASE_URL` para proteger o banco em cada execução da Lambda.

O arquivo `infrastructure/database.yaml` cria o RDS PostgreSQL privado, os security groups e o grupo de subnets. A senha mestra é gerada e armazenada automaticamente pela AWS. Como este é um ambiente de estudo com foco em controle de custo, excluir a stack também exclui o banco e seus backups automáticos; faça uma exportação antes de excluir caso precise preservar os dados.

O segredo deve ser um objeto JSON com estas chaves:

```json
{
  "DATABASE_URL": "postgresql://usuario:senha@host:5432/aladin?schema=public",
  "SESSION_SECRET": "segredo-longo-e-aleatorio"
}
```

Depois que o RDS, o segredo, as subnets e os security groups estiverem prontos, o deploy manual em Ohio pode ser iniciado com:

```bash
sam build
sam deploy --guided --profile luan-admin --region us-east-2
```

Informe `https://devlu4n.github.io` em `AllowedOrigin`. Ao final, copie o output `ApiUrl`, acrescente `/api` e use o resultado como `PUBLIC_API_URL` no GitHub.

As migrations não são executadas pela Lambda. Antes da primeira publicação e sempre que o schema mudar, execute `npx prisma migrate deploy` em um ambiente com acesso de rede ao RDS.

## CI/CD na AWS

O workflow `.github/workflows/ci-cd.yml` possui duas etapas.

### Integração contínua

Executada em pull requests e pushes para `main`:

1. Instala as dependências com `npm ci`.
2. Gera o Prisma Client.
3. Executa os testes do backend.
4. Compila o frontend.
5. Valida as imagens Docker local e da Lambda.

### Entrega contínua

Executada após a integração contínua em pushes para `main`:

1. Autentica na AWS por OpenID Connect.
2. Compila a aplicação com AWS SAM.
3. Publica a imagem no ECR gerenciado pelo SAM.
4. Cria ou atualiza a stack da Lambda e do API Gateway.

O deploy automático só é executado quando a variável `AWS_DEPLOY_ENABLED` tem o valor `true`. Mantenha-a desativada até concluir o RDS, a rede e o segredo.

Configure um environment chamado `production` no GitHub.

Secret obrigatório:

| Nome | Descrição |
| --- | --- |
| `AWS_ROLE_TO_ASSUME` | ARN da IAM Role que confia no provedor OIDC do GitHub |

Variables obrigatórias:

| Nome | Descrição |
| --- | --- |
| `AWS_REGION` | Região dos recursos AWS |
| `AWS_DEPLOY_ENABLED` | Use `true` somente quando a infraestrutura estiver pronta |
| `FRONTEND_ORIGIN` | Origem do frontend, sem barra final |
| `APPLICATION_SECRET_ARN` | ARN do segredo da aplicação no Secrets Manager |
| `LAMBDA_SUBNET_IDS` | IDs das subnets separados por vírgula |
| `LAMBDA_SECURITY_GROUP_IDS` | IDs dos security groups separados por vírgula |

## GitHub Pages

O mesmo workflow publica `frontend/dist` no GitHub Pages após um push aprovado na branch `main`. Como este repositório é `devLu4n.github.io`, o frontend fica disponível em:

```text
https://devlu4n.github.io/
```

No repositório do GitHub, acesse `Settings > Pages` e selecione `GitHub Actions` em `Source`. Não selecione a raiz da branch `main`, pois ela contém o código-fonte e o README, não os arquivos compilados do frontend.

Configure a repository variable `PUBLIC_API_URL` com o endereço público completo da API, incluindo `/api`:

```text
https://api.seudominio.com/api
```

Sem essa variável, o frontend publicado tentará acessar `/api` no próprio domínio do GitHub Pages. Como o GitHub Pages hospeda somente arquivos estáticos, autenticação, vagas e candidaturas dependerão de um backend publicado separadamente.

O backend deve configurar `CORS_ORIGIN=https://devlu4n.github.io` para aceitar cookies e requisições do site publicado. Em uma implantação com frontend e API em domínios diferentes, revise também as políticas `SameSite`, `Secure` e CORS dos cookies de sessão.

## Licença

Este repositório ainda não possui uma licença definida. Adicione um arquivo `LICENSE` antes de distribuir ou reutilizar o código fora do escopo autorizado pelo projeto.
