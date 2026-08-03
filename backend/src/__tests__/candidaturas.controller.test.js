jest.mock("../config/prisma", () => ({
  candidato: { findUnique: jest.fn() },
  vaga: { findUnique: jest.fn() },
  candidatura: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const prisma = require("../config/prisma");
const {
  candidatar, minhasCandidaturas, cancelar, listarPorVaga, atualizarStatus,
} = require("../controllers/candidaturas.controller");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides = {}) {
  return { body: {}, params: {}, session: { usuarioId: 1 }, ...overrides };
}

describe("candidaturas.controller", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("candidatar", () => {
    it("retorna 400 para vagaId invalido", async () => {
      const res = mockRes();
      await candidatar(mockReq({ params: { vagaId: "abc" } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 400 se candidato nao tem perfil", async () => {
      prisma.candidato.findUnique.mockResolvedValue(null);
      const res = mockRes();
      await candidatar(mockReq({ params: { vagaId: "1" } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 404 se vaga nao existe", async () => {
      prisma.candidato.findUnique.mockResolvedValue({ id: 1 });
      prisma.vaga.findUnique.mockResolvedValue(null);
      const res = mockRes();
      await candidatar(mockReq({ params: { vagaId: "1" } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("retorna 400 se vaga esta fechada", async () => {
      prisma.candidato.findUnique.mockResolvedValue({ id: 1 });
      prisma.vaga.findUnique.mockResolvedValue({ id: 1, status: "FECHADA" });
      const res = mockRes();
      await candidatar(mockReq({ params: { vagaId: "1" } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 409 se ja se candidatou", async () => {
      prisma.candidato.findUnique.mockResolvedValue({ id: 1 });
      prisma.vaga.findUnique.mockResolvedValue({ id: 1, status: "ABERTA" });
      prisma.candidatura.findUnique.mockResolvedValue({ id: 1 });
      const res = mockRes();
      await candidatar(mockReq({ params: { vagaId: "1" } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("cria candidatura com sucesso", async () => {
      prisma.candidato.findUnique.mockResolvedValue({ id: 1 });
      prisma.vaga.findUnique.mockResolvedValue({ id: 1, status: "ABERTA" });
      prisma.candidatura.findUnique.mockResolvedValue(null);
      prisma.candidatura.create.mockResolvedValue({ id: 1, status: "PENDENTE" });
      const res = mockRes();
      await candidatar(mockReq({ params: { vagaId: "1" } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("minhasCandidaturas", () => {
    it("retorna 404 se candidato nao tem perfil", async () => {
      prisma.candidato.findUnique.mockResolvedValue(null);
      const res = mockRes();
      await minhasCandidaturas(mockReq(), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("retorna lista de candidaturas", async () => {
      prisma.candidato.findUnique.mockResolvedValue({ id: 1 });
      prisma.candidatura.findMany.mockResolvedValue([{ id: 1 }]);
      const res = mockRes();
      await minhasCandidaturas(mockReq(), res, jest.fn());
      expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
    });
  });

  describe("cancelar", () => {
    it("retorna 400 para id invalido", async () => {
      const res = mockRes();
      await cancelar(mockReq({ params: { id: "abc" } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 403 se nao e o dono da candidatura", async () => {
      prisma.candidato.findUnique.mockResolvedValue({ id: 1 });
      prisma.candidatura.findUnique.mockResolvedValue({ id: 1, candidatoId: 999, status: "PENDENTE" });
      const res = mockRes();
      await cancelar(mockReq({ params: { id: "1" } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("retorna 400 se status nao e PENDENTE", async () => {
      prisma.candidato.findUnique.mockResolvedValue({ id: 1 });
      prisma.candidatura.findUnique.mockResolvedValue({ id: 1, candidatoId: 1, status: "EM_ANALISE" });
      const res = mockRes();
      await cancelar(mockReq({ params: { id: "1" } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("cancela com sucesso", async () => {
      prisma.candidato.findUnique.mockResolvedValue({ id: 1 });
      prisma.candidatura.findUnique.mockResolvedValue({ id: 1, candidatoId: 1, status: "PENDENTE" });
      prisma.candidatura.delete.mockResolvedValue({});
      const res = mockRes();
      await cancelar(mockReq({ params: { id: "1" } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe("listarPorVaga", () => {
    it("retorna 400 para vagaId invalido", async () => {
      const res = mockRes();
      await listarPorVaga(mockReq({ params: { vagaId: "abc" } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 404 se vaga nao existe", async () => {
      prisma.vaga.findUnique.mockResolvedValue(null);
      const res = mockRes();
      await listarPorVaga(mockReq({ params: { vagaId: "1" } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("retorna 403 se empresa nao e dona da vaga", async () => {
      prisma.vaga.findUnique.mockResolvedValue({ id: 1, empresa: { usuarioId: 999 } });
      const res = mockRes();
      await listarPorVaga(mockReq({ params: { vagaId: "1" } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("retorna candidaturas da vaga", async () => {
      prisma.vaga.findUnique.mockResolvedValue({ id: 1, empresa: { usuarioId: 1 } });
      prisma.candidatura.findMany.mockResolvedValue([{ id: 1 }]);
      const res = mockRes();
      await listarPorVaga(mockReq({ params: { vagaId: "1" } }), res, jest.fn());
      expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
    });
  });

  describe("atualizarStatus", () => {
    it("retorna 400 para id invalido", async () => {
      const res = mockRes();
      await atualizarStatus(mockReq({ params: { id: "abc" }, body: { status: "APROVADO" } }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 400 para status invalido", async () => {
      const res = mockRes();
      await atualizarStatus(
        mockReq({ params: { id: "1" }, body: { status: "INVALIDO" } }),
        res, jest.fn()
      );
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 403 se empresa nao e dona da vaga", async () => {
      prisma.candidatura.findUnique.mockResolvedValue({
        id: 1,
        vaga: { empresa: { usuarioId: 999 } },
      });
      const res = mockRes();
      await atualizarStatus(
        mockReq({ params: { id: "1" }, body: { status: "APROVADO" } }),
        res, jest.fn()
      );
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("atualiza status com sucesso", async () => {
      prisma.candidatura.findUnique.mockResolvedValue({
        id: 1,
        vaga: { empresa: { usuarioId: 1 } },
      });
      prisma.candidatura.update.mockResolvedValue({ id: 1, status: "APROVADO" });
      const res = mockRes();
      await atualizarStatus(
        mockReq({ params: { id: "1" }, body: { status: "APROVADO" } }),
        res, jest.fn()
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "APROVADO" }));
    });
  });
});
