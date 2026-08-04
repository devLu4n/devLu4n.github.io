const { sessionStoreOptions } = require("../config/sessionStore");

describe("configuracao do armazenamento de sessao", () => {
  it("exige TLS com validacao de certificado em producao", () => {
    const options = sessionStoreOptions("postgresql://usuario:senha@host/aladin", true);

    expect(options).toEqual(expect.objectContaining({
      conObject: {
        connectionString: "postgresql://usuario:senha@host/aladin",
        ssl: { rejectUnauthorized: true },
      },
      tableName: "user_sessions",
      createTableIfMissing: false,
    }));
    expect(options).not.toHaveProperty("conString");
  });

  it("preserva a conexao local sem TLS no desenvolvimento", () => {
    const options = sessionStoreOptions("postgresql://localhost/aladin", false);

    expect(options.conObject.ssl).toBeUndefined();
  });
});
