# 模板目录

这里存放 HTML 报告模板、邮件正文模板和 PDF 渲染模板。模板文本优先使用中文，变量名保持稳定。

HTML 模板默认按 Web、Outlook、阿里邮箱、网易邮箱的兼容性要求编写，优先使用表格布局、内联样式和保守 CSS，避免依赖脚本、外链资源和复杂布局。

更细的约束见 [`html-compatibility.md`](./html-compatibility.md)。

标准模板母版见 [`html-base.html`](./html-base.html)，新增报告页或邮件页时优先复用该结构。
`html-base.html` 同时内置了适合 Chromium 打印 PDF 的 `@page` 和 `print` 样式，便于 `export:pdf` 直接复用同一份 HTML。
当前仓库的 `export:pdf` 使用 Playwright 打印 HTML 报告生成 PDF，因此这份打印样式会直接参与最终 PDF 输出。
PDF 文字通过 Playwright 可访问的本地 `@fontsource/noto-sans-sc` 字体资源嵌入，避免中文出现空白或方块字。
报告页的 Markdown 成品会先被脚本渲染成结构化 HTML，再交给 `html-base.html` 母版输出，因此最终 HTML 和 PDF 都会比纯文本排版更有层次。

报告和邮件内容块建议拆分为片段文件，例如 `report-header.html`、`report-body.html`、`email-header.html`、`email-body.html`，由脚本统一拼装。

邮件发送脚本优先生成 `outputs/email/` 下的邮件 HTML 预览文件，便于在正式发送前核对客户端兼容性。
`email-body.html` 默认接收 `opening`、`highlightsHtml`、`closing`、`pdfAttachmentName` 和 `timeWindowHours` 等变量，其中 `highlightsHtml` 由发送阶段 JSON 渲染而来，便于在不同客户端保持一致排版。
正式邮件包由 `send:email` 生成，默认落到 `outputs/email/`，与 HTML 预览、发送 JSON 放在同一目录下便于核对；该邮件包同时包含 HTML 正文和当期 PDF 附件。
如果仓库根目录的 `.env` 或 `.env.local` 中配置了 AgentMail API，`send:email` 会优先通过 AgentMail 实发；否则若配置了 SMTP 环境变量，则走 SMTP；否则只生成邮件包。建议先复制 [.env.example](../.env.example) 再填写真实值。
