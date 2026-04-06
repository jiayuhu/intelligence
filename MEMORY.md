# AI Industry Intelligence System - Memory

> Last updated: 2026-04-05
> Extracted from development conversation

---

## 1. Project Overview

| Item | Details |
|------|---------|
| **Project** | AI Industry Intelligence System (AI行业情报) |
| **Purpose** | Generate industry intelligence reports (Markdown → HTML → PDF) and send via email |
| **Tech Stack** | TypeScript/Node.js, `tsx` for execution, Playwright for PDF generation |
| **Email Channel** | AgentMail (tigerhooo@agentmail.to → tigerhooo@126.com) |
| **Reader Constraint** | Designed for "extremely few readers" - deliberately avoiding historical storage, personalization engines, or A/B testing |

---

## 2. Report Structure v2.0 (Final)

```
一、执行摘要（Executive Summary）
   ├── 一句话总览（宏观主题提炼）
   ├── 关键数据（表格：情报数、平均分、Agent占比等）
   ├── 本期最大看点（3个深度洞察）
   └── 阅读指引

二、核心动态（按专栏分类）
   ├── AI Agent（合并为一个专栏，不再细分代码型/通用型/企业型）
   ├── AI Coding
   ├── AI 企业（原"头部 AI 企业"）
   ├── AI 领袖人物
   ├── 模型与基础设施
   ├── 开源生态
   ├── 政策与监管
   ├── 社媒热点（新增：Twitter/X、LinkedIn、Reddit、HackerNews等）
   └── 其他动态

三、趋势洞察（数据可视化）
   ├── 价值分布概览（表格）
   ├── 时间线分布（柱状图）
   ├── 主要情报来源
   ├── 企业动态对比（GitHub vs OpenAI）
   ├── 本期热点关键词
   └── 关键趋势判断

四、建议动作
五、信息缺口与追踪清单
```

---

## 3. Content Specifications

### Event Description Requirements
- **Length**: 300-500 characters total
- **Main description**: ≥ 200 characters
- **Structure**:
  1. Core facts (event_summary)
  2. Strategic impact (why_it_matters)
  3. Supporting sources (community feedback)
  4. Related focus areas
  5. Decision recommendations
  6. Timeline suggestion

### Removed Sections (as of final version)
- ❌ Decision suggestions (高管层/产品层/技术层)
- ❌ Value scoring (5-dimension: novelty/impact/credibility/timeliness/relevance)
- ❌ Watch items checklist

### Kept Sections
- ✅ Event (detailed, 300-500 chars)
- ✅ Time
- ✅ Source (with credibility & priority)
- ✅ Impact Analysis (optional, simplified)

---

## 4. Visual Theme: Amethyst Dark (紫晶暗)

| Element | Color | Usage |
|---------|-------|-------|
| **Primary** | `#312e81` | Headings, strong text, borders |
| **Accent** | `#8b5cf6` | Section markers, left borders |
| **Background** | `#ffffff` | Card backgrounds |
| **Outer BG** | `#f8f7fb` | Page background |
| **Text** | `#374151` | Body text |
| **Muted** | `#6b7280` | Secondary text |

**Style Characteristics**:
- Minimal modern design
- No gradients, shadows, or complex decorations
- Left border accent (3-4px) for hierarchy
- Table-based layout for email compatibility

---

## 5. Key Scripts & Commands

```bash
# Generate all artifacts
npm run generate:all

# Individual steps
npm run generate:md       # Generate Markdown
npm run generate:report   # Generate HTML
npm run export:pdf        # Export PDF
npm run render:email      # Generate email preview
npm run send:email        # Send via AgentMail

# Validation
npm run validate:ai-industry-samples
```

---

## 6. Automation Support

### Cron Job Compatible
```cron
# Daily at 09:00 Beijing time
0 9 * * * cd /home/jiayuhu/dev/intelligence && npm run generate:all >> /var/log/intelligence.log 2>&1
```

### GitHub Actions (Recommended)
- Supports scheduled runs (`cron: '0 1 * * *'` for UTC 01:00)
- Supports manual trigger (`workflow_dispatch`)
- Requires secrets: `AGENTMAIL_API_KEY`, `AGENTMAIL_INBOX_ID`

---

## 7. Robustness Patterns

### Defensive Programming
- **Strings**: `value || "default"`
- **Arrays**: Check `?.length` before iteration
- **Objects**: Use optional chaining `?.`
- **Division**: Protect against divide-by-zero

### Example
```typescript
const avgScore = items.length > 0 
  ? Math.round(items.reduce((sum, a) => sum + (a?.totalScore || 0), 0) / items.length)
  : 0;
```

---

## 8. AI Agent Classification

### Subtypes (merged into single "AI Agent" column)
- `AI Agent - 代码型` (Coding Agents like OpenClaw, Devin)
- `AI Agent - 通用型` (General Agents like MultiOn, Adept)
- `AI Agent - 企业型` (Enterprise Agents)

### Detection Logic
```typescript
const isAgent = 
  item.classification?.startsWith("AI Agent") ||
  item.title.toLowerCase().includes("agent") ||
  item.title.toLowerCase().includes("openclaw") ||
  item.title.toLowerCase().includes("devin");
```

---

## 9. Social Media Sources

Recognized patterns for "社媒热点" column:
- `twitter.com`, `x.com`
- `linkedin.com`
- `reddit.com`
- `news.ycombinator.com` (HackerNews)
- `producthunt.com`
- `dev.to`
- `medium.com`
- `substack.com`

---

## 10. File Naming Conventions

| Output | Pattern | Example |
|--------|---------|---------|
| Markdown | `ai-industry-YYYY-MM-DD.md` | `ai-industry-2026-04-05.md` |
| HTML | `ai-industry-YYYY-MM-DD.html` | `ai-industry-2026-04-05.html` |
| PDF | `ai-industry-YYYY-MM-DD.pdf` | `ai-industry-2026-04-05.pdf` |
| Email | `ai-industry-YYYY-MM-DD.eml` | `ai-industry-2026-04-05.eml` |

---

## 11. Real-time Data Acquisition (Critical Finding)

### The Problem
The original system had a **static data source issue**:
- `first-run-source-log.md` contained only 8 static sample entries
- `generate:fetch` script only reads from this static file, performs no real-time scraping
- Rich configurations (`sources.md`, `keywords.md`, `search-queries.md`) exist but aren't actively used
- Result: Reports generated with stale/outdated information

### The Solution
**Use SearchWeb for real-time information gathering**:

```typescript
// Search key sources individually
SearchWeb({ query: "OpenAI news April 2026", limit: 10 })
SearchWeb({ query: "Anthropic Claude update April 2026", limit: 10 })
SearchWeb({ query: "GitHub Copilot agent April 2026", limit: 10 })
SearchWeb({ query: "xAI Grok update April 2026", limit: 8 })
SearchWeb({ query: "Google Gemini AI update April 2026", limit: 8 })
```

### Source Priority for Search
1. **P0 (Tier 1)**: OpenAI, Anthropic, Google DeepMind, Meta AI, Microsoft/GitHub
2. **P1 (Tier 2)**: xAI, Cursor, TechCrunch, VentureBeat, The Verge
3. **P2 (Tier 3)**: Developer communities (Reddit, HackerNews), LinkedIn

### Update Workflow
```
1. SearchWeb() → Get real-time news
2. Parse & filter (48h window, high credibility)
3. Update first-run-source-log.md with new entries
4. Run npm run generate:all
```

### April 5, 2026 Real-time Results Example
| Source | Key Intelligence |
|--------|------------------|
| OpenAI | Acquired TBPN ($100M+), Raised $122B, Shutting down Sora |
| Anthropic | Banned third-party tools (OpenClaw), Claude Code v2.1.92, Source code leak |
| GitHub | Copilot SDK public preview, Data policy change (Apr 24) |
| xAI | Grok 4.1 released (256K context, real-time search) |
| Google | Gemini 3.1 Flash Live (voice-first, import from ChatGPT) |
| Altman | "The Gentle Singularity" essay - AI novel insights by 2026 |

---

## 12. Classification System Changes

### Before (v1.x)
- `AI Agent - 通用型`
- `AI Agent - 代码型`
- `AI Agent - 企业型`

### After (v2.0)
- `AI Agent` (merged single category)

**Rationale**: Simplified taxonomy, all Agent-related items go to one column. Detection still identifies coding agents via keywords ("openclaw", "devin", "coding agent").

### Files Modified for Classification Merge
1. `src/types/ai-industry.ts` - Type definition
2. `src/lib/fetch.ts` - VALID_CLASSIFICATIONS & GROUP_ORDER
3. `scripts/generate-md.ts` - CATEGORY_TITLES mapping
4. `src/lib/intelligence-engine/value-assessor.ts` - Scoring logic
5. `prompts/ai-industry/collect-output-schema.json` - JSON schema

---

## 13. Answered Questions (From Session)

| Question | Answer |
|----------|--------|
| **Data Source** | `first-run-source-log.md` → parsed by `generate-fetch.ts` → JSON. Must be manually updated with SearchWeb results. |
| **Classification** | Based on `主题分类` field in source log. Mapped to standard categories via `normalizeClassification()`. |
| **Value Scoring** | Still calculated by `IntelligenceValueAssessor` but simplified display. Total score (0-100) used for ranking. |
| **OpenClaw** | Third-party tool using Claude API. Anthropic banned subscription usage for such tools Apr 4, 2026. |

---

## 14. Architecture Decisions (Confirmed)

### 2026-04-05 Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Automation Level** | **Full Automation** (Option C) | Zero manual intervention required after initial setup |
| **Source Log Management** | **Date-based Archival** (Option A) | Daily files + 30-day auto-archive |
| **Language** | **Chinese Only** | Target audience preference |
| **Deduplication** | **Automatic** (Option B) | URL + title similarity (75% threshold) |

---

## 15. New Commands (Added 2026-04-05)

```bash
# Show search tasks list
npm run fetch:tasks

# Execute realtime fetch (requires search-results.json)
npm run fetch:realtime

# Full automation workflow
npm run generate:auto    # = fetch:realtime + generate:all
```

---

## 16. Source Log Architecture v2.0

### Directory Structure
```
prompts/ai-industry/source-logs/
├── 2026-04-05.md          # Daily log files
├── 2026-04-06.md
├── latest.md              # Symlink to today's file
└── archive/               # Auto-archived (>30 days)
    └── 2026-03-01.md
```

### Fallback Chain (generate-fetch.ts)
1. `source-logs/latest.md` (preferred)
2. `source-logs/YYYY-MM-DD.md` (today's date)
3. `first-run-source-log.md` (legacy compatibility)
4. Example JSON (fallback)

### Auto-Archive Logic
- Files older than 30 days automatically moved to `archive/`
- Triggered on each `fetch:realtime` execution

---

## 17. Realtime Fetch Workflow

### Step 1: Show Tasks
```bash
npm run fetch:tasks
```
Outputs search queries to execute with SearchWeb.

### Step 2: Execute Searches (Manual with Kimi CLI)
Copy each query to Kimi CLI and run SearchWeb:
```
SearchWeb({ query: "OpenAI news April 2026", limit: 10 })
```

### Step 3: Save Results
Save all results to `outputs/search-results.json`:
```json
[
  {
    "title": "...",
    "url": "...",
    "date": "2026-04-05",
    "summary": "...",
    "source": "TechCrunch",
    "queryId": 1
  }
]
```

### Step 4: Auto-Process
```bash
npm run fetch:realtime
```
Automatically:
- Archives old logs (>30 days)
- Reads `search-results.json`
- Deduplicates (URL + 75% title similarity)
- Auto-classifies by keywords
- Generates `source-logs/YYYY-MM-DD.md`
- Updates `latest.md` symlink

### Step 5: Generate Report
```bash
npm run generate:all
```

---

## 18. Classification Keywords

```typescript
const CATEGORY_KEYWORDS = {
  "AI Agent": ["agent", "openclaw", "devin", "multi-agent", "autonomous"],
  "AI Coding": ["copilot", "cursor", "claude code", "coding assistant", "ide", "github"],
  "头部 AI 企业": ["openai", "anthropic", "google", "meta", "microsoft", "xai", "funding"],
  "AI 领袖人物": ["sam altman", "dario amodei", "sundar pichai", "interview", "ceo"],
  "模型与基础设施": ["model", "gpt", "claude", "gemini", "benchmark", "inference"],
  "开源生态": ["open source", "github", "huggingface", "llama"],
  "政策与监管": ["regulation", "policy", "compliance", "safety"],
};
```

---

## 19. Deduplication Algorithm

```typescript
function deduplicate(results: ParsedResult[]): ParsedResult[] {
  // 1. URL exact match → remove
  // 2. Title similarity > 75% → remove
  // Threshold chosen to catch variations like:
  //   "OpenAI Raises $100M" vs "OpenAI Announces $100M Funding"
}
```

---

## 20. Remaining Open Questions

---

## 21. Future Enhancement Suggestions

### High Priority (Implemented ✓)
1. ✅ **Automated Search Integration**: `scripts/fetch-realtime.ts` created
2. ✅ **Source Log Persistence**: Date-based archival implemented
3. ✅ **Duplicate Detection**: 75% similarity threshold implemented

### Medium Priority (In Progress)
4. **GitHub Actions workflow**: Automated daily execution
5. **Comprehensive README.md**: Document the full workflow
6. **JSON schema validation**: Validate fetch data
7. **Caching**: Cache PDF generation
8. **Retry logic**: Email sending failures

### Low Priority (Backlog)
9. **Multi-language support**: English version
10. **RSS Integration**: Subscribe to official blogs
11. **Slack/Discord Integration**: Team notifications
12. **Historical Trends**: Week-over-week analysis
13. **API Integration**: Direct search API (Bing/Google) instead of manual SearchWeb

---

---

## 22. Testing Results (2026-04-06)

### 自动化流程测试
```bash
$ npm run fetch:realtime
🚀 AI行业情报 - 全自动实时抓取
📅 日期: 2026-04-06

📦 检查旧日志归档...
  无需归档

📥 读取搜索结果...
  读取到 12 条原始结果

🔍 执行去重...
  去重: 移除 1 条重复/相似结果
  保留 11 条唯一结果

📊 分类统计:
  - 头部 AI 企业: 6 条
  - AI Agent: 2 条
  - AI Coding: 3 条

✅ 已生成: prompts/ai-industry/source-logs/2026-04-06.md
✅ 已更新: latest.md
```

### 生成结果验证
| 文件 | 大小 | 状态 |
|------|------|------|
| `source-logs/2026-04-06.md` | 10,588 bytes | ✅ 已生成 |
| `fetch/ai-industry-2026-04-06.json` | 6,356 bytes | ✅ 已生成 |
| `md/ai-industry-2026-04-06.md` | 10,260 bytes | ✅ 已生成 |
| `html/ai-industry-2026-04-06.html` | 64,278 bytes | ✅ 已生成 |
| `pdf/ai-industry-2026-04-06.pdf` | 994,966 bytes | ✅ 已生成 |

---

*This memory file serves as a quick reference for the AI Industry Intelligence System architecture, design decisions, and implementation details.*
