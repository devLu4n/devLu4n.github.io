const prisma = require("../config/prisma");
const { parseId } = require("../utils/parseId");

async function meuPerfil(req, res, next) {
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { usuarioId: req.session.usuarioId },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
      },
    });

    if (!empresa) {
      return res.status(404).json({ erro: "Perfil de empresa nao encontrado. Crie seu perfil primeiro." });
    }

    res.json(empresa);
  } catch (err) {
    next(err);
  }
}

async function atualizarMeuPerfil(req, res, next) {
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { usuarioId: req.session.usuarioId },
    });

    if (!empresa) {
      return res.status(404).json({ erro: "Perfil de empresa nao encontrado." });
    }

    const { nome, cnpj, descricao, cidade } = req.body;
    const empresaAtualizada = await prisma.empresa.update({
      where: { id: empresa.id },
      data: { nome, cnpj, descricao, cidade },
    });

    res.json(empresaAtualizada);
  } catch (err) {
    next(err);
  }
}

async function listar(req, res, next) {
  try {
    const empresas = await prisma.empresa.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { vagas: true } } },
    });
    res.json(empresas);
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

    const empresa = await prisma.empresa.findUnique({
      where: { id },
      include: { vagas: true },
    });

    if (!empresa) {
      return res.status(404).json({ erro: "Empresa nao encontrada." });
    }

    res.json(empresa);
  } catch (err) {
    next(err);
  }
}

async function criar(req, res, next) {
  try {
    const { nome, cnpj, descricao, cidade } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: "nome e obrigatorio." });
    }

    const empresaExistente = await prisma.empresa.findUnique({
      where: { usuarioId: req.session.usuarioId },
    });
    if (empresaExistente) {
      return res.status(409).json({ erro: "Este usuario ja possui uma empresa cadastrada." });
    }

    const empresa = await prisma.empresa.create({
      data: { nome, cnpj, descricao, cidade, usuarioId: req.session.usuarioId },
    });

    res.status(201).json(empresa);
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

    const empresa = await prisma.empresa.findUnique({ where: { id } });

    if (!empresa) {
      return res.status(404).json({ erro: "Empresa nao encontrada." });
    }
    if (req.usuarioRole !== "ADMIN" && empresa.usuarioId !== req.session.usuarioId) {
      return res.status(403).json({ erro: "Voce nao tem permissao para editar esta empresa." });
    }

    const { nome, cnpj, descricao, cidade } = req.body;
    const empresaAtualizada = await prisma.empresa.update({
      where: { id },
      data: { nome, cnpj, descricao, cidade },
    });

    res.json(empresaAtualizada);
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

    const empresa = await prisma.empresa.findUnique({ where: { id } });

    if (!empresa) {
      return res.status(404).json({ erro: "Empresa nao encontrada." });
    }
    if (req.usuarioRole !== "ADMIN" && empresa.usuarioId !== req.session.usuarioId) {
      return res.status(403).json({ erro: "Voce nao tem permissao para excluir esta empresa." });
    }

    await prisma.empresa.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { meuPerfil, atualizarMeuPerfil, listar, buscarPorId, criar, atualizar, remover };
