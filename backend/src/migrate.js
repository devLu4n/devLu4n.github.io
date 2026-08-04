const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);

function sanitize(message = "") {
  const databaseUrl = process.env.DATABASE_URL;
  return databaseUrl ? message.replaceAll(databaseUrl, "[DATABASE_URL]") : message;
}

async function handler(event = {}) {
  const taskRoot = process.env.LAMBDA_TASK_ROOT || process.cwd();
  const prismaCli = path.join(taskRoot, "node_modules", "prisma", "build", "index.js");
  const migration = event.migration;
  const args = event.action === "resolve-rolled-back"
    ? [prismaCli, "migrate", "resolve", "--rolled-back", migration]
    : [prismaCli, "migrate", "deploy"];

  if (event.action === "resolve-rolled-back" && !/^\d{14}_[a-z0-9_]+$/.test(migration || "")) {
    throw new Error("Nome de migration invalido.");
  }

  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      args,
      {
        cwd: taskRoot,
        env: process.env,
        maxBuffer: 1024 * 1024,
      }
    );

    console.log(sanitize(stdout));
    return { status: "ok" };
  } catch (error) {
    const details = sanitize(error.stderr || error.message);
    console.error(details);
    throw new Error("Falha ao aplicar migrations do Prisma.");
  }
}

module.exports = { handler, sanitize };
