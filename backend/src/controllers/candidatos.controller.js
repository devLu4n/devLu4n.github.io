const prisma = require("../config/prisma");
const { parseId } = require("../utils/parseId");

async function meuPerfil(req, res, next) {
  try {
    const candidato = await prisma.candidato.findUnique({
      where: { usuarioId: req.session.usuarioId },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
      },
    });

    if (!candidato) {
      return res.status(404).json({ erro: "Perfil de candidato nao encontrado. Crie seu perfil primeiro." });
    }

    res.json(candidato);
  } catch (err) {
    next(err);
  }
}

async function criar(req, res, next) {
  try {
    const { telefone, linkedin, cidade, curriculo } = req.body;

    const existente = await prisma.candidato.findUnique({
      where: { usuarioId: req.session.usuarioId },
    });
    if (existente) {
      return res.status(409).json({ erro: "Voce ja possui um perfil de candidato." });
    }

    const candidato = await prisma.candidato.create({
      data: {
        telefone: telefone || null,
        linkedin: linkedin || null,
        cidade: cidade || null,
        curriculo: curriculo || null,
        usuarioId: req.session.usuarioId,
      },
    });

    res.status(201).json(candidato);
  } catch (err) {
    next(err);
  }
}

async function atualizar(req, res, next) {
  try {
    const candidato = await prisma.candidato.findUnique({
      where: { usuarioId: req.session.usuarioId },
    });

    if (!candidato) {
      return res.status(404).json({ erro: "Perfil de candidato nao encontrado." });
    }

    const { telefone, linkedin, cidade, curriculo } = req.body;
    const atualizado = await prisma.candidato.update({
      where: { id: candidato.id },
      data: { telefone, linkedin, cidade, curriculo },
    });

    res.json(atualizado);
  } catch (err) {
    next(err);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ erro: "ID invalido. Deve ser um inteiro positivo." });
    }

    const candidato = await prisma.candidato.findUnique({
      where: { id },
      include: {
        usuario: { select: { id: true, nome: true } },
      },
    });

    if (!candidato) {
      return res.status(404).json({ erro: "Candidato nao encontrado." });
    }

    res.json(candidato);
  } catch (err) {
    next(err);
  }
}

module.exports = { meuPerfil, criar, atualizar, buscarPorId };
