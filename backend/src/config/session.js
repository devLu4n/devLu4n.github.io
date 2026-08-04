function isProduction() {
  return process.env.NODE_ENV === "production";
}

function cookieOptions() {
  const production = isProduction();
  return {
    httpOnly: true,
    sameSite: production ? "none" : "lax",
    secure: production,
    maxAge: 1000 * 60 * 60 * 24,
  };
}

function clearCookieOptions() {
  const { maxAge, ...options } = cookieOptions();
  return options;
}

module.exports = { cookieOptions, clearCookieOptions };
