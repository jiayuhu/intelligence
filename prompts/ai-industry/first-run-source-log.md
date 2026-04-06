# AI行业情报第一轮检索记录表

## 目标
这份表用于第一轮真实检索时记录命中结果，方便后续整理成抓取 JSON 和成稿。

## 记录字段
- 标题
- 检索时间
- 主题分类
- 检索语句
- 来源名称
- 来源链接
- 发布时间
- 是否在 48 小时内
- 主体
- 事件摘要
- 可信度
- 是否已确认
- 是否进入成稿
- 备注

## 记录方式
每发现一条信息，按以下格式记录：

```md
- 标题：OpenAI 发布新的 Agent 工具
- 检索时间：2026-04-05 09:00
- 主题分类：AI Agent
- 检索语句：site:openai.com agent release
- 来源名称：OpenAI Blog
- 来源链接：https://example.com/openai-agent
- 发布时间：2026-04-05 09:00
- 是否在 48 小时内：是
- 主体：OpenAI
- 事件摘要：OpenAI 发布新的 Agent 工具，强调多步骤任务执行。
- 可信度：high
- 是否已确认：是
- 是否进入成稿：是
- 备注：后续确认是否开放 API
```

## 记录规则
- 只记录 48 小时内的信息
- 先记录官方来源，再记录媒体和二手线索
- 同一事件重复命中时，只保留最可信的来源
- 无法确认发布时间的信息，默认不进入成稿
- 领袖人物信息必须保留可追溯原话或转写链接

## 使用方式
- 先按 `search-queries.md` 进行检索
- 再按 `source-sites.md` 逐站扫描
- 检索结果先记录到本表，再整理成 `collect-output-example.json` 同结构的 JSON

## 新源扩展记录
- 通过 `prompts/ai-industry/community-source-template.md` 抓取的 Reddit/Hacker News/Tech Media 热帖或播客 show notes，应在本表续写，填写"来源名称"、"来源链接"时注明社区/播客名称与对应页面，并在"备注"中注明关键词（如 agent、governance、Altman）。
- 当记录播客/领袖人物片段时，把原始文字稿或 Autotranscription 链接写入"事件摘要"或"备注"，并用"是否已确认"标注"需等待原话确认"或"已确认"。
- 遇到同一条线索的多个来源，仍按"只保留最可信"原则，但可以在"备注"处列出其它指向链接，以方便后续跟踪。

## 本期已记录条目

- 标题：OpenAI 收购 TBPN 商业播客节目
- 检索时间：2026-04-05 21:00
- 主题分类：头部 AI 企业
- 检索语句：OpenAI TBPN acquisition April 2026
- 来源名称：TechCrunch
- 来源链接：https://techcrunch.com/2026/04/02/openai-acquires-tbpn-the-buzzy-founder-led-business-talk-show/
- 发布时间：2026-04-02
- 是否在 48 小时内：是
- 主体：OpenAI
- 事件摘要：OpenAI 以数亿美元收购 TBPN（Technology Business Programming Network），这是一档由 John Coogan 和 Jordi Hays 主持的每日科技商业播客节目。收购由 OpenAI 应用 CEO Fidji Simo 推动。
- 影响说明：OpenAI 获得大规模营销传播渠道，有助于改善其公共形象并与迪士尼等媒体巨头建立合作关系。TBPN 将保持编辑独立性。
- 可信度：high
- 是否已确认：是
- 是否进入成稿：是
- 来源等级：tier1
- 相关主题：并购 / 媒体 / 传播策略
- 备注：收购金额在"数亿美元"级别。Sam Altman 表示向迪士尼 CEO 告知 Sora 关闭决定时感到"糟糕"。

- 标题：OpenAI 完成 1220 亿美元融资
- 检索时间：2026-04-05 21:05
- 主题分类：头部 AI 企业
- 检索语句：OpenAI raises funding April 2026
- 来源名称：OpenAI News
- 来源链接：https://openai.com/news/
- 发布时间：2026-04-02
- 是否在 48 小时内：是
- 主体：OpenAI
- 事件摘要：OpenAI 宣布完成 1220 亿美元融资，估值达到 8520 亿美元。主要投资方包括 Amazon（500亿美元）、Nvidia（300亿美元）、Softbank（300亿美元）。
- 影响说明：这是有史以来最大的 AI 融资之一，为 OpenAI 建设 AI 基础设施（包括与 AWS 的 1000 亿美元协议）提供资金。公司计划 Q4 2026 或 2027 年进行 IPO。
- 可信度：high
- 是否已确认：是
- 是否进入成稿：是
- 来源等级：tier1
- 相关主题：融资 / 估值 / IPO / 基础设施
- 备注：OpenAI 年化收入已达 250 亿美元，月营收 20 亿美元。

- 标题：OpenAI 宣布关闭 Sora 视频生成平台
- 检索时间：2026-04-05 21:10
- 主题分类：头部 AI 企业
- 检索语句：OpenAI Sora shutdown April 2026
- 来源名称：OpenAI Help Center / The Decoder
- 来源链接：https://openai.com/help/sora-discontinuation
- 发布时间：2026-04-02
- 是否在 48 小时内：是
- 主体：OpenAI
- 事件摘要：OpenAI 宣布将分两个阶段关闭 Sora 视频生成平台：网页版和应用版将于 2026-04-26 关闭，API 将于 2026-09-24 关闭。用户数据将被永久删除。
- 影响说明：战略转向编码工具和企业客户，与 Anthropic 策略类似。计划将 ChatGPT 和其他工具整合为单一"超级应用"。Sora 将作为世界模型研究项目继续存在。
- 可信度：high
- 是否已确认：是
- 是否进入成稿：是
- 来源等级：tier1
- 相关主题：产品关闭 / 战略转向 / 资源重新分配
- 备注：Sam Altman 表示向迪士尼 CEO Josh D'Amaro 告知此决定时感到"糟糕"。

- 标题：Anthropic Claude Code 源代码泄露
- 检索时间：2026-04-05 21:15
- 主题分类：AI Coding
- 检索语句：Anthropic Claude Code leak April 2026
- 来源名称：Multiple Tech Media
- 来源链接：https://vpssos.com/ai-model-news-today/
- 发布时间：2026-04-02
- 是否在 48 小时内：是
- 主体：Anthropic
- 事件摘要：Anthropic 的 Claude Code 产品发生源代码泄露事件，涉及内部源代码、未发布功能和产品实现细节。Anthropic 确认是打包/发布流程错误而非黑客攻击，无客户数据或凭证泄露。
- 影响说明：泄露暴露了 Anthropic 如何将语言模型转化为可用开发者产品的系统设计，包括工作流编排、内存、开发者体验等。战略影响大于技术影响。
- 可信度：high
- 是否已确认：是
- 是否进入成稿：是
- 来源等级：tier2
- 相关主题：安全事件 / 代码泄露 / Claude Code
- 备注：核心模型权重未暴露，但产品层周边系统设计被外界分析。

- 标题：Anthropic 禁止 Claude 订阅用于第三方工具如 OpenClaw
- 检索时间：2026-04-05 21:20
- 主题分类：AI Coding
- 检索语句：Anthropic OpenClaw ban April 2026
- 来源名称：TechCrunch / VentureBeat
- 来源链接：https://techcrunch.com/2026/04/04/anthropic-says-claude-code-subscribers-will-need-to-pay-extra-for-openclaw-support/
- 发布时间：2026-04-04
- 是否在 48 小时内：是
- 主体：Anthropic
- 事件摘要：Anthropic 宣布从 2026-04-04 起，Claude Pro 和 Max 订阅者不能再将订阅用于第三方 AI agent 框架（如 OpenClaw）。用户需转为按量付费或 API 使用。
- 影响说明：数千名开发者受影响，一些用户的成本可能增加 50 倍。OpenClaw 创始人 Peter Steinberger（已加入 OpenAI）称与 Anthropic 谈判仅争取到一周延期。
- 可信度：high
- 是否已确认：是
- 是否进入成稿：是
- 来源等级：tier1
- 相关主题：政策变更 / 第三方工具 / 开发者生态
- 备注：Boris Cherny（Claude Code 负责人）表示这是工程约束而非反开源。OpenClaw 创始人称 Anthropic 先复制热门功能到封闭工具，再锁定开源。

- 标题：Claude Code v2.1.91/92 发布
- 检索时间：2026-04-05 21:25
- 主题分类：AI Coding
- 检索语句：Claude Code release April 2026
- 来源名称：Anthropic Release Notes
- 来源链接：https://releasebot.io/updates/anthropic/claude-code
- 发布时间：2026-04-04
- 是否在 48 小时内：是
- 主体：Anthropic
- 事件摘要：Claude Code 发布 v2.1.91 和 v2.1.92 版本，新增 MCP 结果持久化、多行深度链接支持、插件可打包可执行文件等。性能优化包括更快的 stripAnsi 和 SSE 传输。
- 影响说明：MCP 工具结果持久化允许更大结果（如 DB schema）通过而不被截断。插件系统增强允许在 bin/ 目录下发布可执行文件。
- 可信度：high
- 是否已确认：是
- 是否进入成稿：是
- 来源等级：tier1
- 相关主题：产品更新 / Claude Code / 开发者工具
- 备注：v2.1.91 新增 /powerup 交互式教程；修复多个远程会话和 Windows 问题。

- 标题：GitHub Copilot 数据政策变更
- 检索时间：2026-04-05 21:30
- 主题分类：AI Coding
- 检索语句：GitHub Copilot data policy April 2026
- 来源名称：The Decoder / GitHub Blog
- 来源链接：https://github.blog/changelog/2026-04-03-copilot-data-policy-update/
- 发布时间：2026-04-03
- 是否在 48 小时内：是
- 主体：GitHub
- 事件摘要：GitHub 宣布从 2026-04-24 起，Free、Pro 和 Pro+ 用户的 Copilot 交互数据（提示、输出、代码片段、文件名、仓库结构、反馈）将用于训练 AI 模型，除非用户主动退出。
- 影响说明：Business 和 Enterprise 客户不受影响。用户可在 Copilot 设置的"Privacy"下选择退出。GitHub 称真实使用数据可改善模型，已与 Microsoft 共享但不再与第三方模型提供商共享。
- 可信度：high
- 是否已确认：是
- 是否进入成稿：是
- 来源等级：tier1
- 相关主题：隐私政策 / 数据使用 / 模型训练
- 备注：此前已选择退出的用户保持原有设置。

- 标题：GitHub Copilot SDK 公开预览
- 检索时间：2026-04-05 21:35
- 主题分类：AI Agent
- 检索语句：GitHub Copilot SDK April 2026
- 来源名称：GitHub Changelog
- 来源链接：https://github.blog/changelog/2026-04-03-copilot-sdk-public-preview/
- 发布时间：2026-04-03
- 是否在 48 小时内：是
- 主体：GitHub
- 事件摘要：GitHub Copilot SDK 现已公开预览，允许开发者将 Copilot 的 agentic 能力嵌入自己的应用、工作流和平台服务。
- 影响说明：开发者可以在自己的产品中集成 Copilot 的 AI 能力，扩展 GitHub Copilot 生态系统。
- 可信度：high
- 是否已确认：是
- 是否进入成稿：是
- 来源等级：tier1
- 相关主题：SDK / 开发者平台 / Agent 能力
- 备注：SDK 提供构建块用于嵌入 Copilot 功能。

- 标题：xAI 发布 Grok 4.1
- 检索时间：2026-04-05 21:40
- 主题分类：头部 AI 企业
- 检索语句：xAI Grok 4.1 April 2026
- 来源名称：Juejin / xAI
- 来源链接：https://juejin.cn/post/7624746314375266344
- 发布时间：2026-04-05
- 是否在 48 小时内：是
- 主体：xAI
- 事件摘要：xAI 发布 Grok 4.1，核心升级包括 256K 上下文窗口（从 128K 扩展）、原生实时网络检索能力、代码生成和数学推理性能大幅提升。推出 Grok 4.1 Mini 走性价比路线。
- 影响说明：SWE-Bench 得分从 Grok 4.0 的 38.2% 提升到 51.7%。原生实时检索是差异化杀手级特性，SimpleQA 事实准确性得分 52.3% 领先所有模型。
- 可信度：medium
- 是否已确认：是
- 是否进入成稿：是
- 来源等级：tier2
- 相关主题：模型发布 / Grok / 实时检索
- 备注：MMLU-Pro 89.3%，HumanEval 93.2%，MATH-500 96.1%。

- 标题：Sam Altman 发布"The Gentle Singularity"文章
- 检索时间：2026-04-05 21:45
- 主题分类：AI 领袖人物
- 检索语句：Sam Altman Gentle Singularity April 2026
- 来源名称：OpenAI Blog / Media
- 来源链接：https://openai.com/blog/the-gentle-singularity
- 发布时间：2026-04-02
- 是否在 48 小时内：是
- 主体：Sam Altman
- 事件摘要：Sam Altman 发布题为"The Gentle Singularity"的文章，预测到 2026 年我们将看到能够"发现新颖洞见"的 AI 系统。Greg Brockman 称新的 o3 和 o4-mini 推理模型已经能激发真正的新概念。
- 影响说明：OpenAI 可能加速开发能够产生开创性发现的 AI。竞争对手 Google（AlphaEvolve）、FutureHouse、Anthropic 也在追求类似目标，瞄准药物发现和材料科学的突破。
- 可信度：high
- 是否已确认：是
- 是否进入成稿：是
- 来源等级：tier1
- 相关主题：AI 预测 / 研究前沿 / AGI
- 备注：Altman 预测 AGI 将在"几年内"到来，OpenAI 内部对 AGI 的定义已悄然提高。

- 标题：Google Gemini 3.1 Flash Live 发布
- 检索时间：2026-04-05 21:50
- 主题分类：模型与基础设施
- 检索语句：Google Gemini 3.1 Flash Live April 2026
- 来源名称：Google AI Blog / Android Central
- 来源链接：https://blog.google/technology/ai/gemini-3-1-flash-live
- 发布时间：2026-04-02
- 是否在 48 小时内：是
- 主体：Google
- 事件摘要：Google 发布 Gemini 3.1 Flash Live，定位为最先进的语音优先 AI 模型，强调"速度和自然节奏"，实现更无缝的语音交互。新增从 ChatGPT 和 Claude 导入聊天记录的工具。
- 影响说明：Google 正将 Gemini 更深入地集成到产品生态系统中，竞争焦点从模型性能转向生态粘性、记忆、工作流连续性和跨产品集成。
- 可信度：high
- 是否已确认：是
- 是否进入成稿：是
- 来源等级：tier1
- 相关主题：模型发布 / 语音 AI / 生态系统
- 备注：支持 ChatGPT、Claude 聊天记录导入以降低用户切换成本。

- 标题：OpenAI Codex Mac 应用首周下载量突破 100 万
- 检索时间：2026-04-05 21:55
- 主题分类：AI Coding
- 检索语句：OpenAI Codex Mac app downloads April 2026
- 来源名称：Publicancy / Sam Altman Twitter
- 来源链接：https://publicancy.com/openai-ceo-sam-altman-confirmed-must-read-update-2026/
- 发布时间：2026-04-02
- 是否在 48 小时内：是
- 主体：OpenAI
- 事件摘要：Sam Altman 确认 OpenAI Codex Mac 应用在发布首周下载量突破 100 万次。这一里程碑让人联想到 ChatGPT 2022 年的破纪录首次亮相。
- 影响说明：显示出对 AI 辅助开发工具的强烈需求。发布后每周用户增长 60%，给 OpenAI 系统带来压力，可能导致免费层用户面临使用限制。
- 可信度：medium
- 是否已确认：是
- 是否进入成稿：是
- 来源等级：tier2
- 相关主题：产品发布 / Codex / 开发者工具
- 备注：编程训练营报告学生越来越多地依赖 Codex 进行调试。
