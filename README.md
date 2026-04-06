# AI行业情报系统

> 全自动 AI 行业情报收集、生成与分发系统

[![Daily Intelligence](https://github.com/your-username/intelligence/actions/workflows/daily-intelligence.yml/badge.svg)](https://github.com/your-username/intelligence/actions/workflows/daily-intelligence.yml)

---

## 功能特性

- 🤖 **全自动抓取**：支持 Tavily / Google Search API / RSS / Cheerio / Playwright 多策略抓取
- 📅 **智能归档**：按日期自动归档 source logs，自动清理30天前旧文件
- 🎯 **智能分类**：5大核心分类（AI Agent、AI Coding、模型与基础设施、政策与监管、社区热点）
- 🔄 **自动去重**：基于 URL 和标题相似度（75%阈值）自动去重
- 📊 **多格式输出**：Markdown → HTML → PDF → Email
- 📧 **自动发送**：通过 AgentMail / SMTP 自动发送邮件
- ⏰ **定时任务**：GitHub Actions 每日自动运行
- 💾 **智能缓存**：2小时 TTL 缓存，避免重复请求（适合每日运行场景）
- 🏥 **健康监控**：自动跟踪源健康状态，失败率超阈值时告警
- ⏱️ **灵活时间窗口**：支持分类定制时间窗口（社区24h / 默认48h / 政策72h）
- 🧪 **完整测试**：82个单元测试 + 集成测试，覆盖核心逻辑

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
# 交互式配置向导
npm run setup

# 或手动复制并编辑
cp .env.example .env
```

必需的环境变量：
- `TAVILY_API_KEY` - Tavily API Key（推荐，用于全自动抓取）
- `GOOGLE_SEARCH_API_KEY` - Google Search API Key（备选）
- `GOOGLE_SEARCH_ENGINE_ID` - Google Custom Search Engine ID（备选）
- `AGENTMAIL_API_KEY` - AgentMail API Key
- `AGENTMAIL_INBOX_ID` - AgentMail Inbox ID
- `EMAIL_TO` - 收件人邮箱
- `EMAIL_FROM` - 发件人邮箱

### 3. 运行

```bash
# 一键全自动（推荐）
npm run generate:auto:tavily    # 使用 Tavily（推荐）
# 或
npm run generate:auto:google    # 使用 Google API

# 或分步执行
npm run fetch:tavily      # 使用 Tavily 抓取（推荐）
# 或
npm run fetch:google      # 使用 Google API 抓取
npm run generate:all      # 生成报告
npm run send:email        # 发送邮件
```

---

## 项目结构

```
intelligence/
├── scripts/                    # 脚本目录
│   ├── fetch-intelligence.ts  # 统一抓取入口（RSS→Cheerio→Playwright）
│   ├── fetch-google-api.ts    # Google API 抓取
│   ├── fetch-realtime.ts      # 半自动抓取（SearchWeb）
│   ├── generate-fetch.ts      # 生成 fetch JSON
│   ├── generate-md.ts         # 生成 Markdown 报告
│   ├── generate-report.ts     # 生成 HTML 报告
│   ├── export-pdf.ts          # 导出 PDF
│   ├── send-email.ts          # 发送邮件
│   └── setup-env.ts           # 环境变量设置向导
├── src/                        # 核心源代码
│   ├── lib/
│   │   ├── fetch/             # 抓取模块
│   │   │   ├── strategies/    # 抓取策略
│   │   │   │   ├── rss.ts    # RSS 抓取
│   │   │   │   ├── cheerio.ts # 静态 HTML 抓取
│   │   │   │   ├── playwright.ts # 动态 JS 抓取
│   │   │   │   └── index.ts  # 策略调度器
│   │   │   ├── cache.ts      # 请求缓存（2小时 TTL）
│   │   │   └── health-monitor.ts # 健康监控
│   │   ├── fetch-utils.ts    # 抓取工具函数
│   │   ├── fetch-config.ts   # 集中配置常量
│   │   └── intelligence-engine/ # 情报引擎
│   │       ├── deduplicator.ts # 去重算法
│   │       └── value-assessor.ts # 价值评估
│   └── types/                # TypeScript 类型定义
├── prompts/ai-industry/        # 提示词和配置
│   ├── source-logs/           # 按日期归档的 source logs
│   │   ├── 2026-04-05.md
│   │   ├── 2026-04-06.md
│   │   ├── latest.md -> ...   # 软链接
│   │   └── archive/           # 30天+归档
│   ├── sources.md             # 信息源优先级
│   ├── keywords.md            # 关键词表
│   └── collect-output-schema.json  # JSON Schema
├── tests/                      # 测试目录
│   ├── fetch-utils.test.ts   # 工具函数测试（29个）
│   ├── deduplicator.test.ts  # 去重算法测试（11个）
│   ├── health-monitor.test.ts # 健康监控测试（11个）
│   └── integration/          # 集成测试
│       └── fetch.test.ts     # Fetch 集成测试（16个）
├── outputs/                    # 输出目录
│   ├── fetch/                 # 抓取结果 JSON
│   ├── md/                    # Markdown 报告
│   ├── html/                  # HTML 报告
│   ├── pdf/                   # PDF 报告
│   └── email/                 # 邮件文件
├── .github/workflows/          # GitHub Actions
│   ├── daily-intelligence.yml # 定时工作流
│   └── ci.yml                 # CI 测试工作流
├── docs/                       # 文档
│   ├── auto-workflow-guide.md
│   ├── google-api-setup.md
│   └── github-actions-setup.md
├── MEMORY.md                   # 项目知识库
└── package.json
```

---

## 可用命令

### 核心命令

| 命令 | 说明 |
|------|------|
| `npm run setup` | 交互式环境变量配置 |
| `npm run generate:auto:tavily` | 全自动一键运行 - Tavily（推荐） |
| `npm run generate:auto:google` | 全自动一键运行 - Google API |

### 抓取命令

| 命令 | 说明 |
|------|------|
| `npm run fetch` | 统一抓取（RSS→Cheerio→Playwright） |
| `npm run fetch:tavily` | Tavily AI 搜索全自动抓取（推荐） |
| `npm run fetch:google` | Google API 全自动抓取 |
| `npm run fetch:realtime` | 半自动抓取（需手动 SearchWeb） |
| `npm run fetch:tasks` | 显示搜索任务清单 |
| `npm run test:tavily` | 测试 Tavily API 配置 |

### 生成命令

| 命令 | 说明 |
|------|------|
| `npm run generate:fetch` | 生成 fetch JSON |
| `npm run generate:md` | 生成 Markdown 报告 |
| `npm run generate:report` | 生成 HTML 报告 |
| `npm run generate:all` | 执行所有生成步骤 |
| `npm run export:pdf` | 导出 PDF |
| `npm run render:email` | 生成邮件预览 |
| `npm run send:email` | 发送邮件 |

### 测试命令

| 命令 | 说明 |
|------|------|
| `npm test` | 运行所有测试（67个） |
| `npm run test:watch` | 监视模式运行测试 |
| `npm run test:ui` | UI 模式运行测试 |

### 验证命令

| 命令 | 说明 |
|------|------|
| `npm run validate:ai-industry-samples` | 验证样例数据格式 |
| `npm run lint` | 代码格式检查 |
| `npm run build` | TypeScript 编译 |

---

## 抓取策略

系统采用三层抓取策略，按优先级自动降级：

```
┌─────────────────────────────────────────────────────────────┐
│  RSS (最快 ~1s)                                          │
│  └── 适用于提供 RSS feed 的网站（如 TechCrunch、Verge）  │
├─────────────────────────────────────────────────────────────┤
│  Cheerio (中等 ~2-3s)                                    │
│  └── 适用于静态 HTML 页面                                │
├─────────────────────────────────────────────────────────────┤
│  Playwright (最慢 ~5-10s)                                │
│  └── 适用于 JavaScript 渲染或反爬保护的网站              │
└─────────────────────────────────────────────────────────────┘
```

### 策略选择逻辑

```typescript
// 根据源配置自动选择策略
if (source.rssUrl) {
  return fetchWithRss(source);      // 优先 RSS
} else if (source.selectors) {
  return fetchWithCheerio(source);  // 其次 Cheerio
} else {
  return fetchWithPlaywright(source); // 最后 Playwright
}
```

---

## 缓存策略

### 默认配置（2小时 TTL）

```typescript
CACHE: {
  TTL_MS: 2 * 60 * 60 * 1000,  // 2小时
  MAX_SIZE: 100,               // 最大100条
  CLEANUP_INTERVAL_MS: 30 * 60 * 1000, // 30分钟清理一次
}
```

### 适用场景

- **每日运行**：2小时缓存足够覆盖单次运行，避免重复请求
- **手动调试**：支持通过 `clearGlobalCache()` 手动清除
- **多源共享**：同一缓存实例被所有策略共享

### 缓存键命名

```typescript
`rss:${source.rssUrl}`      // RSS 缓存
`cheerio:${siteUrl}`        // Cheerio 缓存
```

---

## 健康监控

### 功能特性

1. **自动跟踪**：记录每个源的抓取尝试（成功/失败）
2. **失败率计算**：超过阈值（默认50%）触发告警
3. **历史持久化**：每日保存健康记录到 `outputs/health/`
4. **多种告警**：支持控制台、邮件、Webhook 告警

### 配置

```typescript
HEALTH: {
  FAILURE_RATE_THRESHOLD: 0.5,  // 50% 失败率阈值
  MIN_ATTEMPTS: 3,              // 最少3次尝试才告警
  HISTORY_DAYS: 7,              // 保留7天历史
}
```

### 使用示例

```typescript
import { getGlobalHealthMonitor } from "./src/lib/fetch/health-monitor.js";

const monitor = getGlobalHealthMonitor({
  emailAlert: true,
  emailRecipients: ["admin@example.com"],
});

// 记录尝试
monitor.recordAttempt({
  sourceId: "techcrunch",
  sourceName: "TechCrunch",
  success: true,
  itemsFetched: 5,
  responseTime: 1200,
});

// 生成报告
const report = monitor.generateReport();
console.log(report.summary);
```

---

## 自动化方案对比

| 特性 | 统一抓取 (`npm run fetch`) | Google API (`fetch:google`) | 半自动 (`fetch:realtime`) |
|------|---------------------------|----------------------------|--------------------------|
| 搜索方式 | RSS/Cheerio/Playwright | Google Search API | 手动执行 SearchWeb |
| 配置复杂度 | 低 | 中 | 低 |
| 速度 | 快（有缓存） | 中等 | 慢（需人工） |
| 稳定性 | 高（多策略降级） | 高 | 中 |
| 适用场景 | **推荐日常使用** | 定时任务 | 补充抓取 |

---

## GitHub Actions 自动化

### 配置 Secrets

在 GitHub 仓库设置中添加以下 Secrets：

- `GOOGLE_SEARCH_API_KEY`（可选）
- `GOOGLE_SEARCH_ENGINE_ID`（可选）
- `AGENTMAIL_API_KEY`
- `AGENTMAIL_INBOX_ID`
- `EMAIL_TO`
- `EMAIL_FROM`

### 工作流说明

| 工作流 | 触发条件 | 功能 |
|--------|----------|------|
| `daily-intelligence.yml` | 每天 09:00 (北京时间) | 自动生成并发送情报 |
| `ci.yml` | Push / PR | 运行测试和构建 |

### 手动触发

1. 进入 GitHub 仓库 → Actions 标签
2. 选择 "Daily AI Intelligence Report"
3. 点击 "Run workflow"

详细配置见 [GitHub Actions 设置指南](docs/github-actions-setup.md)。

---

## 测试覆盖

### 测试统计

| 测试文件 | 测试数量 | 覆盖范围 |
|----------|----------|----------|
| `fetch-utils.test.ts` | 29 | 日期解析、分类、相似度计算、截断 |
| `deduplicator.test.ts` | 11 | URL去重、相似度去重、事件聚类 |
| `health-monitor.test.ts` | 11 | 健康记录、告警、报告生成 |
| `integration/fetch.test.ts` | 16 | 缓存系统、浏览器管理、配置验证 |
| **总计** | **67** | - |

### 运行测试

```bash
npm test              # 运行所有测试
npm run test:watch    # 监视模式
npm run test:ui       # UI 模式（带覆盖率）
```

---

## 报告结构

生成的报告包含以下章节：

1. **执行摘要**
   - 一句话总览
   - 关键数据
   - 本期最大看点
   - 阅读指引

2. **核心动态**（按专栏分类）
   - AI Agent
   - AI Coding
   - AI 公司
   - AI 领袖人物
   - 模型与基础设施
   - 开源生态
   - 政策与监管

3. **趋势洞察**
   - 价值分布概览
   - 时间线分布
   - 主要情报来源
   - 企业动态对比
   - 热点关键词

4. **建议动作**
5. **信息缺口与追踪清单**

---

## 技术栈

- **Runtime**: Node.js 20
- **Language**: TypeScript 5.8
- **Execution**: tsx
- **Testing**: Vitest
- **PDF Generation**: Playwright
- **Email**: AgentMail API / SMTP
- **Automation**: GitHub Actions

---

## 文档

- [全自动工作流指南](docs/auto-workflow-guide.md)
- [Google Search API 设置](docs/google-api-setup.md)
- [GitHub Actions 设置](docs/github-actions-setup.md)
- [项目知识库](MEMORY.md)

---

## 许可证

MIT

---

*Built with ❤️ for AI Intelligence*
