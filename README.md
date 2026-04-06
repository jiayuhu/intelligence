# AI行业情报系统

> 全自动 AI 行业情报收集、生成与分发系统

[![Daily Intelligence](https://github.com/your-username/intelligence/actions/workflows/daily-intelligence.yml/badge.svg)](https://github.com/your-username/intelligence/actions/workflows/daily-intelligence.yml)

---

## 功能特性

- 🤖 **全自动抓取**：支持 Google Search API 全自动抓取，无需人工干预
- 📅 **智能归档**：按日期自动归档 source logs，自动清理30天前旧文件
- 🎯 **智能分类**：自动分类为 AI Agent、AI Coding、头部企业、领袖人物等
- 🔄 **自动去重**：基于 URL 和标题相似度（75%阈值）自动去重
- 📊 **多格式输出**：Markdown → HTML → PDF → Email
- 📧 **自动发送**：通过 AgentMail 自动发送邮件
- ⏰ **定时任务**：GitHub Actions 每日自动运行

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
- `GOOGLE_SEARCH_API_KEY` - Google Search API Key
- `GOOGLE_SEARCH_ENGINE_ID` - Google Custom Search Engine ID
- `AGENTMAIL_API_KEY` - AgentMail API Key
- `AGENTMAIL_INBOX_ID` - AgentMail Inbox ID
- `EMAIL_TO` - 收件人邮箱
- `EMAIL_FROM` - 发件人邮箱

### 3. 运行

```bash
# 一键全自动
npm run generate:auto:google

# 或分步执行
npm run fetch:google      # 抓取情报
npm run generate:all      # 生成报告
npm run send:email        # 发送邮件
```

---

## 项目结构

```
intelligence/
├── scripts/                    # 脚本目录
│   ├── fetch-realtime.ts      # 半自动抓取（SearchWeb）
│   ├── fetch-google-api.ts    # 全自动抓取（Google API）
│   ├── generate-fetch.ts      # 生成 fetch JSON
│   ├── generate-md-v2.ts      # 生成 Markdown 报告
│   ├── generate-report.ts     # 生成 HTML 报告
│   ├── export-pdf.ts          # 导出 PDF
│   ├── send-email.ts          # 发送邮件
│   └── setup-env.ts           # 环境变量设置向导
├── prompts/ai-industry/        # 提示词和配置
│   ├── source-logs/           # 按日期归档的 source logs
│   │   ├── 2026-04-05.md
│   │   ├── 2026-04-06.md
│   │   ├── latest.md -> ...   # 软链接
│   │   └── archive/           # 30天+归档
│   ├── sources.md             # 信息源优先级
│   ├── keywords.md            # 关键词表
│   └── collect-output-schema.json  # JSON Schema
├── outputs/                    # 输出目录
│   ├── fetch/                 # 抓取结果 JSON
│   ├── md/                    # Markdown 报告
│   ├── html/                  # HTML 报告
│   ├── pdf/                   # PDF 报告
│   └── email/                 # 邮件文件
├── .github/workflows/          # GitHub Actions
│   └── daily-intelligence.yml # 定时工作流
├── docs/                       # 文档
│   ├── auto-workflow-guide.md
│   ├── google-api-setup.md
│   └── github-actions-setup.md
├── MEMORY.md                   # 项目知识库
└── package.json
```

---

## 可用命令

| 命令 | 说明 |
|------|------|
| `npm run setup` | 交互式环境变量配置 |
| `npm run fetch:tasks` | 显示搜索任务清单 |
| `npm run fetch:realtime` | 半自动抓取（需手动 SearchWeb） |
| `npm run fetch:google` | 全自动抓取（Google API） |
| `npm run generate:fetch` | 生成 fetch JSON |
| `npm run generate:md` | 生成 Markdown 报告 |
| `npm run generate:report` | 生成 HTML 报告 |
| `npm run export:pdf` | 导出 PDF |
| `npm run render:email` | 生成邮件预览 |
| `npm run send:email` | 发送邮件 |
| `npm run generate:all` | 执行所有生成步骤 |
| `npm run generate:auto` | 半自动一键运行 |
| `npm run generate:auto:google` | 全自动一键运行 |

---

## 自动化方案对比

| 特性 | 半自动 (`fetch:realtime`) | 全自动 (`fetch:google`) |
|------|--------------------------|------------------------|
| 搜索方式 | 手动执行 SearchWeb | Google Search API |
| 人工干预 | 需要复制搜索词 | 完全自动 |
| 成本 | 免费 | 免费额度 100次/天 |
| 适用场景 | 每日/按需运行 | 定时任务、无人值守 |

---

## GitHub Actions 自动化

### 配置 Secrets

在 GitHub 仓库设置中添加以下 Secrets：

- `GOOGLE_SEARCH_API_KEY`
- `GOOGLE_SEARCH_ENGINE_ID`
- `AGENTMAIL_API_KEY`
- `AGENTMAIL_INBOX_ID`
- `EMAIL_TO`
- `EMAIL_FROM`

### 定时运行

工作流默认每天北京时间 09:00 自动运行。

### 手动触发

1. 进入 GitHub 仓库 → Actions 标签
2. 选择 "Daily AI Intelligence Report"
3. 点击 "Run workflow"

详细配置见 [GitHub Actions 设置指南](docs/github-actions-setup.md)。

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
   - AI 企业
   - AI 领袖人物
   - 模型与基础设施
   - 社媒热点

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