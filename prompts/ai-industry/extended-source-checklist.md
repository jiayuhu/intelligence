# AI行业情报扩展来源执行检查清单

## 版本
- 对应扩展来源版本: v1.0
- 创建日期: 2026-04-05
- 扩展来源数量: 36 个

---

## 阶段一：扩展来源接入准备

### 1.1 RSS/API 接入检查
- [ ] xAI - 确认官方 RSS/API 可用性
- [ ] Cohere - 验证 `cohere.com/blog/rss.xml`
- [ ] Stability AI - 检查新闻页结构
- [ ] Midjourney - 确认 Discord/官网更新页
- [ ] Perplexity - 验证博客 RSS
- [ ] Cursor - 确认 Changelog 更新频率
- [ ] Windsurf - 验证博客可用性
- [ ] Replicate - 验证博客 RSS
- [ ] Together AI - 验证博客可用性
- [ ] Mistral AI - 验证新闻页

### 1.2 Agent 基础设施 RSS/API 检查
- [ ] LangChain - 验证 `blog.langchain.dev/rss.xml`
- [ ] LlamaIndex - 验证博客可用性
- [ ] Vercel AI SDK - 确认文档/Github releases 更新
- [ ] AutoGen - 确认 GitHub releases
- [ ] CrewAI - 验证博客可用性
- [ ] Dify - 验证博客可用性
- [ ] n8n AI - 验证博客可用性

### 1.3 技术领袖渠道检查
- [ ] Andrej Karpathy - 确认 X 账号活跃 (@karpathy)
- [ ] Yann LeCun - 确认 X 账号 (@ylecun)
- [ ] Geoffrey Hinton - 确认近期公开活动
- [ ] Fei-Fei Li - 确认 Stanford HAI 联动
- [ ] Andrew Ng - 验证 deeplearning.ai 博客
- [ ] Noam Brown - 确认 X 账号 (@polynoamial)
- [ ] François Chollet - 确认 X 账号 (@fchollet)
- [ ] Sebastian Raschka - 确认 Substack 更新

### 1.4 投资机构/智库检查
- [ ] a16z - 验证 `a16z.com/ai/` 可访问
- [ ] Sequoia - 验证文章标签页
- [ ] Greylock - 验证 Greymatter 博客
- [ ] Menlo Ventures - 验证 perspective 页面
- [ ] Stanford HAI - 验证新闻页 RSS
- [ ] MIT TR - 验证 AI 主题页

### 1.5 学术/技术源检查
- [ ] PyTorch - 验证博客 RSS
- [ ] Google AI Research - 验证博客
- [ ] Lilian Weng - 验证个人博客
- [ ] Distill.pub - 确认发布节奏
- [ ] Epoch AI - 验证博客可用性

### 1.6 社交媒体来源检查（新增）
详见 `social-media-sources.md`

#### X (Twitter) 账号检查
- [ ] @OpenAI - 确认账号活跃
- [ ] @AnthropicAI - 确认账号活跃
- [ ] @DeepMind - 确认账号活跃
- [ ] @cursor_ai - 确认账号活跃
- [ ] @xai - 确认账号活跃
- [ ] @sama - 确认账号活跃
- [ ] @karpathy - 确认账号活跃
- [ ] @ylecun - 确认账号活跃
- [ ] @demishassabis - 确认账号活跃
- [ ] @fchollet - 确认账号活跃
- [ ] @polynoamial - 确认账号活跃
- [ ] @drfeifei - 确认账号活跃
- [ ] @AndrewYNg - 确认账号活跃
- [ ] X API v2 - 确认接入方式和速率限制

#### LinkedIn 页面检查
- [ ] OpenAI 公司页面 - 确认可访问
- [ ] Anthropic 公司页面 - 确认可访问
- [ ] Google DeepMind 页面 - 确认可访问
- [ ] Microsoft 页面 - 确认可访问
- [ ] NVIDIA 页面 - 确认可访问
- [ ] LinkedIn API - 确认接入方式（如有）

---

## 阶段二：搜索语句更新

### 2.1 新兴企业搜索语句
```
- [ ] site:x.ai AI OR Grok
- [ ] site:cohere.com model OR API
- [ ] site:stability.ai release
- [ ] site:midjourney.com update
- [ ] site:perplexity.ai search OR AI
- [ ] site:cursor.com changelog OR feature
- [ ] site:codeium.com update OR Cascade
- [ ] site:replicate.com model
- [ ] site:together.ai inference OR pricing
- [ ] site:mistral.ai model OR release
```

### 2.2 Agent 框架搜索语句
```
- [ ] site:langchain.dev agent OR LangGraph
- [ ] site:llamaindex.ai RAG OR agent
- [ ] site:sdk.vercel.ai AI SDK
- [ ] site:microsoft.github.io/autogen
- [ ] site:crewai.com workflow
- [ ] site:dify.ai LLM OR workflow
- [ ] site:n8n.io AI OR automation
```

### 2.3 技术领袖搜索语句
```
- [ ] "Andrej Karpathy" AI OR LLM
- [ ] "Yann LeCun" JEPA OR open source
- [ ] "Geoffrey Hinton" AI safety
- [ ] "Fei-Fei Li" human-centered AI
- [ ] "Andrew Ng" AI application
- [ ] "Noam Brown" reasoning OR agent
- [ ] "François Chollet" Keras OR ARC
```

---

## 阶段三：关键词扩展

### 3.1 新增关键词（加入 keywords.md）
```
AI Agent 扩展:
- [ ] LangChain
- [ ] LlamaIndex
- [ ] LangGraph
- [ ] multi-agent
- [ ] agent orchestration

AI Coding 扩展:
- [ ] Cursor
- [ ] Windsurf
- [ ] Cascade
- [ ] agentic coding
- [ ] code intelligence

新兴企业:
- [ ] xAI
- [ ] Grok
- [ ] Cohere
- [ ] Mistral
- [ ] Perplexity

技术概念:
- [ ] reasoning model
- [ ] test-time compute
- [ ] JEPA
- [ ] ARC benchmark
```

### 3.2 社交媒体关键词（新增）
详见 `social-media-sources.md`

#### X (Twitter) 关键词
```
- [ ] from:OpenAI
- [ ] from:AnthropicAI
- [ ] from:cursor_ai
- [ ] from:karpathy
- [ ] from:ylecun
- [ ] from:sama
- [ ] #AI
- [ ] #AIAgent
- [ ] #AICoding
- [ ] #LLM
```

#### LinkedIn 关键词
```
- [ ] company:OpenAI
- [ ] company:Anthropic
- [ ] #artificialintelligence
- [ ] #generativeai
- [ ] "hiring" AND "AI"
```

---

## 阶段四：来源质量验证

### 4.1 更新频率验证（试运行一周）
| 来源 | 预期频率 | 实际频率 | 是否达标 |
|------|---------|---------|---------|
| xAI | 每日 | ___ | [ ] |
| Cursor | 每日 | ___ | [ ] |
| LangChain | 每日 | ___ | [ ] |
| Cohere | 每日 | ___ | [ ] |
| Andrej Karpathy | 每日 | ___ | [ ] |
| Yann LeCun | 每日 | ___ | [ ] |

### 4.2 信息质量验证
- [ ] 扩展来源信息是否可追溯发布时间
- [ ] 扩展来源是否提供原始链接
- [ ] 领袖人物信息是否有原话/原文
- [ ] 投资机构内容是否标注为观点而非事实

### 4.3 社交媒体质量验证（新增）
- [ ] X 官方账号信息是否与官方博客一致
- [ ] 领袖人物观点是否标注为"个人观点"
- [ ] LinkedIn 企业动态是否有其他来源交叉验证
- [ ] 社交媒体信息是否标注 `source_platform`
- [ ] 未确认账号信息是否标记为"待确认"

### 4.4 与原有来源冲突测试
- [ ] 记录任何与 P0 来源冲突的信息
- [ ] 验证冲突时的优先级处理
- [ ] 确认降级标注机制有效
- [ ] 测试社交媒体与官方来源的冲突处理

---

## 阶段五：提示词更新

### 5.1 collect.md 更新
- [ ] 更新分类建议，加入新兴企业和框架
- [ ] 补充扩展来源的查询模板
- [ ] 更新 groups 输出顺序说明

### 5.2 draft.md 更新
- [ ] 在核心动态中增加 Agent 基础设施分类
- [ ] 更新领袖人物列表
- [ ] 增加新兴企业动态章节说明

### 5.3 更新 collect-output-schema.json
- [ ] 确认 classification enum 是否需要扩展
- [ ] 验证新增分类与现有 schema 兼容

---

## 阶段六：自动化脚本调整

### 6.1 扫描脚本检查
- [ ] 新增来源的 URL 格式适配
- [ ] RSS 解析器测试（不同 RSS 格式）
- [ ] X/Twitter API 接入（领袖人物）
- [ ] 频率控制（避免被限流）

### 6.2 输出文件更新
- [ ] 扩展来源命中记录在 first-run-source-log.md
- [ ] 新增来源单独分组还是合并展示
- [ ] 来源标注（区分原有/扩展）

---

## 阶段七：试运行验证

### 7.1 单轮测试（1天）
- [ ] 使用扩展来源抓取一天数据
- [ ] 验证输出 JSON 结构正确
- [ ] 检查 Markdown 成稿质量
- [ ] 确认邮件摘要准确性
- [ ] **测试 X 账号信息采集**

### 7.2 连续测试（1周）
- [ ] 连续 7 天使用扩展来源
- [ ] 统计每日新增信息量
- [ ] 评估噪音/信噪比
- [ ] 记录误报/漏报情况

### 7.3 对比测试
- [ ] 同一时间段：原有来源 vs 扩展来源
- [ ] 信息重叠度统计
- [ ] 独家信息比例
- [ ] 信息质量评分对比

---

## 阶段八：文档同步

### 8.1 核心文档更新
- [ ] 更新 sources.md（标记扩展来源）
- [ ] 更新 source-sites.md（添加具体 URL）
- [ ] 更新 search-queries.md（新增搜索语句）
- [ ] 更新 keywords.md（新增关键词）

### 8.2 执行文档更新
- [ ] 更新 first-run-checklist.md（扩展源扫描步骤）
- [ ] 更新 topic-matrix.md（新增主题映射）
- [ ] 更新 first-run-index.md（新增扩展来源入口）

---

## 验收标准

### 最小可用（MVP）
- [ ] 至少 5 个 P0/P1 扩展来源成功接入
- [ ] 扩展来源信息能正确进入输出 JSON
- [ ] 成稿 Markdown 包含扩展来源信息
- [ ] **至少 3 个 X 关键账号接入**（官方 + 领袖）

### 完整交付
- [ ] 全部 36 个扩展来源接入完成
- [ ] **X 和 LinkedIn 社交媒体来源接入完成**
- [ ] 连续 7 天试运行无严重错误
- [ ] 文档全部同步更新
- [ ] 新增来源对成稿质量有明显提升
- [ ] **社交媒体信息交叉验证机制有效**

---

## 风险提示

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 部分来源无 RSS/API | 需要手动抓取或网页解析 | 优先接入有 RSS 的来源 |
| X/Twitter API 成本 | 领袖人物信息获取困难 | 使用公开网页版，降低频率 |
| 信息过载 | 48h 内信息量过大 | 增加热度过滤，只保留高价值 |
| 来源可靠性不确定 | 新兴企业信息准确性 | 标注来源等级，多方验证 |
| **X API 限制** | **无法获取实时推文** | **使用网页版 + 关键账号列表** |
| **LinkedIn 反爬** | **无法自动化采集** | **人工监测 + 邮件订阅** |
| **社交媒体噪音** | **信息质量参差不齐** | **仅关注认证账号 + 交叉验证** |
| **领袖个人观点** | **可能不代表公司立场** | **明确标注为个人观点** |

---

## 后续迭代计划

### v1.1（2周后）
- 根据试运行反馈调整来源优先级
- 补充缺失的 RSS/API 接入
- 优化领袖人物信息抓取

### v1.2（1个月后）
- 考虑增加社区源（Reddit 更多子版块）
- 考虑增加视频/播客源转录
- 评估是否需要 AI 安全专项来源

---

## 执行记录

| 日期 | 执行内容 | 执行人 | 状态 |
|------|---------|--------|------|
| 2026-04-05 | 创建扩展来源清单 v1.0 | - | 完成 |
| | | | |
| | | | |
