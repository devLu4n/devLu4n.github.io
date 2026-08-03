const { Router } = require("express");

const authRoutes = require("./auth.routes");
const empresasRoutes = require("./empresas.routes");
const vagasRoutes = require("./vagas.routes");
const candidatosRoutes = require("./candidatos.routes");
const candidaturasRoutes = require("./candidaturas.routes");

const router = Router();

router.get("/", (req, res) => {
  res.json({ mensagem: "API do Aladin no ar" });
});

router.use("/auth", authRoutes);
router.use("/empresas", empresasRoutes);
router.use("/vagas", vagasRoutes);
router.use("/candidatos", candidatosRoutes);
router.use("/candidaturas", candidaturasRoutes);

module.exports = router;
