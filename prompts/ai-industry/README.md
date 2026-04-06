# AI行业情报提示词

这里存放 `AI行业情报` 的三阶段提示词：
- `collect.md`：信息抓取
- `collect-output-schema.json`：抓取结果 JSON 结构
- `collect-output-example.json`：抓取结果 JSON 示例
- `sources.md`：来源优先级清单与扫描顺序
- `keywords.md`：第一期抓取关键词表
- `search-queries.md`：第一批可执行搜索语句
- `source-sites.md`：第一批具体站点和页面清单
- `report-outline.md`：第一份成稿章节提纲
- `report-sample.md`：第一份成稿样例
- `email-summary-sample.md`：第一份邮件摘要样例
- `first-run-checklist.md`：第一份真实情报执行清单
- `first-run-source-log.md`：第一轮真实检索记录表
- `topic-matrix.md`：第一轮执行主题矩阵
- `execution-cards.md`：第一轮执行卡片
- `first-run-delivery-checklist.md`：第一轮最终交付清单
- `first-run-index.md`：第一轮总入口页
- `first-run-runbook.md`：第一轮运行手册
- `daily-send-log.md`：日常发送记录，记录已跑通的发送顺序与检查点
- `first-run-json-mapping.md`：第一轮检索记录到抓取 JSON 的映射说明
- `first-run-fetch-template.json`：第一轮抓取结果模板
- `first-run-fetch-sample-set.json`：第一轮抓取结果示例集
- `draft.md`：情报成稿
- `send-output-schema.json`：发送阶段输出 JSON 结构
- `send-output-example.json`：发送阶段输出 JSON 示例
- `send.md`：消费成稿 Markdown 的情报发送
- `base.md`：公共约束

所有模板都以中文编写，默认适用于报告生成时间前 48 小时内的信息。
`draft.md` 默认消费 `collect.md` 产出的 JSON 抓取结果，并生成 Markdown 成稿。
`draft.md` 输出遵循固定章节结构，覆盖摘要、核心动态、趋势判断、机会与风险、建议动作、信息缺口和邮件发送摘要，并对每章写法做了固定要求。
`send.md` 默认消费成稿 Markdown，并输出适合 HTML 邮件正文的 JSON 结构，供发送层渲染为简短摘要。
`send-output-schema.json` 与 `send-output-example.json` 分别定义和示例化邮件正文 JSON，便于脚本直接渲染为 HTML 预览。
发送提示词可通过 `generate:send-prompt` 生成到 `outputs/prompts/`，便于在正式发送前复核标题与摘要。
发送 JSON 可通过 `generate:send-output` 生成到 `outputs/email/`，随后由 `render:email` 直接渲染为预览 HTML。
正式邮件包可通过 `send:email` 生成到 `outputs/email/`，后续可直接交给 AgentMail、SMTP、企业邮箱网关或人工发送工具；`send:email` 会自动读取仓库根目录的 `.env` 或 `.env.local`，建议先复制 [.env.example](../../.env.example) 再填写发送配置。若配置了 `AI_INDUSTRY_AGENTMAIL_API_KEY` 和 `AI_INDUSTRY_AGENTMAIL_INBOX_ID`，脚本会优先走 AgentMail API。
`report-sample.md`、`email-summary-sample.md` 和两个 `*-example.json` 文件可以作为第一期抓取与成稿对照样例。
`first-run-checklist.md` 可作为第一份真实情报的执行顺序清单。
`first-run-source-log.md` 可作为第一轮检索的人工记录模板。
`topic-matrix.md` 可作为第一轮执行时按主题扫来源的速查表。
`execution-cards.md` 可作为第一轮开工时逐条执行的卡片清单。
`first-run-delivery-checklist.md` 可作为第一份真实情报交付前的最终核对清单。
`daily-send-card.md` 可作为日常发信卡，专门覆盖 AgentMail 或 SMTP 的实际发送步骤。
`first-run-index.md` 可作为第一轮的总入口页，先读这一页再展开其它材料。
`first-run-runbook.md` 可作为第一轮的单页运行手册，开工时优先查看。
`daily-send-log.md` 可作为日常发送记录，用来复核已跑通的发送顺序、检查点和输出文件。
`first-run-json-mapping.md` 可作为第一轮人工记录整理成抓取 JSON 的转换说明。
`first-run-fetch-template.json` 可作为第一轮实际抓取结果的 JSON 填写模板。
`first-run-fetch-sample-set.json` 可作为第一轮完整抓取结果的示例参考。
`community-source-template.md` 提供社区/科技媒体采集模版，按 Reddit/Hacker News/Tech Media 分组填入采集时间、标题、摘要、topic 关键词与 `source_tier`，并为播客/领袖人物额外记录 show notes/摘要；填完后把关键链接同步写入 `first-run-source-log.md` 并标注来源等级。
`daily-collection-card.md` 是执行该流程的每日卡片，按卡完成采集→记录→链接归档→成稿准备，再运行 `generate:all`。
`validate:ai-industry-samples` 可用于校验抓取示例、首轮样例和发送示例是否符合固定结构与标题约定，当前实现为纯 Node 脚本，不依赖 `tsx`。
`generate:all` 会在生成提示词、Markdown、HTML、发送 JSON 和邮件预览后，自动执行样例校验，再生成正式邮件包。
