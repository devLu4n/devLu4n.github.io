const prisma = require("../config/prisma");
const { parseId } = require("../utils/parseId");

const MODALIDADES_VALIDAS = ["REMOTO", "HIBRIDO", "PRESENCIAL"];
const STATUS_VALIDOS = ["ABERTA", "FECHADA"];

function validarSalario(salarioMin, salarioMax) {
  const erros = [];

  if (salarioMin !== undefined && salarioMin !== null) {
    const min = Number(salarioMin);
    if (isNaN(min) || !Number.isInteger(min) || min < 0) {
      erros.push("salarioMin deve ser um inteiro positivo ou zero.");
    }
  }

  if (salarioMax !== undefined && salarioMax !== null) {
    const max = Number(salarioMax);
    if (isNaN(max) || !Number.isInteger(max) || max < 0) {
      erros.push("salarioMax deve ser um inteiro positivo ou zero.");
    }
  }

  if (erros.length === 0 && salarioMin != null && salarioMax != null) {
    if (Number(salarioMin) > Number(salarioMax)) {
      erros.push("salarioMin nao pode ser maior que salarioMax.");
    }
  }

  return erros;
}

async function listar(req, res, next) {
  try {
    const { area, cidade, modalidade, busca, page = 1, limit = 10, status } = req.query;

    let statusFiltro = "ABERTA";
    if (status) {
      const statusUpper = String(status).toUpperCase();
      if (!STATUS_VALIDOS.includes(statusUpper)) {
        return res.status(400).json({ erro: `status deve ser um dos: ${STATUS_VALIDOS.join(", ")}` });
      }
      statusFiltro = statusUpper;
    }

    const modalidadeFiltro = modalidade ? String(modalidade).toUpperCase() : null;
    if (modalidadeFiltro && !MODALIDADES_VALIDAS.includes(modalidadeFiltro)) {
      return res.status(400).json({
        erro: `modalidade deve ser uma das: ${MODALIDADES_VALIDAS.join(", ")}`,
      });
    }

    const where = {
      status: statusFiltro,
      ...(area && { area: { equals: String(area), mode: "insensitive" } }),
      ...(cidade && { cidade: { contains: String(cidade), mode: "insensitive" } }),
      ...(modalidadeFiltro && { modalidade: modalidadeFiltro }),
      ...(busca && {
        OR: [
          { titulo: { contains: String(busca), mode: "insensitive" } },
          { tecnologias: { contains: String(busca), mode: "insensitive" } },
        ],
      }),
    };

    const pageNum = Math.max(1, Math.min(1000, parseInt(page, 10) || 1));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));

    const [vagas, total] = await Promise.all([
      prisma.vaga.findMany({
        where,
        include: { empresa: { select: { id: true, nome: true, cidade: true, foto: true } } },
        orderBy: { createdAt: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.vaga.count({ where }),
    ]);

    res.json({
      dados: vagas,
      paginacao: { total, page: pageNum, limit: limitNum, totalPaginas: Math.ceil(total / limitNum) },
    });
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

    const vaga = await prisma.vaga.findUnique({
      where: { id },
      include: { empresa: true },
    });

    if (!vaga) {
      return res.status(404).json({ erro: "Vaga nao encontrada." });
    }

    res.json(vaga);
  } catch (err) {
    next(err);
  }
}

async function criar(req, res, next) {
  try {
    const { titulo, descricao, area, cidade, modalidade, tecnologias, salarioMin, salarioMax } = req.body;

    if (!titulo || !descricao || !area || !cidade) {
      return res.status(400).json({ erro: "titulo, descricao, area e cidade sao obrigatorios." });
    }
    if (modalidade && !MODALIDADES_VALIDAS.includes(String(modalidade).toUpperCase())) {
      return res.status(400).json({ erro: `modalidade deve ser uma das: ${MODALIDADES_VALIDAS.join(", ")}` });
    }

    const errosSalario = validarSalario(salarioMin, salarioMax);
    if (errosSalario.length > 0) {
      return res.status(400).json({ erro: errosSalario.join(" ") });
    }

    let empresa = await prisma.empresa.findUnique({ where: { usuarioId: req.session.usuarioId } });
    if (!empresa) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: req.session.usuarioId },
        select: { nome: true },
      });
      if (!usuario) {
        return res.status(404).json({ erro: "Usuario nao encontrado." });
      }
      empresa = await prisma.empresa.upsert({
        where: { usuarioId: req.session.usuarioId },
        update: {},
        create: { nome: usuario.nome, usuarioId: req.session.usuarioId },
      });
    }

    const vaga = await prisma.vaga.create({
      data: {
        titulo,
        descricao,
        area,
        cidade,
        modalidade: modalidade ? String(modalidade).toUpperCase() : undefined,
        tecnologias: tecnologias || "",
        salarioMin: salarioMin != null ? Number(salarioMin) : null,
        salarioMax: salarioMax != null ? Number(salarioMax) : null,
        empresaId: empresa.id,
      },
    });

    res.status(201).json(vaga);
  } catch (err) {
    next(err);
  }
}

async function atualizar(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ erro: "ID invalido. Deve ser um inteiro positivo." });
    }

    const vaga = await prisma.vaga.findUnique({ where: { id }, include: { empresa: true } });

    if (!vaga) {
      return res.status(404).json({ erro: "Vaga nao encontrada." });
    }
    if (req.usuarioRole !== "ADMIN" && vaga.empresa.usuarioId !== req.session.usuarioId) {
      return res.status(403).json({ erro: "Voce nao tem permissao para editar esta vaga." });
    }

    const { titulo, descricao, area, cidade, modalidade, tecnologias, salarioMin, salarioMax, status } = req.body;

    if (modalidade && !MODALIDADES_VALIDAS.includes(String(modalidade).toUpperCase())) {
      return res.status(400).json({ erro: `modalidade deve ser uma das: ${MODALIDADES_VALIDAS.join(", ")}` });
    }

    if (status) {
      const statusUpper = String(status).toUpperCase();
      if (!STATUS_VALIDOS.includes(statusUpper)) {
        return res.status(400).json({ erro: `status deve ser um dos: ${STATUS_VALIDOS.join(", ")}` });
      }
    }

    const errosSalario = validarSalario(
      salarioMin !== undefined ? salarioMin : undefined,
      salarioMax !== undefined ? salarioMax : undefined
    );
    if (errosSalario.length > 0) {
      return res.status(400).json({ erro: errosSalario.join(" ") });
    }

    const vagaAtualizada = await prisma.vaga.update({
      where: { id },
      data: {
        titulo,
        descricao,
        area,
        cidade,
        modalidade: modalidade ? String(modalidade).toUpperCase() : undefined,
        tecnologias,
        salarioMin: salarioMin !== undefined ? Number(salarioMin) : undefined,
        salarioMax: salarioMax !== undefined ? Number(salarioMax) : undefined,
        status: status ? String(status).toUpperCase() : undefined,
      },
    });

    res.json(vagaAtualizada);
  } catch (err) {
    next(err);
  }
}

async function remover(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ erro: "ID invalido. Deve ser um inteiro positivo." });
    }

    const vaga = await prisma.vaga.findUnique({ where: { id }, include: { empresa: true } });

    if (!vaga) {
      return res.status(404).json({ erro: "Vaga nao encontrada." });
    }
    if (req.usuarioRole !== "ADMIN" && vaga.empresa.usuarioId !== req.session.usuarioId) {
      return res.status(403).json({ erro: "Voce nao tem permissao para excluir esta vaga." });
    }

    await prisma.vaga.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
