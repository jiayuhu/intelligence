# AI行业情报配置清单

## 目标
`AI行业情报` 是仓库里的标准情报类型之一，所有标题、文件名和时间窗口规则都必须固定，不允许在脚本里临时拼接。

## 字段表

| 字段 | 当前值 | 用途 | 是否建议修改 |
| --- | --- | --- | --- |
| `slug` | `ai-industry` | 目录与脚本使用的短标识 | 否 |
| `reportTitle` | `AI行业情报` | 报告封面标题 | 否 |
| `reportSubtitle` | `48小时滚动监测` | 封面副标题，提示时间属性 | 视情况 |
| `emailSubjectPrefix` | `【AI行业情报】` | 邮件主题前缀 | 否 |
| `emailSubjectBase` | `日报` | 邮件主题主体，需与报告日期拼接 | 否 |
| `pdfTitleBase` | `AI行业情报报告` | PDF 导出标题主体，需与报告日期拼接 | 否 |
| `promptTitle` | `AI行业情报提示词` | 提示词标题 | 否 |
| `fileBaseName` | `ai-industry` | 文件基名 | 否 |
| `timeWindowHours` | `48` | 信息源时间窗口 | 否 |
| `recipientGroup` | `ai-industry` | 邮件收件组标识 | 视情况 |

## 开发速查
- 报告标题：`AI行业情报`
- 邮件主题：`【AI行业情报】日报 · YYYY-MM-DD`
- 文件基名：`ai-industry`
- 时间窗口：`48` 小时
- 目录标识：`ai-industry`
- 收件组：`ai-industry`
- PDF 标题：`AI行业情报报告 · YYYY-MM-DD`

## 示例
- 邮件主题：`【AI行业情报】日报 · YYYY-MM-DD`
- Markdown 文件名：`ai-industry-2026-04-05.md`
- HTML 文件名：`ai-industry-2026-04-05.html`
- PDF 标题：`AI行业情报报告 · 2026-04-05`
- PDF 文件名：`ai-industry-2026-04-05.pdf`

## 使用位置
- `prompts/ai-industry/*.md`：提示词模板
- `scripts/generate-prompt.ts`：生成提示词文件
- `scripts/generate-md.ts`：生成 Markdown 成稿
- `scripts/generate-send-output.ts`：根据成稿生成邮件正文 JSON
- `scripts/generate-report.ts`：生成 HTML 报告
- `scripts/send-html-email.ts`：生成邮件 HTML 预览
- `scripts/send-email.ts`：封装正式邮件包
- `scripts/export-pdf.ts`：导出 PDF

## 文件命名
统一使用：
- `ai-industry-YYYY-MM-DD.md`
- `ai-industry-YYYY-MM-DD.html`
- `ai-industry-YYYY-MM-DD.pdf`

## 维护规则
- 新增字段先写进本文件，再写进 `titles/ai-industry.ts`
- 字段修改后，必须同步检查提示词、模板和脚本引用
- 若新增其他情报类型，优先复用同样的结构
