/**
 * fetch-utils 单元测试
 */

import { describe, it, expect } from "vitest";
import {
  parseDate,
  autoClassify,
  calculateSimilarity,
  truncate,
  resolveLink,
  isWithinTimeWindow,
  getTimeWindow,
} from "../src/lib/fetch-utils.js";

describe("parseDate", () => {
  it("应该解析 ISO 格式日期", () => {
    const result = parseDate("2026-04-06T12:00:00Z");
    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe("2026-04-06T12:00:00.000Z");
  });

  it("应该解析相对时间（minutes ago）", () => {
    const result = parseDate("30 minutes ago");
    expect(result).toBeInstanceOf(Date);
    const now = new Date();
    const diff = now.getTime() - result!.getTime();
    expect(diff).toBeGreaterThan(29 * 60 * 1000);
    expect(diff).toBeLessThan(31 * 60 * 1000);
  });

  it("应该解析相对时间（hours ago）", () => {
    const result = parseDate("2 hours ago");
    expect(result).toBeInstanceOf(Date);
    const now = new Date();
    const diff = now.getTime() - result!.getTime();
    expect(diff).toBeGreaterThan(1.9 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(2.1 * 60 * 60 * 1000);
  });

  it("应该解析相对时间（days ago）", () => {
    const result = parseDate("1 day ago");
    expect(result).toBeInstanceOf(Date);
    const now = new Date();
    const diff = now.getTime() - result!.getTime();
    expect(diff).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(25 * 60 * 60 * 1000);
  });

  it("应该返回 null 对于无效日期", () => {
    expect(parseDate("")).toBeNull();
    expect(parseDate("invalid")).toBeNull();
    expect(parseDate("not a date")).toBeNull();
  });
});

describe("autoClassify", () => {
  it("应该正确分类 AI Agent", () => {
    expect(autoClassify("OpenAI releases new Agent framework")).toBe("AI Agent");
    expect(autoClassify("LangChain updates their tools")).toBe("AI Agent");
    expect(autoClassify("Multi-agent system announced")).toBe("AI Agent");
  });

  it("应该正确分类 AI Coding", () => {
    expect(autoClassify("GitHub Copilot new features")).toBe("AI Coding");
    expect(autoClassify("Cursor IDE update")).toBe("AI Coding");
    expect(autoClassify("Claude Code release")).toBe("AI Coding");
  });

  it("领袖人物相关内容应归入模型与基础设施", () => {
    expect(autoClassify("Sam Altman interview")).toBe("模型与基础设施");
    expect(autoClassify("CEO of Anthropic speaks")).toBe("模型与基础设施");
  });

  it("应该正确分类模型与基础设施", () => {
    expect(autoClassify("GPT-5 model released")).toBe("模型与基础设施");
    expect(autoClassify("New LLM benchmark results")).toBe("模型与基础设施");
  });

  it("开源相关内容应归入模型与基础设施", () => {
    expect(autoClassify("Llama 3 open source release")).toBe("模型与基础设施");
    expect(autoClassify("Mistral 7B goes open source")).toBe("模型与基础设施");
  });

  it("应该正确分类政策与监管", () => {
    expect(autoClassify("EU AI Act implementation")).toBe("政策与监管");
    expect(autoClassify("New AI safety regulations")).toBe("政策与监管");
  });

  it("默认应该分类为模型与基础设施", () => {
    expect(autoClassify("Some random tech news")).toBe("模型与基础设施");
    expect(autoClassify("General update")).toBe("模型与基础设施");
  });
});

describe("calculateSimilarity", () => {
  it("完全相同应该返回 1", () => {
    expect(calculateSimilarity("hello world", "hello world")).toBe(1);
  });

  it("包含关系应该返回 0.9", () => {
    expect(calculateSimilarity("hello world", "hello world news")).toBe(0.9);
    expect(calculateSimilarity("hello world news", "hello world")).toBe(0.9);
  });

  it("部分相似应该在 0 和 1 之间", () => {
    const sim = calculateSimilarity("OpenAI releases GPT-5", "OpenAI launches GPT-5 model");
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
  });

  it("完全不相关应该接近 0", () => {
    const sim = calculateSimilarity("abc xyz", "123 456");
    expect(sim).toBe(0);
  });

  it("应该忽略大小写和标点", () => {
    expect(calculateSimilarity("Hello World!", "hello world")).toBe(1);
  });
});

describe("truncate", () => {
  it("短文本不应该被截断", () => {
    expect(truncate("short", 100)).toBe("short");
  });

  it("长文本应该被截断", () => {
    const long = "a".repeat(200);
    expect(truncate(long, 100)).toBe("a".repeat(100) + "...");
  });

  it("应该处理空字符串", () => {
    expect(truncate("", 100)).toBe("");
  });
});

describe("resolveLink", () => {
  it("应该保留绝对链接", () => {
    expect(resolveLink("https://example.com/path", "https://base.com")).toBe(
      "https://example.com/path"
    );
  });

  it("应该解析相对链接（/开头）", () => {
    expect(resolveLink("/path/to/page", "https://example.com")).toBe(
      "https://example.com/path/to/page"
    );
  });

  it("应该解析相对链接（无/开头）", () => {
    expect(resolveLink("path/to/page", "https://example.com/dir/")).toBe(
      "https://example.com/dir/path/to/page"
    );
  });

  it("应该处理空链接", () => {
    expect(resolveLink("", "https://example.com")).toBe("");
  });
});

describe("isWithinTimeWindow", () => {
  it("48小时内的日期应该返回 true", () => {
    const date = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24小时前
    expect(isWithinTimeWindow(date)).toBe(true);
  });

  it("48小时外的日期应该返回 false", () => {
    const date = new Date(Date.now() - 72 * 60 * 60 * 1000); // 72小时前
    expect(isWithinTimeWindow(date)).toBe(false);
  });

  it("未来日期应该返回 true", () => {
    const date = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1小时后
    expect(isWithinTimeWindow(date)).toBe(true);
  });
});

describe("getTimeWindow", () => {
  it("默认应该返回48小时窗口", () => {
    const window = getTimeWindow();
    const duration = window.end.getTime() - window.start.getTime();
    expect(duration).toBe(48 * 60 * 60 * 1000);
  });

  it("应该支持自定义小时数", () => {
    const window = getTimeWindow(24);
    const duration = window.end.getTime() - window.start.getTime();
    expect(duration).toBe(24 * 60 * 60 * 1000);
  });
});
