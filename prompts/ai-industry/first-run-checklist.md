# AI行业情报首次生成清单

## 目标
这份清单用于第一份真实 `AI行业情报` 的执行顺序，方便从抓取一路跑到发送。

## 执行顺序
1. **自动化抓取**（推荐 - 替代手工检索）
   - **首选**: `npm run fetch:tavily` - Tavily AI 搜索全自动抓取
   - **备选**: `npm run fetch:google` - Google API 全自动抓取
   - 自动生成 source log 到 `source-logs/YYYY-MM-DD.md`
   - 无需手动浏览 sources.md，自动化工具已覆盖 P0/P1 来源

2. 如需手动补充检索
   - 先看 `keywords.md`
   - 再看 `search-queries.md`
   - 再看 `source-sites.md`
   - 最后按 `sources.md` 的优先级筛选
   - **扩展来源**：查看 `extended-sources.md` 和 `extended-source-checklist.md`
3. 生成抓取结果
   - 按 `collect.md` 产出合法 JSON（自动化抓取已直接生成 source log）
   - 严格限制在 48 小时内
   - 结果必须尽量对应 `report-outline.md`
4. 生成成稿
   - 按 `draft.md` 将抓取 JSON 变成 Markdown 成稿
   - 章节顺序必须与 `report-outline.md` 一致
5. 生成发送 JSON
   - 按 `send.md` 将成稿摘要为邮件正文 JSON
   - 输出必须符合 `send-output-schema.json`
6. 生成 HTML 报告
   - 用 `generate:report` 产出 HTML 文件
7. 导出 PDF
   - 用 `export:pdf` 产出 PDF 文件
8. 生成邮件预览
   - 用 `render:email` 产出邮件 HTML 预览
9. 生成正式邮件包
   - 用 `send:email` 产出 `.eml`
   - 如配置了 SMTP，可直接发送

## 第一份真实情报的检查点
- 抓取结果是否全部在 48 小时内
- `AI Agent` 和 `AI Coding` 是否都被覆盖
- AI 公司和 AI 领袖人物是否优先于泛行业内容（同时关注创新型公司）
- 成稿章节是否完整但不过度扩写
- 邮件摘要是否足够短，且能直接放入 HTML 邮件

## 扩展来源检查点（新增）
- 是否已查看 `extended-sources.md` 中的来源清单
- 是否已参考 `extended-source-checklist.md` 的接入检查
- **P0 扩展来源**（xAI, Cursor）是否已扫描
- **Agent 基础设施**（LangChain, LlamaIndex 等）是否已扫描
- **新兴企业**（Cohere, Mistral, Perplexity 等）是否已扫描
- **技术领袖扩展**（Karpathy, LeCun 等）是否已扫描（可选）
- 扩展来源信息是否标注 `source_tier: P1/P2`
- 扩展来源与原有来源冲突时，是否正确降级

## 社交媒体检查点（新增）
- 是否已查看 `social-media-sources.md` 账号清单
- **X 官方账号**（@OpenAI, @AnthropicAI, @cursor_ai）是否已检查
- **X 核心领袖**（@sama, @karpathy, @ylecun）是否已检查
- **LinkedIn 企业页**（OpenAI, Anthropic, Microsoft）是否已检查
- 社交媒体信息是否标注 `source_platform: x/linkedin`
- 社交媒体信息是否与官方来源交叉验证
- 领袖个人观点是否标注"个人观点，不代表公司立场"
- 未确认账号信息是否标记为"待确认"

## 建议的命令顺序

### 全自动流程（推荐）
```bash
# 一键全自动 - Tavily 搜索 + 生成 + 发送
npm run generate:auto:tavily

# 或 Google API 版本
npm run generate:auto:google
```

### 分步手动流程
```bash
# 1. 生成提示词
npm run generate:prompt
npm run generate:send-prompt

# 2. 抓取情报（推荐 Tavily）
npm run fetch:tavily
# 备选: npm run fetch:google

# 3. 生成成稿
npm run generate:md
npm run generate:send-output

# 4. 生成报告
npm run generate:report
npm run export:pdf

# 5. 发送邮件
npm run render:email
npm run send:email
```
