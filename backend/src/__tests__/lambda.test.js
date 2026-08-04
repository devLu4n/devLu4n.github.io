const mockProxy = jest.fn().mockResolvedValue({ statusCode: 200, body: "{}" });

jest.mock("serverless-http", () => jest.fn(() => mockProxy));
jest.mock("../app", () => ({ application: true }));

const serverless = require("serverless-http");
const app = require("../app");
const { handler } = require("../lambda");

describe("lambda handler", () => {
  it("adapta o Express e nao aguarda o event loop vazio", async () => {
    const event = { requestContext: { http: { method: "GET" } } };
    const context = { callbackWaitsForEmptyEventLoop: true };

    const response = await handler(event, context);

    expect(serverless).toHaveBeenCalledWith(app, { provider: "aws" });
    expect(context.callbackWaitsForEmptyEventLoop).toBe(false);
    expect(mockProxy).toHaveBeenCalledWith(event, context);
    expect(response.statusCode).toBe(200);
  });
});
