function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === "P2002") {
    return res.status(409).json({
      erro: `Ja existe um registro com esse valor no campo: ${err.meta?.target}`,
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({ erro: "Registro nao encontrado." });
  }

  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600
    ? err.status
    : 500;
  const mensagem = status === 500 && process.env.NODE_ENV === "production"
    ? "Erro interno do servidor."
    : err.message || "Erro interno do servidor.";

  res.status(status).json({ erro: mensagem });
}

module.exports = { errorHandler };
