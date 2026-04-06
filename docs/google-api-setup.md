# Google Search API 配置指南

> 实现真正的全自动情报抓取，无需手动执行 SearchWeb

---

## 快速开始

### 1. 获取 Google API Key

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 **Custom Search API**:
   - 进入 "APIs & Services" → "Library"
   - 搜索 "Custom Search API"
   - 点击 "Enable"
4. 创建 API Key:
   - 进入 "APIs & Services" → "Credentials"
   - 点击 "Create Credentials" → "API Key"
   - 复制生成的 API Key

### 2. 创建 Custom Search Engine

1. 访问 [Programmable Search Engine](https://cse.google.com/cse/)
2. 点击 "Create a search engine"
3. 配置：
   - **Name**: AI News Search (或任意名称)
   - **Sites to search**: 留空（搜索整个网络）
   - **Language**: 不限
4. 点击 "Create"
5. 进入 CSE 控制面板，复制 **Search Engine ID** (cx 参数)

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，添加：
GOOGLE_SEARCH_API_KEY=your_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

### 4. 运行全自动抓取

```bash
# 使用 Google API 全自动抓取
npm run fetch:google

# 或者一键完成抓取+生成报告
npm run generate:auto:google
```

---

## API 限制与配额

| 配额项 | 免费额度 | 付费额度 |
|--------|----------|----------|
| 每日查询次数 | 100 次/天 | 10,000 次/天 |
| 每秒查询次数 | 1 次/秒 | 10 次/秒 |

**我们的使用**: 8 个搜索任务，每天运行1次 = 8 次查询/天

完全在免费额度内！

---

## 两种自动化方案对比

| 方案 | 命令 | 需要手动 | 适用场景 |
|------|------|----------|----------|
| **半自动** | `npm run fetch:realtime` | 执行 SearchWeb 搜索 | 免费、灵活、人工筛选 |
| **全自动** | `npm run fetch:google` | 无需任何操作 | 定时任务、无人值守 |

---

## 常见问题

### Q: Google Search API 返回结果与 SearchWeb 不同？

**A**: 正常。Google 和 SearchWeb 使用不同的搜索算法和索引。建议：
- 初期对比两种方案的结果质量
- 选择更适合你需求的方案

### Q: 如何提高搜索结果的相关性？

**A**: 在 `scripts/fetch-google-api.ts` 中修改搜索配置：

```typescript
const SEARCH_TASKS = [
  { 
    id: 1, 
    query: "site:openai.com OR site:anthropic.com news", // 限定域名
    priority: "P0", 
    category: "AI 公司",
    company: "OpenAI" 
  },
  // ...
];
```

### Q: 免费额度用完了怎么办？

**A**: 
1. 等待第二天配额重置
2. 切换到 `npm run fetch:realtime` (半自动方案)
3. 或启用付费计划 ($5/1000次查询)

---

## GitHub Actions 定时自动化

创建 `.github/workflows/daily-intel.yml`:

```yaml
name: Daily AI Intelligence

on:
  schedule:
    - cron: '0 1 * * *'  # 每天 UTC 01:00 (北京时间 09:00)
  workflow_dispatch:  # 支持手动触发

jobs:
  fetch-and-send:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Fetch intelligence (Google API)
        env:
          GOOGLE_SEARCH_API_KEY: ${{ secrets.GOOGLE_SEARCH_API_KEY }}
          GOOGLE_SEARCH_ENGINE_ID: ${{ secrets.GOOGLE_SEARCH_ENGINE_ID }}
        run: npm run fetch:google
        
      - name: Generate report
        run: npm run generate:all
        
      - name: Send email
        env:
          AI_INDUSTRY_AGENTMAIL_API_KEY: ${{ secrets.AGENTMAIL_API_KEY }}
          AI_INDUSTRY_AGENTMAIL_INBOX_ID: ${{ secrets.AGENTMAIL_INBOX_ID }}
          AI_INDUSTRY_EMAIL_TO: ${{ secrets.EMAIL_TO }}
        run: npm run send:email
        
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: intelligence-report-${{ github.run_date }}
          path: |
            outputs/md/*.md
            outputs/pdf/*.pdf
```

然后在 GitHub 仓库设置中添加 Secrets：
- `GOOGLE_SEARCH_API_KEY`
- `GOOGLE_SEARCH_ENGINE_ID`
- `AGENTMAIL_API_KEY`
- `AGENTMAIL_INBOX_ID`
- `EMAIL_TO`

---

## 测试验证

运行以下命令验证配置是否正确：

```bash
# 检查环境变量
echo $GOOGLE_SEARCH_API_KEY
echo $GOOGLE_SEARCH_ENGINE_ID

# 测试 API 调用
npm run fetch:google
```

如果看到类似输出，说明配置成功：
```
🚀 AI行业情报 - Google Search API 全自动抓取
📅 日期: 2026-04-06

📦 检查旧日志归档...
  无需归档

🔍 开始 Google Search API 搜索...
  [P0] OpenAI news
  [P0] Anthropic Claude update
  ...

✅ 已生成: prompts/ai-industry/source-logs/2026-04-06.md
✅ 已更新: latest.md
```

---

*文档版本: 2026-04-06*
