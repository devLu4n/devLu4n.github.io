-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CANDIDATO', 'EMPRESA', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatusCandidatura" AS ENUM ('PENDENTE', 'EM_ANALISE', 'ENTREVISTA', 'APROVADO', 'REJEITADO');

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'CANDIDATO';

-- CreateTable
CREATE TABLE "candidatos" (
    "id" SERIAL NOT NULL,
    "telefone" TEXT,
    "linkedin" TEXT,
    "cidade" TEXT,
    "curriculo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "candidatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidaturas" (
    "id" SERIAL NOT NULL,
    "status" "StatusCandidatura" NOT NULL DEFAULT 'PENDENTE',
    "mensagem" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "candidatoId" INTEGER NOT NULL,
    "vagaId" INTEGER NOT NULL,

    CONSTRAINT "candidaturas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "candidatos_usuarioId_key" ON "candidatos"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "candidaturas_candidatoId_vagaId_key" ON "candidaturas"("candidatoId", "vagaId");

-- AddForeignKey
ALTER TABLE "candidatos" ADD CONSTRAINT "candidatos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidaturas" ADD CONSTRAINT "candidaturas_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "candidatos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidaturas" ADD CONSTRAINT "candidaturas_vagaId_fkey" FOREIGN KEY ("vagaId") REFERENCES "vagas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
