# 日常采集卡

使用 `community-source-template.md` 按组记录来自 Reddit/Hacker News/Tech Media/播客的热帖或 show notes，并同步把命中链接填入 `first-run-source-log.md` 与 `source-sites.md`（“社区与科技综合源”区域）。每次采集流程：

1. 打开 `community-source-template.md`，按组逐条填写：
   - 采集时间、标题、摘要：控制在 40-60 字，突出 agent/coding/governance/leader 关键词；
   - 关联主题与关键词：如 agent、governance、Altman、model routing；
   - 来源等级：P0/P1/P2/P3；
   - 播客则记录 show notes 链接，并在 “备注” 加入 speaker + timestamp。

2. 把该条链接与简要字段复制到 `first-run-source-log.md`：
   - 记录 “来源名称” 及 “链接”；
   - 给予 “主题分类” 和 “事件摘要”；
   - 如果来自播客，备注 show notes 或字幕的 URL；
   - 在 “source_tier” 引用列填写 P2/P3，保持可追溯。

3. 在 `source-sites.md` 的“社区与科技综合源”或“领军人物 & 技术大牛渠道”中追加该链接（附 `source_tier`），确保下轮采集时不重复。

4. 若采集到特别有价值的信号，可直接在 Markdown 报告 `outputs/md/ai-industry-2026-04-05.md` 的对应部分做 placeholder，方便后续成稿时引入。

5. 采集结束后，运行 `generate:report` 之前再查一遍 `first-run-source-log.md` 确认每个高价值源都被整理进 JSON/成稿流程。

This card ensures the “community → log → source list → report” loop stays tight; repeat daily before running `generate:all`.
