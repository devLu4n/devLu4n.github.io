CREATE TYPE "Role" AS ENUM ('CANDIDATO', 'EMPRESA', 'ADMIN');

ALTER TABLE "usuarios"
ADD COLUMN "role" "Role" NOT NULL DEFAULT 'CANDIDATO',
DROP COLUMN "tipo",
DROP COLUMN "cpf",
DROP COLUMN "telefone",
DROP COLUMN "cidade",
DROP COLUMN "dataNascimento";

DROP TYPE "TipoUsuario";

ALTER TABLE "candidatos"
ALTER COLUMN "curriculo" DROP NOT NULL;

ALTER TYPE "StatusCandidatura" RENAME TO "StatusCandidatura_old";
CREATE TYPE "StatusCandidatura" AS ENUM (
  'PENDENTE',
  'EM_ANALISE',
  'ENTREVISTA',
  'APROVADO',
  'REJEITADO'
);

ALTER TABLE "candidaturas" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "candidaturas"
ALTER COLUMN "status" TYPE "StatusCandidatura"
USING (
  CASE "status"::text
    WHEN 'ENVIADA' THEN 'PENDENTE'
    WHEN 'EM_ANALISE' THEN 'EM_ANALISE'
    WHEN 'APROVADA' THEN 'APROVADO'
    WHEN 'REPROVADA' THEN 'REJEITADO'
  END
)::"StatusCandidatura";
ALTER TABLE "candidaturas" ALTER COLUMN "status" SET DEFAULT 'PENDENTE';
ALTER TABLE "candidaturas"
ADD COLUMN "mensagem" TEXT,
DROP COLUMN "compatibilidade",
DROP COLUMN "feedbackIA";

DROP TYPE "StatusCandidatura_old";

DROP INDEX "candidaturas_vagaId_candidatoId_key";
CREATE UNIQUE INDEX "candidaturas_candidatoId_vagaId_key"
ON "candidaturas"("candidatoId", "vagaId");

ALTER TABLE "vagas" ADD COLUMN "tecnologias" TEXT NOT NULL DEFAULT '';
ALTER TABLE "vagas" ALTER COLUMN "tecnologias" DROP DEFAULT;
