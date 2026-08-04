function sessionStoreOptions(databaseUrl, isProduction) {
  return {
    conObject: {
      connectionString: databaseUrl,
      ssl: isProduction ? { rejectUnauthorized: true } : undefined,
    },
    tableName: "user_sessions",
    createTableIfMissing: false,
  };
}

module.exports = { sessionStoreOptions };
