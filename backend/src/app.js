require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const PgSession = require("connect-pg-simple")(session);

const routes = require("./routes");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;

if (isProduction && !sessionSecret) {
  throw new Error("SESSION_SECRET e obrigatorio em producao.");
}

if (isProduction) {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "3mb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { erro: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
});

app.use("/api/auth", authLimiter);

const sessionStore = process.env.DATABASE_URL
  ? new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: "user_sessions",
      createTableIfMissing: false,
    })
  : undefined;

app.use(
  session({
    name: "aladin.sid",
    secret: sessionSecret || "dev-secret-troque-em-producao",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use("/api", routes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

if (isProduction) {
  const frontendDir = path.resolve(__dirname, "../../frontend/dist");
  app.use(express.static(frontendDir, { index: "index.html", maxAge: "1h" }));
}

app.use((req, res) => {
  res.status(404).json({ erro: "Rota nao encontrada." });
});

app.use(errorHandler);

module.exports = app;
