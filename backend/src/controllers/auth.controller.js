const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const prisma = require("../config/prisma");
const { clearCookieOptions } = require("../config/session");
const { enviarRedefinicaoSenha } = require("../services/email.service");

const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const RESET_RESPONSE = "Se existir uma conta com esse email, enviaremos as instrucoes.";

function serializeUsuario(usuario) {
  const { senhaHash, ...resto } = usuario;
  return resto;
}

async function registrar(req, res, next) {
  try {
    const { nome, senha, role } = req.body;
    let { email } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: "nome, email e senha sao obrigatorios." });
    }
    if (typeof senha !== "string") {
      return res.status(400).json({ erro: "senha deve ser uma string." });
    }
    if (senha.length < 6) {
      return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres." });
    }

    const ROLES_PERMITIDAS = ["CANDIDATO", "EMPRESA"];
    const roleUsuario = role && ROLES_PERMITIDAS.includes(String(role).toUpperCase())
      ? String(role).toUpperCase()
      : "CANDIDATO";

    email = String(email).trim().toLowerCase();

    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) {
      return res.status(409).json({ erro: "Este email ja esta cadastrado." });
    }

    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senhaHash,
        role: roleUsuario,
        empresa: roleUsuario === "EMPRESA" ? { create: { nome } } : undefined,
      },
    });

    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    req.session.usuarioId = usuario.id;

    res.status(201).json({
      mensagem: "Usuario cadastrado com sucesso.",
      usuario: serializeUsuario(usuario),
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    let { email, senha, tipoConta } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: "email e senha sao obrigatorios." });
    }
    if (typeof senha !== "string") {
      return res.status(400).json({ erro: "senha deve ser uma string." });
    }

    email = String(email).trim().toLowerCase();

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ erro: "Conta ou credenciais invalidas." });
    }

    if (!usuario.senhaHash) {
      return res.status(401).json({ erro: "Conta ou credenciais invalidas." });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: "Conta ou credenciais invalidas." });
    }

    if (tipoConta) {
      const roleEsperada = String(tipoConta).toLowerCase() === "empresa" ? "EMPRESA" : "CANDIDATO";
      if (usuario.role !== roleEsperada) {
        return res.status(401).json({ erro: "Conta ou credenciais invalidas." });
      }
    }

    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    req.session.usuarioId = usuario.id;

    res.json({
      mensagem: "Login realizado com sucesso.",
      usuario: serializeUsuario(usuario),
    });
  } catch (err) {
    next(err);
  }
}

function logout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("aladin.sid", clearCookieOptions());
    res.json({ mensagem: "Logout realizado com sucesso." });
  });
}

async function excluirConta(req, res, next) {
  try {
    const usuarioId = req.session.usuarioId;
    await prisma.usuario.delete({ where: { id: usuarioId } });

    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie("aladin.sid", clearCookieOptions());
      res.status(204).send();
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    if (!req.session || !req.session.usuarioId) {
      return res.status(401).json({ erro: "Nao autenticado." });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: req.session.usuarioId },
      include: { empresa: true, candidato: true },
    });

    if (!usuario) {
      return res.status(404).json({ erro: "Usuario nao encontrado." });
    }

    res.json({ usuario: serializeUsuario(usuario) });
  } catch (err) {
    next(err);
  }
}

async function solicitarRedefinicaoSenha(req, res, next) {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
      return res.status(400).json({ erro: "Informe um email valido." });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true, nome: true, email: true },
    });

    if (!usuario) return res.json({ mensagem: RESET_RESPONSE });

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await prisma.$transaction([
      prisma.redefinicaoSenha.deleteMany({ where: { usuarioId: usuario.id } }),
      prisma.redefinicaoSenha.create({
        data: { usuarioId: usuario.id, tokenHash, expiresAt },
      }),
    ]);

    const baseUrl = (process.env.PASSWORD_RESET_BASE_URL || "http://localhost:5173/src/pages/login/redefinir-senha.html").replace(/\/$/, "");
    const resetUrl = `${baseUrl}?token=${encodeURIComponent(token)}`;

    try {
      const emailResult = await enviarRedefinicaoSenha({
        destinatario: usuario.email,
        nome: usuario.nome,
        resetUrl,
      });
      const response = { mensagem: RESET_RESPONSE };
      if (process.env.NODE_ENV !== "production" && emailResult?.resetUrl) response.resetUrl = emailResult.resetUrl;
      return res.json(response);
    } catch (emailError) {
      await prisma.redefinicaoSenha.deleteMany({ where: { usuarioId: usuario.id } });
      console.error("Falha ao enviar email de redefinicao:", emailError.name || emailError.message);
      return res.json({ mensagem: RESET_RESPONSE });
    }
  } catch (err) {
    next(err);
  }
}

async function redefinirSenha(req, res, next) {
  try {
    const { token, novaSenha } = req.body;
    if (typeof token !== "string" || token.length !== 64) {
      return res.status(400).json({ erro: "Link de redefinicao invalido ou expirado." });
    }
    if (typeof novaSenha !== "string" || novaSenha.length < 8) {
      return res.status(400).json({ erro: "A nova senha deve ter pelo menos 8 caracteres." });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const senhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);

    await prisma.$transaction(async (tx) => {
      const redefinicao = await tx.redefinicaoSenha.findFirst({
        where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
        select: { id: true, usuarioId: true },
      });
      if (!redefinicao) {
        const error = new Error("Link de redefinicao invalido ou expirado.");
        error.status = 400;
        throw error;
      }

      const claimed = await tx.redefinicaoSenha.updateMany({
        where: { id: redefinicao.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) {
        const error = new Error("Link de redefinicao invalido ou expirado.");
        error.status = 400;
        throw error;
      }

      await tx.usuario.update({
        where: { id: redefinicao.usuarioId },
        data: { senhaHash },
      });
      await tx.redefinicaoSenha.deleteMany({
        where: { usuarioId: redefinicao.usuarioId, id: { not: redefinicao.id } },
      });
      await tx.$executeRaw`DELETE FROM "user_sessions" WHERE "sess" ->> 'usuarioId' = ${String(redefinicao.usuarioId)}`;
    });

    res.json({ mensagem: "Senha redefinida com sucesso. Entre novamente." });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registrar,
  login,
  logout,
  excluirConta,
  me,
  solicitarRedefinicaoSenha,
  redefinirSenha,
};
