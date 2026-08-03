CREATE TYPE "TipoUsuario" AS ENUM (
    'CANDIDATO',
    'EMPRESA'
);

CREATE TYPE "Modalidade" AS ENUM (
    'REMOTO',
    'HIBRIDO',
    'PRESENCIAL'
);

CREATE TYPE "StatusVaga" AS ENUM (
    'ABERTA',
    'FECHADA'
);

CREATE TYPE "StatusCandidatura" AS ENUM (
    'ENVIADA',
    'EM_ANALISE',
    'APROVADA',
    'REPROVADA'
);

CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "tipo" "TipoUsuario" NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "dataNascimento" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "usuarios_email_key"
ON "usuarios"("email");

CREATE UNIQUE INDEX "usuarios_cpf_key"
ON "usuarios"("cpf");

CREATE TABLE "empresas" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "descricao" TEXT,
    "cidade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "empresas_usuarioId_key"
ON "empresas"("usuarioId");

CREATE UNIQUE INDEX "empresas_cnpj_key"
ON "empresas"("cnpj");

CREATE TABLE "candidatos" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "curriculo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidatos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "candidatos_usuarioId_key"
ON "candidatos"("usuarioId");

CREATE TABLE "vagas" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "modalidade" "Modalidade" NOT NULL DEFAULT 'PRESENCIAL',
    "salarioMin" INTEGER,
    "salarioMax" INTEGER,
    "status" "StatusVaga" NOT NULL DEFAULT 'ABERTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vagas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "candidaturas" (
    "id" SERIAL NOT NULL,
    "vagaId" INTEGER NOT NULL,
    "candidatoId" INTEGER NOT NULL,
    "compatibilidade" DECIMAL(5,2),
    "feedbackIA" TEXT,
    "status" "StatusCandidatura" NOT NULL DEFAULT 'ENVIADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidaturas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "candidaturas_vagaId_candidatoId_key"
ON "candidaturas"("vagaId", "candidatoId");

ALTER TABLE "empresas"
ADD CONSTRAINT "empresas_usuarioId_fkey"
FOREIGN KEY ("usuarioId")
REFERENCES "usuarios"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "candidatos"
ADD CONSTRAINT "candidatos_usuarioId_fkey"
FOREIGN KEY ("usuarioId")
REFERENCES "usuarios"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "vagas"
ADD CONSTRAINT "vagas_empresaId_fkey"
FOREIGN KEY ("empresaId")
REFERENCES "empresas"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "candidaturas"
ADD CONSTRAINT "candidaturas_vagaId_fkey"
FOREIGN KEY ("vagaId")
REFERENCES "vagas"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "candidaturas"
ADD CONSTRAINT "candidaturas_candidatoId_fkey"
FOREIGN KEY ("candidatoId")
REFERENCES "candidatos"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;