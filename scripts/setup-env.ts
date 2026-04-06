#!/usr/bin/env tsx
/**
 * 环境变量设置向导
 * 
 * 交互式配置所有必需的 secrets
 */

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(fileURLToPath(import.meta.url), "..", "..");

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function main(): Promise<void> {
  console.log("🔧 AI行业情报系统 - 环境变量设置向导\n");
  console.log("=".repeat(60));
  
  const envVars: Record<string, string> = {};
  
  // Google Search API
  console.log("\n📍 Google Search API 配置");
  console.log("-".repeat(40));
  console.log("获取方式: https://developers.google.com/custom-search/v1/overview");
  
  envVars.GOOGLE_SEARCH_API_KEY = await ask("Google API Key: ");
  envVars.GOOGLE_SEARCH_ENGINE_ID = await ask("Search Engine ID: ");
  
  // AgentMail
  console.log("\n📍 AgentMail 配置");
  console.log("-".repeat(40));
  console.log("获取方式: https://agentmail.to/");
  
  envVars.AI_INDUSTRY_AGENTMAIL_API_KEY = await ask("AgentMail API Key: ");
  envVars.AI_INDUSTRY_AGENTMAIL_INBOX_ID = await ask("AgentMail Inbox ID: ");
  
  const baseUrl = await ask("AgentMail Base URL (默认 https://api.agentmail.to): ");
  envVars.AI_INDUSTRY_AGENTMAIL_BASE_URL = baseUrl || "https://api.agentmail.to";
  
  // Email
  console.log("\n📍 邮件配置");
  console.log("-".repeat(40));
  
  envVars.AI_INDUSTRY_EMAIL_TO = await ask("收件人邮箱: ");
  envVars.AI_INDUSTRY_EMAIL_FROM = await ask("发件人邮箱: ");
  
  // 生成 .env 文件
  console.log("\n📝 生成 .env 文件...");
  
  let envContent = "# AI行业情报系统环境变量\n# 生成时间: " + new Date().toISOString() + "\n\n";
  
  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      envContent += `${key}=${value}\n`;
    }
  }
  
  const envPath = resolve(repoRoot, ".env");
  await writeFile(envPath, envContent, "utf8");
  
  console.log(`\n✅ 已生成 .env 文件: ${envPath}\n`);
  
  // 显示 GitHub Secrets 命令
  console.log("🔐 GitHub Secrets 设置命令:");
  console.log("-".repeat(40));
  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      const secretName = key.replace(/AI_INDUSTRY_/g, "").replace(/_/g, "_");
      console.log(`gh secret set ${secretName} --body "${value}"`);
    }
  }
  
  console.log("\n💡 提示:");
  console.log("  1. 安装 GitHub CLI: https://cli.github.com/");
  console.log("  2. 运行上述命令快速设置 secrets");
  console.log("  3. 或在 GitHub 网页手动添加: Settings → Secrets → Actions");
  
  rl.close();
}

main().catch((error: unknown) => {
  console.error("❌ 错误:", error);
  process.exit(1);
});