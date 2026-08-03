jest.mock("../config/prisma", () => ({
  candidato: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

const prisma = require("../config/prisma");
const { meuPerfil, criar, atualizar, buscarPorId } = require("../controllers/candidatos.controller");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides = {}) {
  return { body: {}, params: {}, session: { usuarioId: 1 }, ...overrides };
}

describe("candidatos.controller", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("meuPerfil", () => {
    it("retorna 404 se perfil nao existe", async () => {
      prisma.candidato.findUnique.mockResolvedValue(null);
      const res = mockRes();
      await meuPerfil(mockReq(), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("retorna perfil quando existe", async () => {
      const perfil = { id: 1, usuarioId: 1, usuario: { nome: "Test" } };
      prisma.candidato.findUnique.mockResolvedValue(perfil);
      const res = mockRes();
      await meuPerfil(mockReq(), res, jest.fn());
      expect(res.json).toHaveBeenCalledWith(perfil);
    });
  });

  describe("criar", () => {
    it("retorna 409 se perfil ja existe", async () => {
      prisma.candidato.findUnique.mockResolvedValue({ id: 1 });
      const res = mockRes();
      await criar(mockReq(), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("cria perfil com sucesso", async () => {
      prisma.candidato.findUnique.mockResolvedValue(null);
      prisma.candidato.create.mockResolvedValue({ id: 1 });
      const res = mockRes();
      await criar(mockReq({ body: { telefone: "123" } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("buscarPorId", () => {
    it("retorna 400 para id invalido", async () => {
      const res = mockRes();
      await buscarPorId(mockReq({ params: { id: "abc" } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 404 se candidato nao existe", async () => {
      prisma.candidato.findUnique.mockResolvedValue(null);
      const res = mockRes();
      await buscarPorId(mockReq({ params: { id: "1" } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("retorna candidato quando id e valido", async () => {
      const candidato = { id: 1, usuario: { nome: "Test" } };
      prisma.candidato.findUnique.mockResolvedValue(candidato);
      const res = mockRes();
      await buscarPorId(mockReq({ params: { id: "1" } }), res, jest.fn());
      expect(res.json).toHaveBeenCalledWith(candidato);
    });
  });

  describe("atualizar", () => {
    it("retorna 404 se perfil nao existe", async () => {
      prisma.candidato.findUnique.mockResolvedValue(null);
      const res = mockRes();
      await atualizar(mockReq({ body: { telefone: "999" } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("atualiza perfil com sucesso", async () => {
      prisma.candidato.findUnique.mockResolvedValue({ id: 1 });
      prisma.candidato.update.mockResolvedValue({ id: 1, telefone: "999" });
      const res = mockRes();
      await atualizar(mockReq({ body: { telefone: "999" } }), res, jest.fn());
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ telefone: "999" }));
    });
  });
});
