CREATE TABLE "redefinicoes_senha" (
  "id" SERIAL NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "usuarioId" INTEGER NOT NULL,
  CONSTRAINT "redefinicoes_senha_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "redefinicoes_senha_tokenHash_key"
ON "redefinicoes_senha"("tokenHash");

CREATE INDEX "redefinicoes_senha_usuarioId_expiresAt_idx"
ON "redefinicoes_senha"("usuarioId", "expiresAt");

ALTER TABLE "redefinicoes_senha"
ADD CONSTRAINT "redefinicoes_senha_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
