const prisma = require("../config/prisma");

function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      if (!req.session || !req.session.usuarioId) {
        return res.status(401).json({ erro: "Nao autenticado." });
      }

      const usuario = await prisma.usuario.findUnique({
        where: { id: req.session.usuarioId },
        select: { role: true },
      });

      if (!usuario || !roles.includes(usuario.role)) {
        return res.status(403).json({
          erro: "Voce nao tem permissao para acessar este recurso.",
        });
      }

      req.usuarioRole = usuario.role;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireRole };
