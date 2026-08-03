const { Router } = require("express");
const candidatosController = require("../controllers/candidatos.controller");
const { requireAuth } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/roles");

const router = Router();

router.get("/me", requireAuth, requireRole("CANDIDATO"), candidatosController.meuPerfil);
router.post("/", requireAuth, requireRole("CANDIDATO"), candidatosController.criar);
router.put("/me", requireAuth, requireRole("CANDIDATO"), candidatosController.atualizar);
router.get("/:id", candidatosController.buscarPorId);

module.exports = router;
