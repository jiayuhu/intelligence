# AI行业情报第一轮交付清单

## 目标
这份清单用于第一份真实 `AI行业情报` 的最终交付核对，确认从抓取到发送都已经闭环。

## 交付顺序
1. 完成抓取记录
   - `first-run-source-log.md` 中的内容已整理完毕
   - 结果已转换为符合 `collect-output-schema.json` 的 JSON
2. 完成成稿
   - 生成 Markdown 成稿
   - 章节顺序与 `report-outline.md` 一致
3. 完成发送摘要
   - 生成符合 `send-output-schema.json` 的邮件正文 JSON
4. 完成 HTML
   - 生成 HTML 报告
   - 生成邮件 HTML 预览
5. 完成 PDF
   - 生成 PDF 成品
6. 完成邮件包
   - 生成 `.eml`
   - 若配置 SMTP，完成实际发送

## 命令顺序
- `npm run generate:prompt`
- `npm run generate:send-prompt`
- `npm run generate:md`
- `npm run generate:send-output`
- `npm run generate:report`
- `npm run export:pdf`
- `npm run render:email`
- `npm run send:email`

## 交付文件
- `outputs/prompts/ai-industry-YYYY-MM-DD.md`
- `outputs/md/ai-industry-YYYY-MM-DD.md`
- `outputs/email/ai-industry-YYYY-MM-DD.json`
- `outputs/html/ai-industry-YYYY-MM-DD.html`
- `outputs/pdf/ai-industry-YYYY-MM-DD.pdf`
- `outputs/email/ai-industry-YYYY-MM-DD.html`
- `outputs/email/ai-industry-YYYY-MM-DD.eml`

## 最终检查
- 48 小时窗口是否严格满足
- `AI Agent` 和 `AI Coding` 是否在核心位置
- AI 公司和 AI 领袖人物是否优先于泛行业信息（同时关注创新型公司）
- 邮件摘要是否足够短，且可直接放入 HTML 邮件正文
- 所有不确定项是否明确标注为“待确认”
- 输出文件名是否都符合 `ai-industry-YYYY-MM-DD.(md|html|pdf)` 规则
