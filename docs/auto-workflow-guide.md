# AI行业情报全自动工作流指南

> 实现你的要求：全自动、按日期归档、中文报告、自动去重

---

## 快速开始

### 一键全自动（推荐）

```bash
# 步骤1: 查看搜索任务
npm run fetch:tasks

# 步骤2: 在 Kimi CLI 中执行搜索（复制搜索词）
# SearchWeb({ query: "OpenAI news April 2026", limit: 10 })
# ... 依次执行其他搜索

# 步骤3: 将结果保存为文件
# 保存到: outputs/search-results.json

# 步骤4: 全自动处理
npm run fetch:realtime

# 步骤5: 生成报告
npm run generate:all

# 步骤6: 发送邮件
npm run send:email
```

或者使用合并命令：

```bash
npm run generate:auto  # 执行 fetch:realtime + generate:all
```

---

## 详细步骤

### 1. 查看搜索任务

```bash
npm run fetch:tasks
```

输出示例：
```
📋 搜索任务清单
============================================================

1. [P0] 头部 AI 企业
   搜索词: OpenAI news April 2026

2. [P0] 头部 AI 企业
   搜索词: Anthropic Claude update April 2026

3. [P0] AI Coding
   搜索词: GitHub Copilot agent April 2026
...
```

### 2. 执行搜索

在 Kimi CLI 中依次执行：

```typescript
// 在 Kimi CLI 交互式环境中执行
await SearchWeb({ query: "OpenAI news April 2026", limit: 10, include_content: true })
await SearchWeb({ query: "Anthropic Claude update April 2026", limit: 10, include_content: true })
await SearchWeb({ query: "GitHub Copilot agent April 2026", limit: 10, include_content: true })
// ... 其他搜索
```

### 3. 保存搜索结果

将搜索结果整理为 JSON 格式：

```json
[
  {
    "title": "OpenAI 收购 TBPN 商业播客",
    "url": "https://techcrunch.com/2026/04/02/openai-acquires-tbpn",
    "date": "2026-04-02",
    "summary": "OpenAI 以数亿美元收购商业播客节目 TBPN，获得营销传播渠道...",
    "source": "TechCrunch",
    "queryId": 1
  },
  {
    "title": "Anthropic 禁止 Claude 用于第三方工具",
    "url": "https://techcrunch.com/2026/04/04/anthropic-openclaw",
    "date": "2026-04-04",
    "summary": "Anthropic 宣布禁止 Claude Pro/Max 订阅用于 OpenClaw 等第三方工具...",
    "source": "TechCrunch",
    "queryId": 2
  }
]
```

保存到：`outputs/search-results.json`

### 4. 全自动处理

```bash
npm run fetch:realtime
```

自动执行：
1. ✅ 归档超过30天的旧日志
2. ✅ 读取 `search-results.json`
3. ✅ **自动去重**（URL + 标题75%相似度）
4. ✅ **自动分类**（关键词匹配）
5. ✅ 生成 `source-logs/YYYY-MM-DD.md`
6. ✅ 更新 `latest.md` 软链接

输出示例：
```
🚀 AI行业情报 - 全自动实时抓取
📅 日期: 2026-04-06

📦 检查旧日志归档...
  无需归档

📥 读取搜索结果...
  读取到 12 条原始结果

🔍 执行去重...
  去重: 移除 2 条重复/相似结果
  保留 10 条唯一结果

📊 分类统计:
  - 头部 AI 企业: 4 条
  - AI Coding: 3 条
  - AI 领袖人物: 2 条
  - 模型与基础设施: 1 条

📝 生成 Source Log...

✅ 已生成: prompts/ai-industry/source-logs/2026-04-06.md
✅ 已更新: latest.md

✨ 完成！下一步:
   npm run generate:all
```

### 5. 生成完整报告

```bash
npm run generate:all
```

生成：
- `outputs/fetch/ai-industry-2026-04-06.json`
- `outputs/md/ai-industry-2026-04-06.md`
- `outputs/html/ai-industry-2026-04-06.html`
- `outputs/pdf/ai-industry-2026-04-06.pdf`
- `outputs/email/ai-industry-2026-04-06.{html,json,eml}`

### 6. 发送邮件

```bash
npm run send:email
```

自动通过 AgentMail 发送。

---

## Source Log 归档结构

```
prompts/ai-industry/source-logs/
├── 2026-04-05.md      # 历史日志（保留）
├── 2026-04-06.md      # 今天的日志
├── latest.md          # → 软链接到 2026-04-06.md
└── archive/           # 超过30天自动归档
    └── 2026-03-01.md
```

---

## 自动分类规则

系统根据关键词自动分类：

| 关键词 | 分类 |
|--------|------|
| agent, openclaw, devin | AI Agent |
| copilot, cursor, claude code, github | AI Coding |
| openai, anthropic, funding, acquisition | 头部 AI 企业 |
| sam altman, dario, interview, ceo | AI 领袖人物 |
| model, gpt, benchmark, inference | 模型与基础设施 |
| open source, huggingface | 开源生态 |
| regulation, policy, compliance | 政策与监管 |

---

## 去重规则

1. **URL 完全匹配** → 去除重复
2. **标题相似度 > 75%** → 去除相似

示例（会被去重）：
```
"OpenAI Raises $122 Billion" 
"OpenAI Announces $122 Billion Funding Round"
# 相似度 ~85% → 保留第一条
```

---

## 可用命令

| 命令 | 功能 |
|------|------|
| `npm run fetch:tasks` | 显示搜索任务清单 |
| `npm run fetch:realtime` | 全自动抓取处理 |
| `npm run generate:auto` | fetch + generate:all |
| `npm run generate:all` | 生成完整报告 |
| `npm run send:email` | 发送邮件 |

---

## 故障排除

### 问题：fetch:realtime 提示找不到 search-results.json

**解决**：
1. 确保已执行 SearchWeb 搜索
2. 将结果保存到 `outputs/search-results.json`
3. 检查 JSON 格式是否正确

### 问题：生成的报告内容为空

**解决**：
1. 检查 `source-logs/latest.md` 是否存在
2. 检查文件中的条目是否包含 `是否进入成稿：是`
3. 检查 `是否在 48 小时内：是`

### 问题：某些分类缺失

**解决**：
- 检查搜索结果的 `queryId` 是否正确
- 检查标题和摘要是否包含分类关键词
- 手动编辑 source log 添加分类

---

## 下一步自动化（可选）

要实现完全无人值守，需要：

1. **接入搜索 API**（Bing/Google）
   ```typescript
   // 替代 SearchWeb 手动搜索
   const results = await bingSearch("OpenAI news");
   ```

2. **GitHub Actions 定时执行**
   ```yaml
   cron: '0 1 * * *'  # 每天 UTC 01:00
   ```

3. **Webhook 通知**
   - 成功/失败推送到 Slack/钉钉

---

*文档版本: 2026-04-06*
*适用系统: AI Industry Intelligence v2.0*
