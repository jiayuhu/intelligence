import path from "node:path";
import { fileURLToPath } from "node:url";

export function getRepoRoot(scriptUrl: string): string {
  const scriptFile = fileURLToPath(scriptUrl);
  const scriptDir = path.dirname(scriptFile);
  return path.resolve(scriptDir, "..");
}

export function getReportDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function getIntelOutputPath(args: {
  repoRoot: string;
  outputDirName: "prompts" | "fetch" | "md" | "html" | "email" | "pdf";
  categoryKey: string;
  reportDate: string;
  extension: "md" | "html" | "pdf" | "json" | "eml";
}): string {
  return path.join(
    args.repoRoot,
    "outputs",
    args.outputDirName,
    `${args.categoryKey}-${args.reportDate}.${args.extension}`,
  );
}

export function getIntelOutputDirPath(args: {
  repoRoot: string;
  outputDirName: "prompts" | "fetch" | "md" | "html" | "email" | "pdf";
}): string {
  return path.join(args.repoRoot, "outputs", args.outputDirName);
}

export function getTemplatePath(repoRoot: string, ...segments: string[]): string {
  return path.join(repoRoot, "templates", ...segments);
}

export function getPromptPath(repoRoot: string, ...segments: string[]): string {
  return path.join(repoRoot, "prompts", ...segments);
}
