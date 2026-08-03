const { Router } = require("express");
const vagasController = require("../controllers/vagas.controller");
const { requireAuth } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/roles");

const router = Router();

router.get("/", vagasController.listar);
router.get("/:id", vagasController.buscarPorId);
router.post("/", requireAuth, requireRole("EMPRESA", "ADMIN"), vagasController.criar);
router.put("/:id", requireAuth, requireRole("EMPRESA", "ADMIN"), vagasController.atualizar);
router.delete("/:id", requireAuth, requireRole("EMPRESA", "ADMIN"), vagasController.remover);

module.exports = router;
