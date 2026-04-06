# AI Industry Intelligence System - Memory

> Last updated: 2026-04-06
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
| **Test Framework** | Vitest (40 tests, all passing) |

---

## 2. Report Structure v3.0 (Current)

Simplified structure with 5 core categories:

```
一、执行摘要（Executive Summary）
   ├── 一句话总览（宏观主题提炼）
   ├── 关键数据（情报数、高价值数、平均分）
   └── 本期最大看点（5条精炼要点）

二、AI Agent（一级章节）
三、AI Coding
四、模型 / 基础设施 / 开源生态
五、政策 / 监管 / 合规
六、社区热点追踪

七、趋势判断
   ├── 核心趋势（2-4个）
   └── 值得关注的信号（2-3个）

八、机会与风险（动态生成）
九、建议动作
十、信息缺口与追踪清单
十一、邮件发送摘要
```

### Removed from v2.0
- ❌ "AI 公司" category (merged into 模型与基础设施)
- ❌ "AI 领袖人物" category (merged into 模型与基础设施)
- ❌ "开源生态" standalone category (merged into 模型与基础设施)
- ❌ "待确认线索" category

---

## 3. Content Specifications

### Simplified Entry Format (v3.0)
```markdown
#### [#排名 | 分数] 标题

事件内容描述（150-250字，已清洗导航文本、代码块等）

时间：YYYY-MM-DD | 来源：来源名称（可信度 | 优先级）
链接：URL
```

### Removed Elements
- ❌ "**事件**：" label
- ❌ "**影响分析**" section
- ❌ Fixed template text ("建议企业从技术实现...")
- ❌ Navigation text ("Skip to main content", "Open menu")
- ❌ Multi-language menus ("Magyar", "Deutsch", etc.)
- ❌ Code blocks (replaced with "[代码]")

### Content Cleaning Pipeline
```typescript
// Pre-filter during fetch
const spamPatterns = [
  /Results for.*关键词/i,
  /官网.*abcde/i,
  /^\s*关键词\s*[{｛]/i,
];

// Clean during markdown generation
const navPatterns = [
  /Skip to main content/gi,
  /Open menu|Open navigation/gi,
  /Magyar|Deutsch|Português|Español|Suomi|Filipino/g,
  /Terms|Privacy|Security|Status|Community|Docs|Contact/g,
];

// Remove code blocks
cleaned = cleaned.replace(/```[\s\S]*?```/g, "[代码]");
```

---

## 4. Classification System (v3.0 - 5 Categories)

### Current Categories
```typescript
type AiIndustryClassification =
  | "AI Agent"
  | "AI Coding"
  | "模型与基础设施"
  | "政策与监管"
  | "社区热点";
```

### Keyword Mapping
```typescript
const CATEGORY_KEYWORDS = {
  "AI Agent": ["agent", "autonomous", "task execution", "workflow", "orchestration", "multi-agent", "openclaw", "devin", "operator", "computer use"],
  "AI Coding": ["copilot", "cursor", "claude code", "coding", "github", "codex", "ide", "programming assistant", "windsurf", "codeium"],
  "模型与基础设施": ["openai", "anthropic", "google", "meta", "microsoft", "xai", "cohere", "mistral", "perplexity", "funding", "acquisition", "valuation", "gpt-4", "gpt-5", "claude 3", "gemini", "llama 4", "model benchmark", "llm", "inference", "gpu", "nvidia", "training", "blackwell", "h200", "infrastructure", "open source", "huggingface", "llama", "mistral", "github repository", "open weights"],
  "政策与监管": ["regulation", "policy", "compliance", "governance", "safety", "ai act", "监管", "政策", "executive order"],
  "社区热点": ["reddit", "hackernews", "ycombinator", "twitter discussion", "x.com", "dev.to", "hashnode", "community discussion", "developer forum"],
};
```

### Priority Order
1. 社区热点 (highest - catches social signals)
2. AI Agent
3. AI Coding
4. 模型与基础设施 (includes merged categories)
5. 政策与监管

---

## 5. Configuration Management

### Single Source of Truth Pattern
All configuration centralized in `titles/ai-industry.ts`:

```typescript
export const aiIndustryTitles = {
  slug: "ai-industry",
  reportTitle: "AI行业情报",
  reportSubtitle: "48小时滚动监测",
  emailSubjectPrefix: "【AI行业情报】",
  emailSubjectBase: "日报",
  pdfTitleBase: "AI行业情报报告",
  promptTitle: "AI行业情报提示词",
  fileBaseName: "ai-industry",
  timeWindowHours: 48,  // Single source for time window
  recipientGroup: "ai-industry",
};

export function getAiIndustryEmailSubject(reportDate: string): string {
  // Format: AI行业情报 | 2026-04-06 | 48小时滚动监测
  return `${aiIndustryTitles.reportTitle} | ${reportDate} | ${aiIndustryTitles.reportSubtitle}`;
}
```

### Benefits
- No hardcoded values scattered in scripts
- Consistent email titles across all outputs
- Easy to change time window (48h → 24h) in one place
- Type-safe with TypeScript

---

## 6. Key Scripts & Commands

```bash
# Generate all artifacts
npm run generate:all

# Individual steps
npm run generate:md       # Generate Markdown
npm run generate:report   # Generate HTML
npm run export:pdf        # Export PDF
npm run render:email      # Generate email preview
npm run send:email        # Send via AgentMail
npm run validate:ai-industry-samples  # Validate examples AND actual output

# Testing
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:ui           # UI mode

# Fetching
npm run fetch:tavily      # Tavily Search API (recommended)
npm run fetch:google      # Google Search API
npm run fetch             # Unified fetch (RSS→Cheerio→Playwright)
```

---

## 7. Email Title Standardization

### Format
```
AI行业情报 | YYYY-MM-DD | 48小时滚动监测
```

### Implementation
All scripts import from single source:
```typescript
import { getAiIndustryEmailSubject } from "../titles/ai-industry.js";

const emailSubject = getAiIndustryEmailSubject(reportDate);
```

### Files Using This Function
- `generate-send-prompt.ts`
- `generate-send-output.ts`
- `send-html-email.ts`
- `send-email.ts`
- `validate-ai-industry-samples.ts`

---

## 8. Validation Strategy

### Enhanced Validation (v3.0)
`validate-ai-industry-samples.ts` now validates:
1. Example files (`collect-output-example.json`, `send-output-example.json`)
2. **Actual output files** (`outputs/fetch/ai-industry-YYYY-MM-DD.json`, `outputs/email/ai-industry-YYYY-MM-DD.json`)

### Validation Checks
- Report title consistency
- Time window hours match configuration
- Email subject matches `getAiIndustryEmailSubject()`
- Classification values are valid enum members
- Highlights count (3-5 items)
- Required fields present

---

## 9. Dynamic Content Generation

### Opportunities & Risks (No Longer Static)
```typescript
function buildOpportunitiesAndRisks(topItems: AssessedItem[]): string[] {
  const highValueItems = topItems.filter(a => a.totalScore >= 80).slice(0, 3);
  
  // Generate from actual data, not hardcoded text
  for (const item of highValueItems) {
    lines.push(`${i + 1}. **${item.title}**：${item.why_it_matters}`);
  }
}
```

### Benefits
- Content reflects actual intelligence
- No outdated references (e.g., "GPT-4.5退役")
- Adaptable to any data set

---

## 10. Removed Files

| File | Reason |
|------|--------|
| `titles/ai-industry.js` | Redundant with .ts version; unified to TypeScript |
| `prompts/ai-industry/first-run-fetch-template.json` | Placeholder, never used |
| `prompts/ai-industry/first-run-fetch-sample-set.json` | Example data, superseded by actual outputs |

---

## 11. TypeScript Migration

### Converted to .ts
- `validate-ai-industry-samples.js` → `.ts`

### Benefits
- Type safety for validation logic
- Can import from `titles/ai-industry.ts` directly
- Unified tooling (tsx for all scripts)

---

## 12. Time Window Configuration

### Template Variables in Prompts
```markdown
## 抓取要求
1. 仅收集 `{{reportDate}}` 之前 **{{timeWindowHours}} 小时**内发布或更新的信息。

## 输出格式
- `time_window_hours`：固定为 `{{timeWindowHours}}`

## 本期概览（{{timeWindowHours}} 小时监测）
```

### Script Usage
```typescript
const timeWindowHours = aiIndustryTitles.timeWindowHours;
// Used in: generate-md.ts, generate-send-output.ts, etc.
```

---

## 13. Data Flow Architecture

### Tavily Search Pipeline
```
Tavily API
    ↓
fetch-tavily.ts
    ├──→ outputs/fetch/ai-industry-YYYY-MM-DD.json (structured data)
    └──→ prompts/ai-industry/source-logs/YYYY-MM-DD.md (human-readable)
                ↓
        generate-md.ts
                ↓
        outputs/md/ai-industry-YYYY-MM-DD.md
                ↓
        generate-send-output.ts
                ↓
        outputs/email/ai-industry-YYYY-MM-DD.json
                ↓
        render:email + send:email
                ↓
        outputs/email/ai-industry-YYYY-MM-DD.eml (sent)
```

---

## 14. Quality Controls

### Content Pre-filtering (During Fetch)
```typescript
const spamPatterns = [
  /Results for["'][^"']*["']/i,
  /关键词[：:]?\s*[{\[][^}\]]+[}\]]/i,
  /官网[：:]?\s*[{\[]?[^}\]]+[}\]]?/i,
  /^\s*image\s*$/i,
  /^\s*\.\w{2,4}\s*$/i,
];
```

### Per-Category Limits
```typescript
// Maximum 10 items per category
const limitedItems = items.slice(0, 10);
```

### Highlights Count
```typescript
// Email highlights: exactly 5 items
.slice(0, 5)
```

---

## 15. Chapter Numbering Fix History

### Problem
Duplicate chapter numbers in draft.md:
- Two "## 九" sections
- Two "## 十一" sections

### Solution
Renumbered to continuous sequence:
```
七、趋势判断
八、机会与风险
九、建议动作
十、信息缺口
十一、邮件发送摘要
```

---

## 16. Testing & Validation Results

### Current Status
```bash
$ npm run lint
✅ TypeScript compilation successful (no errors)

$ npm run validate:ai-industry-samples
=== 校验示例文件 ===
✓ 抓取示例校验通过
✓ 发送示例校验通过

=== 校验实际输出文件 ===
✓ Fetch 输出校验通过
✓ Email 输出校验通过
```

### Output Verification
| Metric | Value |
|--------|-------|
| Total intelligence items | 115 |
| After deduplication | ~55 |
| Per-category limit | 10 |
| High value (80+) | 19 |
| Average score | 73 |
| Email highlights | 5 |

---

## 17. Reusable Patterns

### 1. Single Configuration Source
```typescript
// Centralize all magic values
export const CONFIG = {
  TIME_WINDOW_HOURS: 48,
  MAX_ITEMS_PER_CATEGORY: 10,
  EMAIL_HIGHLIGHTS_COUNT: 5,
} as const;
```

### 2. Dynamic Content Generation
```typescript
// Generate from data, not hardcoded strings
function generateSection(items: Item[]): string[] {
  return items.map(item => formatItem(item));
}
```

### 3. Validation at Multiple Levels
- Schema validation (JSON)
- Type validation (TypeScript)
- Runtime validation (assertions)
- Cross-reference validation (example vs output)

### 4. Template Variable Substitution
```typescript
const prompt = template
  .replace(/{{reportDate}}/g, reportDate)
  .replace(/{{timeWindowHours}}/g, String(timeWindowHours));
```

---

## 18. Questions for Future Development

1. **Category Evolution**: Should "社区热点" be split into separate platforms (Reddit vs HN)?
2. **Time Window**: Is 48h optimal, or should it vary by category?
3. **Scoring Algorithm**: Should value scores be exposed to readers or kept internal?
4. **Multi-language**: Should we generate English summaries for international stakeholders?
5. **API Migration**: When to migrate from Tavily to direct search APIs?

---

## 19. Critical Implementation Notes

### Never Hardcode
- ❌ Email subjects
- ❌ Time windows
- ❌ Category names
- ❌ File naming patterns

### Always Use
- ✅ `titles/ai-industry.ts` for titles/subjects
- ✅ `{{variable}}` substitution in prompts
- ✅ Dynamic generation from data
- ✅ Single source of truth for all constants

### Validate Everything
- ✅ Example files (for documentation correctness)
- ✅ Actual output files (for pipeline integrity)
- ✅ Type consistency across the pipeline

---

*This memory file documents the architecture, design decisions, and implementation patterns of the AI Industry Intelligence System. Keep updated with each significant change.*
