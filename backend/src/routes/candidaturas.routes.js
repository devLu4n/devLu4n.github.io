const { Router } = require("express");
const candidaturasController = require("../controllers/candidaturas.controller");
const { requireAuth } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/roles");

const router = Router();

router.post(
  "/vagas/:vagaId",
  requireAuth,
  requireRole("CANDIDATO"),
  candidaturasController.candidatar
);
router.get(
  "/minhas",
  requireAuth,
  requireRole("CANDIDATO"),
  candidaturasController.minhasCandidaturas
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("CANDIDATO"),
  candidaturasController.cancelar
);

router.get(
  "/vagas/:vagaId",
  requireAuth,
  requireRole("EMPRESA", "ADMIN"),
  candidaturasController.listarPorVaga
);
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("EMPRESA", "ADMIN"),
  candidaturasController.atualizarStatus
);

module.exports = router;
