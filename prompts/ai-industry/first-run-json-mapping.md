# AI行业情报第一轮 JSON 映射说明

## 目标
这份说明用于把 `first-run-source-log.md` 里的人工记录整理成 `collect-output-schema.json` 对应的抓取 JSON。

## 映射规则

| 记录表字段 | 抓取 JSON 字段 | 说明 |
| --- | --- | --- |
| 主题分类 | `groups[].category` | 按主题分组，如 `AI Agent`、`AI Coding` |
| 事件摘要 | `items[].event_summary` | 写成一句话事实描述 |
| 可信度 | `items[].confidence` | 映射为 `high` / `medium` / `low` |
| 是否已确认 | `items[].status` | 映射为 `confirmed` / `tentative` |
| 来源名称 | `items[].source_name` | 保留原始来源名 |
| 来源链接 | `items[].source_url` | 保留原始链接 |
| 发布时间 | `items[].published_at` | 保留原始发布时间 |
| 主体 | `items[].subject` | 保留公司或人物名称 |
| 是否在 48 小时内 | `items[].within_48h` | 统一为布尔值 |
| 备注 | `items[].notes` | 填写补充说明或待确认点 |

## 分组规则
- 一个主题对应一个 `group`
- 同一主题多条记录按重要度从高到低排列
- 同一事件多来源命中时，只保留最可信来源作为主条目
- 无法确认发布时间或来源的记录，不进入正式 JSON

## 字段整理规则
- `summary`：一句话概括该组最重要变化
- `classification`：与主题一致，但允许更细分
- `related_focus`：可写成 `AI Agent / AI 公司` 这类组合
- `source_tier`：按来源优先级映射为 `tier1`、`tier2`、`tier3`
- `notes`：优先记录待确认点，而不是背景介绍

## 样例

```json
{
  "report_title": "AI行业情报",
  "report_date": "2026-04-05",
  "time_window_hours": 48,
  "generated_at": "2026-04-05T09:00:00+08:00",
  "groups": [
    {
      "category": "AI Agent",
      "summary": "本组聚焦 Agent 工具、任务执行和工作流编排能力的更新。",
      "items": [
        {
          "title": "OpenAI 发布新 Agent 工具",
          "published_at": "2026-04-05 09:00",
          "source_name": "OpenAI Blog",
          "source_url": "https://example.com/openai-agent",
          "subject": "OpenAI",
          "classification": "AI Agent",
          "event_summary": "OpenAI 发布新的 Agent 工具，强调多步骤任务执行和工具调用。",
          "why_it_matters": "说明头部企业继续推进 Agent 从演示能力向执行能力演进。",
          "confidence": "high",
          "related_focus": "AI Agent / AI 公司",
          "within_48h": true,
          "status": "confirmed",
          "notes": "后续需确认是否开放 API。",
          "source_tier": "tier1"
        }
      ]
    }
  ]
}
```

## 使用方式
1. 先完成 `first-run-source-log.md`
2. 再按本说明整理成抓取 JSON
3. 然后交给 `draft.md` 生成成稿
