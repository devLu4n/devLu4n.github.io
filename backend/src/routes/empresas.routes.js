const { Router } = require("express");
const empresasController = require("../controllers/empresas.controller");
const { requireAuth } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/roles");

const router = Router();

router.get("/", empresasController.listar);
router.get("/:id", empresasController.buscarPorId);
router.post("/", requireAuth, requireRole("EMPRESA", "ADMIN"), empresasController.criar);
router.put("/:id", requireAuth, requireRole("EMPRESA", "ADMIN"), empresasController.atualizar);
router.delete("/:id", requireAuth, requireRole("EMPRESA", "ADMIN"), empresasController.remover);

module.exports = router;
