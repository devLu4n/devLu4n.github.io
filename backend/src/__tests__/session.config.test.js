const { cookieOptions, clearCookieOptions } = require("../config/session");

describe("configuracao de cookie", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
      return;
    }
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("usa cookie lax e sem secure no desenvolvimento", () => {
    process.env.NODE_ENV = "development";
    expect(cookieOptions()).toEqual(expect.objectContaining({
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    }));
  });

  it("usa cookie cross-site seguro em producao", () => {
    process.env.NODE_ENV = "production";
    expect(cookieOptions()).toEqual(expect.objectContaining({
      httpOnly: true,
      sameSite: "none",
      secure: true,
    }));
    expect(clearCookieOptions()).not.toHaveProperty("maxAge");
  });
});
