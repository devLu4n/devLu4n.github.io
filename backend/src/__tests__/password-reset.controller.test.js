const bcrypt = require("bcryptjs");

jest.mock("../config/prisma", () => ({
  usuario: { findUnique: jest.fn() },
  redefinicaoSenha: {
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
}));

jest.mock("bcryptjs", () => ({ hash: jest.fn() }));

const prisma = require("../config/prisma");
const {
  solicitarRedefinicaoSenha,
  redefinirSenha,
} = require("../controllers/auth.controller");

function response() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("redefinicao de senha", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = "test";
  });

  it("retorna 404 quando o email nao existe", async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    const res = response();

    await solicitarRedefinicaoSenha({ body: { email: "ausente@teste.com" } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: "Email nao encontrado." });
  });

  it("cria token e envia link quando o email existe", async () => {
    prisma.usuario.findUnique.mockResolvedValue({ id: 4, nome: "Ana", email: "ana@teste.com" });
    prisma.redefinicaoSenha.deleteMany.mockReturnValue({});
    prisma.redefinicaoSenha.create.mockReturnValue({});
    prisma.$transaction.mockResolvedValue([]);
    const res = response();

    await solicitarRedefinicaoSenha({ body: { email: " ANA@TESTE.COM " } }, res, jest.fn());

    expect(prisma.redefinicaoSenha.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ usuarioId: 4, tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/) }),
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      resetUrl: expect.stringContaining("?token="),
    }));
  });

  it("rejeita token invalido", async () => {
    const res = response();
    await redefinirSenha({ body: { token: "curto", novaSenha: "senha-segura" } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("troca o hash e invalida sessoes com token valido", async () => {
    const tx = {
      redefinicaoSenha: {
        findFirst: jest.fn().mockResolvedValue({ id: 2, usuarioId: 7 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      usuario: { update: jest.fn().mockResolvedValue({ id: 7 }) },
      $executeRaw: jest.fn().mockResolvedValue(1),
    };
    prisma.$transaction.mockImplementation((callback) => callback(tx));
    bcrypt.hash.mockResolvedValue("novo-hash");
    const res = response();

    await redefinirSenha({ body: { token: "a".repeat(64), novaSenha: "senha-segura" } }, res, jest.fn());

    expect(tx.usuario.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { senhaHash: "novo-hash" },
    });
    expect(tx.$executeRaw).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensagem: expect.any(String) }));
  });
});
