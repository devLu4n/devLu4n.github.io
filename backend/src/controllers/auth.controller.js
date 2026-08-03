const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

const SALT_ROUNDS = 10;

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
    res.clearCookie("aladin.sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.json({ mensagem: "Logout realizado com sucesso." });
  });
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

module.exports = { registrar, login, logout, me };
