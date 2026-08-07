const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const { requireAuth } = require("../middlewares/auth");

const router = Router();

router.post("/registro", authController.registrar);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/esqueci-senha", authController.solicitarRedefinicaoSenha);
router.post("/redefinir-senha", authController.redefinirSenha);
router.delete("/me", requireAuth, authController.excluirConta);
router.get("/me", requireAuth, authController.me);

module.exports = router;
