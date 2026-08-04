const mockExecFile = jest.fn();

jest.mock("node:child_process", () => ({ execFile: mockExecFile }));

describe("migration handler", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    jest.clearAllMocks();
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it("executa prisma migrate deploy", async () => {
    mockExecFile.mockImplementation((file, args, options, callback) => {
      callback(null, "Migrations aplicadas", "");
    });
    const { handler } = require("../migrate");

    await expect(handler()).resolves.toEqual({ status: "ok" });
    expect(mockExecFile).toHaveBeenCalledWith(
      process.execPath,
      expect.arrayContaining([expect.stringContaining("prisma"), "migrate", "deploy"]),
      expect.objectContaining({ env: process.env }),
      expect.any(Function)
    );
  });

  it("nao expoe a URL do banco em erros", async () => {
    process.env.DATABASE_URL = "postgresql://usuario:senha@host/aladin";
    const { sanitize } = require("../migrate");

    expect(sanitize(`Erro em ${process.env.DATABASE_URL}`)).toBe("Erro em [DATABASE_URL]");
  });

  it("valida o nome antes de resolver uma migration", async () => {
    const { handler } = require("../migrate");

    await expect(handler({ action: "resolve-rolled-back", migration: "../../invalida" }))
      .rejects.toThrow("Nome de migration invalido.");
    expect(mockExecFile).not.toHaveBeenCalled();
  });
});
