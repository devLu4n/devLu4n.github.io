const prisma = require("../config/prisma");
const { parseId } = require("../utils/parseId");

const STATUS_VALIDOS = ["PENDENTE", "EM_ANALISE", "ENTREVISTA", "APROVADO", "REJEITADO"];

async function candidatar(req, res, next) {
  try {
    const vagaId = parseId(req.params.vagaId);
    if (!vagaId) {
      return res.status(400).json({ erro: "ID da vaga invalido." });
    }

    const candidato = await prisma.candidato.findUnique({
      where: { usuarioId: req.session.usuarioId },
    });
    if (!candidato) {
      return res.status(400).json({
        erro: "Voce precisa criar seu perfil de candidato antes de se candidatar.",
      });
    }

    const vaga = await prisma.vaga.findUnique({ where: { id: vagaId } });
    if (!vaga) {
      return res.status(404).json({ erro: "Vaga nao encontrada." });
    }
    if (vaga.status !== "ABERTA") {
      return res.status(400).json({ erro: "Esta vaga nao esta aberta para candidaturas." });
    }

    const existente = await prisma.candidatura.findUnique({
      where: { candidatoId_vagaId: { candidatoId: candidato.id, vagaId } },
    });
    if (existente) {
      return res.status(409).json({ erro: "Voce ja se candidatou a esta vaga." });
    }

    const { mensagem } = req.body;

    const candidatura = await prisma.candidatura.create({
      data: {
        candidatoId: candidato.id,
        vagaId,
        mensagem: mensagem || null,
      },
      include: {
        vaga: { select: { id: true, titulo: true, empresa: { select: { nome: true } } } },
      },
    });

    res.status(201).json(candidatura);
  } catch (err) {
    next(err);
  }
}

async function minhasCandidaturas(req, res, next) {
  try {
    const candidato = await prisma.candidato.findUnique({
      where: { usuarioId: req.session.usuarioId },
    });
    if (!candidato) {
      return res.status(404).json({ erro: "Perfil de candidato nao encontrado." });
    }

    const candidaturas = await prisma.candidatura.findMany({
      where: { candidatoId: candidato.id },
      include: {
        vaga: {
          select: {
            id: true,
            titulo: true,
            cidade: true,
            modalidade: true,
            status: true,
            empresa: { select: { id: true, nome: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(candidaturas);
  } catch (err) {
    next(err);
  }
}

async function cancelar(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ erro: "ID invalido." });
    }

    const candidato = await prisma.candidato.findUnique({
      where: { usuarioId: req.session.usuarioId },
    });
    if (!candidato) {
      return res.status(404).json({ erro: "Perfil de candidato nao encontrado." });
    }

    const candidatura = await prisma.candidatura.findUnique({ where: { id } });
    if (!candidatura) {
      return res.status(404).json({ erro: "Candidatura nao encontrada." });
    }
    if (candidatura.candidatoId !== candidato.id) {
      return res.status(403).json({ erro: "Voce nao tem permissao para cancelar esta candidatura." });
    }
    if (candidatura.status !== "PENDENTE") {
      return res.status(400).json({ erro: "So e possivel cancelar candidaturas com status PENDENTE." });
    }

    await prisma.candidatura.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function listarPorVaga(req, res, next) {
  try {
    const vagaId = parseId(req.params.vagaId);
    if (!vagaId) {
      return res.status(400).json({ erro: "ID da vaga invalido." });
    }

    const vaga = await prisma.vaga.findUnique({
      where: { id: vagaId },
      include: { empresa: true },
    });
    if (!vaga) {
      return res.status(404).json({ erro: "Vaga nao encontrada." });
    }
    if (req.usuarioRole !== "ADMIN" && vaga.empresa.usuarioId !== req.session.usuarioId) {
      return res.status(403).json({ erro: "Voce nao tem permissao para ver candidaturas desta vaga." });
    }

    const candidaturas = await prisma.candidatura.findMany({
      where: { vagaId },
      include: {
        candidato: {
          include: {
            usuario: { select: { nome: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(candidaturas);
  } catch (err) {
    next(err);
  }
}

async function atualizarStatus(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ erro: "ID invalido." });
    }

    const { status } = req.body;
    if (!status || !STATUS_VALIDOS.includes(String(status).toUpperCase())) {
      return res.status(400).json({
        erro: `status deve ser um dos: ${STATUS_VALIDOS.join(", ")}`,
      });
    }

    const candidatura = await prisma.candidatura.findUnique({
      where: { id },
      include: { vaga: { include: { empresa: true } } },
    });
    if (!candidatura) {
      return res.status(404).json({ erro: "Candidatura nao encontrada." });
    }
    if (req.usuarioRole !== "ADMIN" && candidatura.vaga.empresa.usuarioId !== req.session.usuarioId) {
      return res.status(403).json({
        erro: "Voce nao tem permissao para atualizar esta candidatura.",
      });
    }

    const atualizada = await prisma.candidatura.update({
      where: { id },
      data: { status: String(status).toUpperCase() },
    });

    res.json(atualizada);
  } catch (err) {
    next(err);
  }
}

module.exports = { candidatar, minhasCandidaturas, cancelar, listarPorVaga, atualizarStatus };
