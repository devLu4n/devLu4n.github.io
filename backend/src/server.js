const app = require("./app");

const PORT = process.env.PORT || 3333;

const server = app.listen(PORT, () => {
  console.log(`API do Aladin rodando em http://localhost:${PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} recebido. Encerrando a API...`);
  server.close(() => process.exit(0));

  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
