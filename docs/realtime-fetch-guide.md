# 实时情报获取指南

> 如何解决 "重新抓取情报，但是内容没有更新" 的问题

---

## 问题诊断

### 现象
- 运行 `npm run generate:all` 生成的报告内容不变
- 情报数量只有 5-8 条，远低于预期
- 缺少最新的行业动态

### 根本原因
```
┌─────────────────────────────────────────────┐
│  generate:fetch 脚本                        │
│  └─ 读取 prompts/ai-industry/first-run-source-log.md  │
│     └─ 静态文件，仅包含示例数据（8条）        │
│        └─ 生成的情报永远基于这8条静态数据      │
└─────────────────────────────────────────────┘
```

**系统不是自动抓取，而是从静态日志读取。**

`first-run-source-log.md` 原本是手工记录的检索日志模板，不是实时数据源。

---

## 解决方案：实时搜索

### 步骤 1: 使用 SearchWeb 搜索最新情报

```bash
# 使用 Kimi CLI 的 SearchWeb 功能
# 搜索各大 AI 公司的最新动态
```

推荐搜索查询：

| 公司/主题 | 搜索语句 | 优先级 |
|-----------|----------|--------|
| OpenAI | `OpenAI news April 2026` | P0 |
| Anthropic | `Anthropic Claude update April 2026` | P0 |
| GitHub | `GitHub Copilot agent April 2026` | P0 |
| Google AI | `Google Gemini AI update April 2026` | P0 |
| xAI | `xAI Grok update April 2026` | P1 |
| Meta AI | `Meta AI update April 2026` | P1 |
| 行业综述 | `AI industry news April 2026` | P2 |

### 步骤 2: 更新 Source Log

将搜索结果整理成标准格式，追加到 `first-run-source-log.md`：

```markdown
- 标题：[新闻标题]
- 检索时间：2026-04-05 21:00
- 主题分类：[AI Agent / AI Coding / AI 公司 / AI 领袖人物 / 模型与基础设施]
- 检索语句：[使用的搜索词]
- 来源名称：[官方来源/媒体名称]
- 来源链接：[URL]
- 发布时间：[YYYY-MM-DD]
- 是否在 48 小时内：是
- 主体：[公司/人物名称]
- 事件摘要：[发生了什么]
- 影响说明：[为什么重要]
- 可信度：high/medium/low
- 是否已确认：是
- 是否进入成稿：是
- 来源等级：tier1/tier2/tier3
- 相关主题：[关键词1 / 关键词2 / 关键词3]
- 备注：[补充信息]
```

### 步骤 3: 重新生成报告

```bash
npm run generate:all
```

---

## 完整工作流程

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 实时搜索 (SearchWeb)                                      │
│    ├─ 搜索 OpenAI/Anthropic/GitHub/Google/xAI 等           │
│    └─ 获取 48 小时内的高可信度新闻                          │
├─────────────────────────────────────────────────────────────┤
│ 2. 更新 Source Log                                           │
│    ├─ 编辑 prompts/ai-industry/first-run-source-log.md      │
│    └─ 按标准格式追加新条目                                   │
├─────────────────────────────────────────────────────────────┤
│ 3. 生成抓取结果 (generate:fetch)                             │
│    └─ 读取 source log → 生成 outputs/fetch/*.json           │
├─────────────────────────────────────────────────────────────┤
│ 4. 生成报告 (generate:md)                                    │
│    └─ 价值评估 → 排序 → Markdown                            │
├─────────────────────────────────────────────────────────────┤
│ 5. 导出格式 (generate:report / export:pdf)                  │
│    └─ HTML → PDF                                            │
├─────────────────────────────────────────────────────────────┤
│ 6. 发送邮件 (send:email)                                     │
│    └─ 生成 .eml → AgentMail 发送                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 示例：2026-04-05 实时搜索成果

### OpenAI 相关（4条）

1. **收购 TBPN 商业播客**（4月2日）
   - 金额：数亿美元（low hundreds of millions）
   - 意义：获得营销传播渠道，改善公共形象
   - 来源：TechCrunch

2. **完成 1220 亿美元融资**（4月2日）
   - 估值：8520 亿美元
   - 投资方：Amazon($50B), Nvidia($30B), Softbank($30B)
   - 来源：OpenAI News

3. **关闭 Sora 视频生成平台**（4月2日）
   - 网页版关闭：2026-04-26
   - API 关闭：2026-09-24
   - 战略转向：聚焦编码工具和企业客户
   - 来源：OpenAI Help Center

4. **Codex Mac 应用首周下载破百万**（4月2日）
   - 周增长率：60%
   - 来源：Sam Altman Twitter

### Anthropic 相关（3条）

5. **禁止 Claude 订阅用于第三方工具**（4月4日）
   - 影响：OpenClaw 等工具无法使用 Claude Pro/Max 订阅
   - 用户成本可能增加 50 倍
   - 来源：TechCrunch, VentureBeat

6. **Claude Code v2.1.91/92 发布**（4月4日）
   - 新增：MCP 结果持久化、多行深度链接、插件可执行文件
   - 来源：Anthropic Release Notes

7. **Claude Code 源代码泄露**（4月2日）
   - 性质：打包流程错误，非黑客攻击
   - 影响：暴露产品层系统设计
   - 来源：Multiple Tech Media

### GitHub 相关（2条）

8. **Copilot SDK 公开预览**（4月3日）
   - 允许开发者将 Copilot 能力嵌入自己的应用
   - 来源：GitHub Changelog

9. **Copilot 数据政策变更**（4月3日，生效 4月24日）
   - Free/Pro/Pro+ 用户数据将用于训练 AI 模型（除非退出）
   - Business/Enterprise 用户不受影响
   - 来源：GitHub Blog

### 其他（2条）

10. **xAI 发布 Grok 4.1**（4月5日）
    - 256K 上下文窗口，原生实时网络检索
    - SWE-Bench 从 38.2% 提升到 51.7%
    - 来源：xAI / Juejin

11. **Google Gemini 3.1 Flash Live**（4月2日）
    - 语音优先 AI 模型
    - 支持从 ChatGPT/Claude 导入聊天记录
    - 来源：Google AI Blog

12. **Sam Altman 发布 "The Gentle Singularity"**（4月2日）
    - 预测 2026 年 AI 将能"发现新颖洞见"
    - Greg Brockman 称 o3/o4-mini 已能激发新概念
    - 来源：OpenAI Blog

**总计：12 条高质量情报（原系统仅 8 条静态数据）**

---

## 最佳实践

### 1. 搜索频率
- **每日报告**：搜索前 24-48 小时的新闻
- **周报**：搜索前 7 天的重要动态
- **避免**：搜索超过 48 小时的新闻（系统会过滤掉）

### 2. 来源可信度分级
```
Tier 1 (P0): 官方博客、新闻稿、官方文档
  - openai.com/blog
  - openai.com/news
  - github.blog/changelog
  - anthropic.com/news

Tier 2 (P1): 权威科技媒体
  - TechCrunch
  - The Verge
  - VentureBeat
  - Wired

Tier 3 (P2): 社区讨论、二级市场分析
  - Reddit (r/OpenAI, r/Anthropic, r/GithubCopilot)
  - HackerNews
  - Twitter/X 官方账号
```

### 3. 主题分类指南

| 内容类型 | 分类 | 示例 |
|----------|------|------|
| Copilot/Cursor/IDE 工具 | AI Coding | Copilot 新功能、数据政策变更 |
| Claude Code/OpenClaw/Devin | AI Coding | 代码 Agent 相关 |
| MultiOn/Adept/通用助手 | AI Agent | 任务执行、自动化 |
| OpenAI/Anthropic/Google 等公司动态 | AI 公司 | 融资、收购、产品发布 |
| Sam Altman/Dario 等高管发言 | AI 领袖人物 | 采访、文章、演讲 |
| 模型发布/基准测试 | 模型与基础设施 | Grok 4.1、Gemini 3.1 |

### 4. 快速更新脚本

```bash
#!/bin/bash
# update-and-send.sh - 一键更新并发送

# 1. 提示用户搜索最新新闻（手动执行 SearchWeb）
echo "请执行 SearchWeb 搜索以下主题："
echo "- OpenAI news"
echo "- Anthropic Claude update"
echo "- GitHub Copilot update"
echo "- xAI Grok update"
echo "- Google Gemini update"
read -p "搜索完成后按回车继续..."

# 2. 更新 source log
echo "请更新 prompts/ai-industry/first-run-source-log.md"
read -p "更新完成后按回车继续..."

# 3. 生成并发送
npm run generate:all
npm run send:email

echo "完成！"
```

---

## 故障排除

### 问题：生成的报告仍然内容少

**检查清单**：
1. [ ] `first-run-source-log.md` 是否已更新？
2. [ ] 新条目是否包含所有必需字段？
3. [ ] `是否在 48 小时内` 是否设为 `是`？
4. [ ] `是否已确认` 是否设为 `是`？
5. [ ] 运行 `npm run generate:fetch` 查看分组数量

### 问题：某些分类缺失

**原因**：`src/lib/fetch.ts` 中的 `GROUP_ORDER` 定义了输出顺序，如果某分类没有条目，会被跳过。

**解决**：确保 source log 中有该分类的条目。

### 问题：情报价值分都很低

**原因**：价值评估基于信号检测，可能缺少关键词匹配。

**解决**：在 `event_summary` 和 `why_it_matters` 中包含更多行业关键词（AI Agent、模型、治理等）。

---

## 相关文件

| 文件 | 作用 |
|------|------|
| `prompts/ai-industry/first-run-source-log.md` | 情报输入源（需要手动更新） |
| `src/lib/fetch.ts` | 解析 source log 生成 JSON |
| `src/lib/intelligence-engine/value-assessor.ts` | 价值评估引擎 |
| `scripts/generate-md.ts` | Markdown 报告生成 |
| `prompts/ai-industry/sources.md` | 信息源优先级配置（参考用） |
| `prompts/ai-industry/keywords.md` | 关键词表（参考用） |

---

*最后更新：2026-04-05*
*适用版本：AI Industry Intelligence System v2.0*
