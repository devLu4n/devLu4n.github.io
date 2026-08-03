const bcrypt = require("bcryptjs");

jest.mock("../config/prisma", () => ({
  usuario: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const prisma = require("../config/prisma");
const { registrar, login, logout, me } = require("../controllers/auth.controller");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides = {}) {
  return {
    body: {},
    session: {
      usuarioId: null,
      regenerate: jest.fn((cb) => cb(null)),
      destroy: jest.fn((cb) => cb(null)),
    },
    ...overrides,
  };
}

describe("auth.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registrar", () => {
    it("retorna 400 se campos obrigatorios faltam", async () => {
      const req = mockReq({ body: { nome: "Joao" } });
      const res = mockRes();

      await registrar(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ erro: expect.any(String) })
      );
    });

    it("retorna 400 se senha nao e string", async () => {
      const req = mockReq({ body: { nome: "Joao", email: "j@e.com", senha: 123456 } });
      const res = mockRes();

      await registrar(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 400 se senha tem menos de 6 caracteres", async () => {
      const req = mockReq({ body: { nome: "Joao", email: "j@e.com", senha: "abc" } });
      const res = mockRes();

      await registrar(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 409 se email ja esta cadastrado", async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 1, email: "j@e.com" });

      const req = mockReq({ body: { nome: "Joao", email: "j@e.com", senha: "123456" } });
      const res = mockRes();

      await registrar(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("normaliza email para lowercase e trim", async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.usuario.create.mockResolvedValue({ id: 1, nome: "Joao", email: "j@e.com", senhaHash: "hash" });
      bcrypt.hash.mockResolvedValue("hash");

      const req = mockReq({ body: { nome: "Joao", email: "  J@E.COM  ", senha: "123456" } });
      const res = mockRes();

      await registrar(req, res, jest.fn());

      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({ where: { email: "j@e.com" } });
      expect(prisma.usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ email: "j@e.com" }) })
      );
    });

    it("regenera a sessao apos registro", async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.usuario.create.mockResolvedValue({ id: 5, nome: "Joao", email: "j@e.com", senhaHash: "hash" });
      bcrypt.hash.mockResolvedValue("hash");

      const req = mockReq({ body: { nome: "Joao", email: "j@e.com", senha: "123456" } });
      const res = mockRes();

      await registrar(req, res, jest.fn());

      expect(req.session.regenerate).toHaveBeenCalled();
      expect(req.session.usuarioId).toBe(5);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("cria o perfil empresarial junto com a conta de empresa", async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.usuario.create.mockResolvedValue({
        id: 8, nome: "Empresa Teste", email: "empresa@teste.com", senhaHash: "hash", role: "EMPRESA",
      });
      bcrypt.hash.mockResolvedValue("hash");

      const req = mockReq({
        body: { nome: "Empresa Teste", email: "empresa@teste.com", senha: "123456", role: "EMPRESA" },
      });
      const res = mockRes();

      await registrar(req, res, jest.fn());

      expect(prisma.usuario.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: "EMPRESA",
          empresa: { create: { nome: "Empresa Teste" } },
        }),
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("login", () => {
    it("retorna 400 se email ou senha faltam", async () => {
      const req = mockReq({ body: { email: "j@e.com" } });
      const res = mockRes();

      await login(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 400 se senha nao e string", async () => {
      const req = mockReq({ body: { email: "j@e.com", senha: ["hack"] } });
      const res = mockRes();

      await login(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("retorna 401 se usuario nao existe", async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      const req = mockReq({ body: { email: "naoexiste@e.com", senha: "123456" } });
      const res = mockRes();

      await login(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("retorna 401 se senhaHash e null", async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 1, email: "j@e.com", senhaHash: null });

      const req = mockReq({ body: { email: "j@e.com", senha: "123456" } });
      const res = mockRes();

      await login(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("retorna 401 se senha esta incorreta", async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 1, email: "j@e.com", senhaHash: "hash" });
      bcrypt.compare.mockResolvedValue(false);

      const req = mockReq({ body: { email: "j@e.com", senha: "errada" } });
      const res = mockRes();

      await login(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("normaliza email no login", async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 1, email: "j@e.com", senhaHash: "hash" });
      bcrypt.compare.mockResolvedValue(true);

      const req = mockReq({ body: { email: "  J@E.COM ", senha: "123456" } });
      const res = mockRes();

      await login(req, res, jest.fn());

      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({ where: { email: "j@e.com" } });
    });

    it("regenera sessao e retorna sucesso no login", async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 3, email: "j@e.com", senhaHash: "hash", nome: "J" });
      bcrypt.compare.mockResolvedValue(true);

      const req = mockReq({ body: { email: "j@e.com", senha: "123456" } });
      const res = mockRes();

      await login(req, res, jest.fn());

      expect(req.session.regenerate).toHaveBeenCalled();
      expect(req.session.usuarioId).toBe(3);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ mensagem: expect.any(String) })
      );
    });

    it("impede conta empresarial no login de candidato", async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 4, email: "empresa@e.com", senhaHash: "hash", role: "EMPRESA",
      });
      bcrypt.compare.mockResolvedValue(true);
      const req = mockReq({
        body: { email: "empresa@e.com", senha: "123456", tipoConta: "candidato" },
      });
      const res = mockRes();

      await login(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(403);
      expect(req.session.regenerate).not.toHaveBeenCalled();
    });

    it("impede conta de candidato no login empresarial", async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 5, email: "candidato@e.com", senhaHash: "hash", role: "CANDIDATO",
      });
      bcrypt.compare.mockResolvedValue(true);
      const req = mockReq({
        body: { email: "candidato@e.com", senha: "123456", tipoConta: "empresa" },
      });
      const res = mockRes();

      await login(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(403);
      expect(req.session.regenerate).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("destroi sessao e limpa cookie", () => {
      const req = mockReq();
      const res = mockRes();

      logout(req, res, jest.fn());

      expect(req.session.destroy).toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith("aladin.sid", {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      });
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("me", () => {
    it("retorna 401 se nao tem sessao", async () => {
      const req = mockReq({ session: {} });
      const res = mockRes();

      await me(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("retorna 404 se usuario nao existe no banco", async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      const req = mockReq({ session: { usuarioId: 999 } });
      const res = mockRes();

      await me(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("retorna dados do usuario sem senhaHash", async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 1, nome: "Joao", email: "j@e.com", senhaHash: "hash", empresa: null,
      });

      const req = mockReq({ session: { usuarioId: 1 } });
      const res = mockRes();

      await me(req, res, jest.fn());

      const retornado = res.json.mock.calls[0][0].usuario;
      expect(retornado.senhaHash).toBeUndefined();
      expect(retornado.nome).toBe("Joao");
    });
  });
});
