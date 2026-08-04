const serverless = require("serverless-http");
const app = require("./app");

const proxy = serverless(app, { provider: "aws" });

async function handler(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;
  return proxy(event, context);
}

module.exports = { handler };
