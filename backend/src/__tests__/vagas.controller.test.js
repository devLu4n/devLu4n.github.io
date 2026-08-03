jest.mock("../config/prisma", () => ({
  vaga: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  empresa: {
    findUnique: jest.fn(),
  },
}));

const prisma = require("../config/prisma");
const { listar, buscarPorId, criar, atualizar, remover } = require("../controllers/vagas.controller");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides = {}) {
  return {
    body: {},
    query: {},
    params: {},
    session: { usuarioId: 1 },
    ...overrides,
  };
}

describe("vagas.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listar", () => {
    it("retorna pagina 1 quando page e NaN", async () => {
      prisma.vaga.findMany.mockResolvedValue([]);
      prisma.vaga.count.mockResolvedValue(0);

      const req = mockReq({ query: { page: "abc", limit: "10" } });
      const res = mockRes();

      await listar(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          paginacao: expect.objectContaining({ page: 1 }),
        })
      );
    });

    it("retorna limit 10 quando limit e NaN", async () => {
      prisma.vaga.findMany.mockResolvedValue([]);
      prisma.vaga.count.mockResolvedValue(0);

      const req = mockReq({ query: { page: "1", limit: "xyz" } });
      const res = mockRes();

      await listar(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          paginacao: expect.objectContaining({ limit: 10 }),
        })
      );
    });

    it("limita limit maximo em 50", async () => {
      prisma.vaga.findMany.mockResolvedValue([]);
      prisma.vaga.count.mockResolvedValue(0);

      const req = mockReq({ query: { limit: "100" } });
      const res = mockRes();

      await listar(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          paginacao: expect.objectContaining({ limit: 50 }),
        })
      );
    });

    it("aceita status como query param", async () => {
      prisma.vaga.findMany.mockResolvedValue([]);
      prisma.vaga.count.mockResolvedValue(0);

      const req = mockReq({ query: { status: "FECHADA" } });
      const res = mockRes();

      await listar(req, res, jest.fn());

      expect(prisma.vaga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "FECHADA" }),
        })
      );
    });

    it("retorna 400 para status invalido", async () => {
      const req = mockReq({ query: { status: "INVALIDO" } });
      const res = mockRes();

      await listar(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("usa ABERTA como status padrao", async () => {
      prisma.vaga.findMany.mockResolvedValue([]);
      prisma.vaga.count.mockResolvedValue(0);

      const req = mockReq({ query: {} });
      const res = mockRes();

      await listar(req, res, jest.fn());

      expect(prisma.vaga.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "ABERTA" }),
        })
      );
    });
  });

  describe("buscarPorId", () => {
    it("retorna 400 para id invalido (string)", async () => {
      const req = mockReq({ params: { id: "abc" } });
      const res = mockRes();

      await buscarPorId(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 400 para id negativo", async () => {
      const req = mockReq({ params: { id: "-1" } });
      const res = mockRes();

      await buscarPorId(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 400 para id zero", async () => {
      const req = mockReq({ params: { id: "0" } });
      const res = mockRes();

      await buscarPorId(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 404 se vaga nao existe", async () => {
      prisma.vaga.findUnique.mockResolvedValue(null);

      const req = mockReq({ params: { id: "1" } });
      const res = mockRes();

      await buscarPorId(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("retorna vaga quando id e valido", async () => {
      const vaga = { id: 1, titulo: "Dev", empresa: {} };
      prisma.vaga.findUnique.mockResolvedValue(vaga);

      const req = mockReq({ params: { id: "1" } });
      const res = mockRes();

      await buscarPorId(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(vaga);
    });
  });

  describe("criar", () => {
    it("retorna 400 se campos obrigatorios faltam", async () => {
      const req = mockReq({ body: { titulo: "Dev" } });
      const res = mockRes();

      await criar(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 400 para salario negativo", async () => {
      prisma.empresa.findUnique.mockResolvedValue({ id: 1 });

      const req = mockReq({
        body: { titulo: "Dev", descricao: "D", area: "backend", cidade: "SP", salarioMin: -100 },
      });
      const res = mockRes();

      await criar(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 400 se salarioMin > salarioMax", async () => {
      prisma.empresa.findUnique.mockResolvedValue({ id: 1 });

      const req = mockReq({
        body: { titulo: "Dev", descricao: "D", area: "backend", cidade: "SP", salarioMin: 5000, salarioMax: 3000 },
      });
      const res = mockRes();

      await criar(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 400 se salario nao e inteiro", async () => {
      prisma.empresa.findUnique.mockResolvedValue({ id: 1 });

      const req = mockReq({
        body: { titulo: "Dev", descricao: "D", area: "backend", cidade: "SP", salarioMin: 3.5 },
      });
      const res = mockRes();

      await criar(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("cria vaga com sucesso", async () => {
      prisma.empresa.findUnique.mockResolvedValue({ id: 1 });
      prisma.vaga.create.mockResolvedValue({ id: 1, titulo: "Dev" });

      const req = mockReq({
        body: { titulo: "Dev", descricao: "D", area: "backend", cidade: "SP", salarioMin: 3000, salarioMax: 5000 },
      });
      const res = mockRes();

      await criar(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("atualizar", () => {
    it("retorna 400 para id invalido", async () => {
      const req = mockReq({ params: { id: "abc" }, body: {} });
      const res = mockRes();

      await atualizar(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 400 para status invalido", async () => {
      prisma.vaga.findUnique.mockResolvedValue({
        id: 1, empresa: { usuarioId: 1 },
      });

      const req = mockReq({
        params: { id: "1" },
        body: { status: "INVALIDO" },
      });
      const res = mockRes();

      await atualizar(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("aceita status FECHADA", async () => {
      prisma.vaga.findUnique.mockResolvedValue({
        id: 1, empresa: { usuarioId: 1 },
      });
      prisma.vaga.update.mockResolvedValue({ id: 1, status: "FECHADA" });

      const req = mockReq({
        params: { id: "1" },
        body: { status: "FECHADA" },
      });
      const res = mockRes();

      await atualizar(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: "FECHADA" })
      );
    });

    it("retorna 403 se nao e o dono", async () => {
      prisma.vaga.findUnique.mockResolvedValue({
        id: 1, empresa: { usuarioId: 999 },
      });

      const req = mockReq({ params: { id: "1" }, body: {} });
      const res = mockRes();

      await atualizar(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("remover", () => {
    it("retorna 400 para id invalido", async () => {
      const req = mockReq({ params: { id: "abc" } });
      const res = mockRes();

      await remover(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 403 se nao e o dono", async () => {
      prisma.vaga.findUnique.mockResolvedValue({
        id: 1, empresa: { usuarioId: 999 },
      });

      const req = mockReq({ params: { id: "1" } });
      const res = mockRes();

      await remover(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("remove vaga com sucesso", async () => {
      prisma.vaga.findUnique.mockResolvedValue({
        id: 1, empresa: { usuarioId: 1 },
      });
      prisma.vaga.delete.mockResolvedValue({});

      const req = mockReq({ params: { id: "1" } });
      const res = mockRes();

      await remover(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});
