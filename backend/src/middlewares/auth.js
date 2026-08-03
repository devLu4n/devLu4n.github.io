function requireAuth(req, res, next) {
  if (!req.session || !req.session.usuarioId) {
    return res.status(401).json({ erro: "Nao autenticado. Faca login para continuar." });
  }
  next();
}

module.exports = { requireAuth };
