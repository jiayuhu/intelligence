# AI行业情报第一轮运行手册

## 目的
这是一份第一轮真实 `AI行业情报` 的执行总手册，用于把准备、抓取、成稿、发送和交付收口到一条可执行路径。

## 开工前先看
1. `first-run-index.md`
2. `first-run-checklist.md`
3. `execution-cards.md`
4. `topic-matrix.md`
5. `keywords.md`
6. `search-queries.md`
7. `source-sites.md`
8. `sources.md`

## 执行顺序
1. 准备检索范围
   - 先按 `keywords.md` 锁定关键词
   - 再按 `search-queries.md` 形成可执行搜索语句
   - 再按 `source-sites.md` 和 `sources.md` 定位来源
2. 整理抓取记录
   - 使用 `first-run-source-log.md` 记录命中内容
   - 对照 `first-run-json-mapping.md` 转成抓取 JSON
   - 抓取结果必须符合 `collect-output-schema.json`
3. 生成情报成稿
   - 以 `report-outline.md` 为唯一骨架
   - 按 `draft.md` 将抓取 JSON 写成 Markdown
   - 保持章节顺序，不新增标题
4. 生成发送摘要
   - 按 `send.md` 将成稿提炼为邮件正文 JSON
   - 结果必须符合 `send-output-schema.json`
5. 生成成品文件
   - `generate:report` 产出 HTML 报告
   - `export:pdf` 产出 PDF
   - `render:email` 产出邮件 HTML 预览
   - `send:email` 产出 `.eml` 并通过 AgentMail 或 SMTP 发送

## 关键约束
- 所有信息源必须落在报告生成时间前 48 小时内
- `AI Agent` 和 `AI Coding` 是长期关注重点
- 头部 AI 企业和 AI 领袖人物优先于尾部信息
- 无法确认时间或来源的信息必须标注为“待确认”
- HTML 必须兼容 Web、Outlook、阿里邮箱和网易邮箱
- 发送前先确认 `.env.local` 已写入正确的 AgentMail API Key、Inbox、收件人和发件人；若不使用 AgentMail，再补 SMTP 配置

## 最终交付
第一轮结束时，至少应产出：
- 抓取 JSON
- Markdown 成稿
- 发送 JSON
- HTML 报告
- PDF 文件
- 邮件 HTML 预览
- `.eml` 邮件包
- 已通过 AgentMail 或 SMTP 完成实际发送

## 失败判定
以下任一情况都算未完成：
- 抓取结果超出 48 小时窗口
- `AI Agent` 或 `AI Coding` 未覆盖
- 成稿章节与 `report-outline.md` 不一致
- 邮件摘要过长，无法直接放入 HTML 邮件正文
- 输出文件名不符合 `ai-industry-YYYY-MM-DD.(md|html|pdf)` 规则
