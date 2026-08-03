const prisma = require("../config/prisma");
const { parseId } = require("../utils/parseId");

const STATUS_VALIDOS = ["PENDENTE", "EM_ANALISE", "ENTREVISTA", "APROVADO", "REJEITADO"];
const CURRICULO_TIPOS = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const CURRICULO_MAX_BYTES = 2 * 1024 * 1024;

function validarCurriculo(curriculo) {
  if (!curriculo || typeof curriculo !== "object") return "Anexe seu curriculo em PDF ou DOCX.";
  if (!curriculo.nome || !CURRICULO_TIPOS.includes(curriculo.tipo)) return "O curriculo deve estar em PDF ou DOCX.";
  const prefixo = `data:${curriculo.tipo};base64,`;
  if (typeof curriculo.dados !== "string" || !curriculo.dados.startsWith(prefixo)) return "Arquivo de curriculo invalido.";
  const base64 = curriculo.dados.slice(prefixo.length);
  const tamanho = Math.ceil((base64.length * 3) / 4);
  if (tamanho > CURRICULO_MAX_BYTES) return "O curriculo deve ter no maximo 2 MB.";
  return null;
}

async function candidatar(req, res, next) {
  try {
    const vagaId = parseId(req.params.vagaId);
    if (!vagaId) {
      return res.status(400).json({ erro: "ID da vaga invalido." });
    }

    const erroCurriculo = validarCurriculo(req.body.curriculo);
    if (erroCurriculo) {
      return res.status(400).json({ erro: erroCurriculo });
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

    const { mensagem, curriculo, tecnologias } = req.body;
    if (!Array.isArray(tecnologias) || !tecnologias.some((item) => typeof item === "string" && item.trim())) {
      return res.status(400).json({ erro: "Informe pelo menos uma tecnologia." });
    }
    const tecnologiasNormalizadas = tecnologias
      .filter((item) => typeof item === "string" && item.trim())
      .map((item) => item.trim())
      .slice(0, 20);

    await prisma.candidato.update({
      where: { id: candidato.id },
      data: { curriculo: JSON.stringify(curriculo), tecnologias: tecnologiasNormalizadas.join(", ") },
    });

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

    const novoStatus = String(status).toUpperCase();
    const transicoesPermitidas = {
      PENDENTE: ["EM_ANALISE"],
      EM_ANALISE: ["ENTREVISTA"],
      ENTREVISTA: ["APROVADO", "REJEITADO"],
      APROVADO: [],
      REJEITADO: [],
    };
    if (!transicoesPermitidas[candidatura.status]?.includes(novoStatus)) {
      return res.status(400).json({
        erro: "Transicao de status invalida para esta etapa do processo seletivo.",
      });
    }

    const atualizada = await prisma.candidatura.update({
      where: { id },
      data: { status: novoStatus },
    });

    res.json(atualizada);
  } catch (err) {
    next(err);
  }
}

module.exports = { candidatar, minhasCandidaturas, cancelar, listarPorVaga, atualizarStatus };
