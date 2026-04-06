# AI行业情报每日发送卡

## 目标
把当天的 `AI行业情报` 通过 AgentMail 或 SMTP 正式发出，正文使用 HTML，附件使用 PDF。

## 开始前
- 确认 `.env.local` 已配置
- 优先检查 `AI_INDUSTRY_AGENTMAIL_API_KEY`
- 收件人写入 `AI_INDUSTRY_EMAIL_TO`
- 发件人写入 `AI_INDUSTRY_EMAIL_FROM`

## 执行顺序
1. `npm run generate:md`
2. `npm run generate:send-output`
3. `npm run generate:report`
4. `npm run export:pdf`
5. `npm run render:email`
6. `npm run send:email`

## 发送规则
- AgentMail 优先
- 没有 AgentMail 再走 SMTP
- 没有任何发送配置时，只生成邮件包
- 邮件正文必须是 HTML
- PDF 必须作为附件发送

## 成功标准
- `.eml` 已生成
- `outputs/email/` 中有 HTML 预览和发送 JSON
- `outputs/pdf/` 中有当期 PDF
- AgentMail 或 SMTP 返回成功

## 复核记录
- 日常发送后的结果和可复用检查点，优先记录到 [`daily-send-log.md`](./daily-send-log.md)

## 失败检查
- PDF 是否存在且可读
- 收件人是否正确
- AgentMail inbox 是否和发件地址一致
- `email_subject` 是否和固定标题一致
