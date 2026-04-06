# AI行业情报日常发送记录

## 适用场景
这是一页给日常重发和复核用的记录，不替代完整运行手册。默认场景是：当天情报已生成，需要再次确认并通过 AgentMail 或 SMTP 发出。

## 已验证顺序
1. `npm run generate:md`
2. `npm run generate:send-output`
3. `npm run generate:report`
4. `npm run export:pdf`
5. `npm run render:email`
6. `npm run send:email`

## 当前约定
- 文件名固定为 `ai-industry-YYYY-MM-DD.(md|html|pdf)`
- 邮件主题固定为 `【AI行业情报】日报 · YYYY-MM-DD`
- 邮件正文使用 HTML
- PDF 作为附件发送
- 优先走 AgentMail；没有 AgentMail 再走 SMTP；都没有则只生成邮件包
- `outputs/email/` 中应同时保留发送 JSON、邮件 HTML 预览和 `.eml`

## 日常发送前检查
- `.env.local` 已配置收件人和发件通道
- 当期 PDF 存在且可读
- `generate:send-output` 与 `render:email` 已重新生成
- 邮件标题与报告日期一致
- 邮件正文里明确写的是 PDF 附件，不再引用 HTML 报告路径

## 发送后检查
- `.eml` 已生成
- AgentMail 或 SMTP 返回成功
- 收件人地址正确
- PDF 附件可正常打开

## 出问题时优先看
- `prompts/ai-industry/first-run-runbook.md`
- `prompts/ai-industry/daily-send-card.md`
- `outputs/email/ai-industry-YYYY-MM-DD.json`
- `outputs/email/ai-industry-YYYY-MM-DD.html`
