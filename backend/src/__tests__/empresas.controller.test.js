jest.mock("../config/prisma", () => ({
  empresa: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const prisma = require("../config/prisma");
const { listar, buscarPorId, criar, atualizar, remover } = require("../controllers/empresas.controller");

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
    params: {},
    session: { usuarioId: 1 },
    ...overrides,
  };
}

describe("empresas.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("buscarPorId", () => {
    it("retorna 400 para id invalido (string)", async () => {
      const req = mockReq({ params: { id: "abc" } });
      const res = mockRes();

      await buscarPorId(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 400 para id negativo", async () => {
      const req = mockReq({ params: { id: "-5" } });
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

    it("retorna 404 se empresa nao existe", async () => {
      prisma.empresa.findUnique.mockResolvedValue(null);

      const req = mockReq({ params: { id: "1" } });
      const res = mockRes();

      await buscarPorId(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("retorna empresa quando id e valido", async () => {
      const empresa = { id: 1, nome: "SEFAZ", vagas: [] };
      prisma.empresa.findUnique.mockResolvedValue(empresa);

      const req = mockReq({ params: { id: "1" } });
      const res = mockRes();

      await buscarPorId(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(empresa);
    });
  });

  describe("atualizar", () => {
    it("retorna 400 para id invalido", async () => {
      const req = mockReq({ params: { id: "abc" }, body: {} });
      const res = mockRes();

      await atualizar(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 404 se empresa nao existe", async () => {
      prisma.empresa.findUnique.mockResolvedValue(null);

      const req = mockReq({ params: { id: "1" }, body: {} });
      const res = mockRes();

      await atualizar(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("retorna 403 se nao e o dono", async () => {
      prisma.empresa.findUnique.mockResolvedValue({ id: 1, usuarioId: 999 });

      const req = mockReq({ params: { id: "1" }, body: {} });
      const res = mockRes();

      await atualizar(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("atualiza empresa com sucesso", async () => {
      prisma.empresa.findUnique.mockResolvedValue({ id: 1, usuarioId: 1 });
      prisma.empresa.update.mockResolvedValue({ id: 1, nome: "SEFAZ Atualizada" });

      const req = mockReq({ params: { id: "1" }, body: { nome: "SEFAZ Atualizada" } });
      const res = mockRes();

      await atualizar(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ nome: "SEFAZ Atualizada" })
      );
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
      prisma.empresa.findUnique.mockResolvedValue({ id: 1, usuarioId: 999 });

      const req = mockReq({ params: { id: "1" } });
      const res = mockRes();

      await remover(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("remove empresa com sucesso", async () => {
      prisma.empresa.findUnique.mockResolvedValue({ id: 1, usuarioId: 1 });
      prisma.empresa.delete.mockResolvedValue({});

      const req = mockReq({ params: { id: "1" } });
      const res = mockRes();

      await remover(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe("criar", () => {
    it("retorna 400 se nome esta vazio", async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();

      await criar(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 409 se usuario ja tem empresa", async () => {
      prisma.empresa.findUnique.mockResolvedValue({ id: 1 });

      const req = mockReq({ body: { nome: "Nova" } });
      const res = mockRes();

      await criar(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("cria empresa com sucesso", async () => {
      prisma.empresa.findUnique.mockResolvedValue(null);
      prisma.empresa.create.mockResolvedValue({ id: 1, nome: "SEFAZ" });

      const req = mockReq({ body: { nome: "SEFAZ" } });
      const res = mockRes();

      await criar(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
