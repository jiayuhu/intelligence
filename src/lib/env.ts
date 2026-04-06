import { access, readFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

function parseEnvValue(rawValue: string): string {
  const trimmed = rawValue.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  return trimmed;
}

async function loadEnvFile(filePath: string, overwrite = false): Promise<void> {
  const exists = await access(filePath, fsConstants.F_OK)
    .then(() => true)
    .catch(() => false);
  if (!exists) {
    return;
  }

  const content = await readFile(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex <= 0) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    const value = parseEnvValue(line.slice(equalsIndex + 1));
    if (!key) {
      continue;
    }

    if (!overwrite && process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = value;
  }
}

export async function loadRepoEnv(filePaths: string[]): Promise<void> {
  for (const [index, filePath] of filePaths.entries()) {
    await loadEnvFile(filePath, index > 0);
  }
}
