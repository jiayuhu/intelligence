# AI行业情报第一期抓取关键词表

## 目标
这份表用于第一期 `AI行业情报` 的信息抓取，优先覆盖 `AI Agent`、`AI Coding`、头部 AI 企业和 AI 领袖人物。

## 抓取原则
- 只抓 `48` 小时内发布或更新的信息
- 先抓官方来源，再抓高可信媒体
- 优先抓“新变化”，不要抓行业常识
- 每条信息必须能追溯到发布时间和来源链接

## 一级主题关键词

### 1. AI Agent
- `AI agent`
- `agentic workflow`
- `agent platform`
- `task execution`
- `automation agent`
- `tool use`
- `multi-agent`
- `agent builder`

### 2. AI Coding
- `AI coding`
- `coding assistant`
- `IDE integration`
- `code generation`
- `developer workflow`
- `pair programming`
- `agentic coding`
- `code review assistant`

### 3. 头部 AI 企业
- `OpenAI launch`
- `Anthropic update`
- `Google DeepMind release`
- `Meta AI update`
- `Microsoft Copilot`
- `GitHub Copilot`
- `AWS AI`
- `NVIDIA AI`

### 4. AI 领袖人物
- `CEO interview AI`
- `founder AI agent`
- `chief scientist AI`
- `leadership change`
- `strategy shift`
- `public statement`
- `podcast interview`
- `conference talk`

### 5. 模型 / 基础设施
- `model update`
- `benchmark`
- `inference cost`
- `training cost`
- `reasoning model`
- `context window`
- `latency`
- `throughput`

### 6. 开源生态
- `open source release`
- `GitHub repo`
- `Hugging Face`
- `arXiv`
- `Papers with Code`
- `SDK release`
- `API update`

### 7. 监管与合规
- `AI regulation`
- `policy update`
- `compliance`
- `safety standard`
- `data privacy`
- `export control`
- `copyright AI`

## 组合检索模板
- `site:openai.com agent OR coding`
- `site:anthropic.com agent OR coding`
- `site:deepmind.google agent OR coding`
- `site:github.com copilot OR coding assistant`
- `site:blog.google AI update`
- `site:news.microsoft.com Copilot`
- `site:aws.amazon.com AI`
- `site:nvidia.com AI`
- `site:techcrunch.com AI agent`
- `site:reuters.com AI coding`

## 扩展关键词（v1.0）

### 8. AI Agent 基础设施扩展
- `LangChain`
- `LangGraph`
- `LlamaIndex`
- `agent orchestration`
- `multi-agent system`
- `agent framework`
- `Vercel AI SDK`
- `AutoGen`
- `CrewAI`
- `Dify`

### 9. AI Coding 工具扩展
- `Cursor`
- `Windsurf`
- `Cascade`
- `agentic coding`
- `code intelligence`
- `AI IDE`
- `multi-file edit`

### 10. 新兴 AI 企业
- `xAI`
- `Grok`
- `Cohere`
- `Command R`
- `Stability AI`
- `Stable Diffusion`
- `Mistral`
- `Mistral Large`
- `Pixtral`
- `Perplexity`

### 11. 技术概念扩展
- `reasoning model`
- `test-time compute`
- `JEPA` (Joint Embedding Predictive Architecture)
- `ARC benchmark`
- `World Model`
- `mechanistic interpretability`

## 第一期开工顺序
1. 先扫 `OpenAI`
2. 再扫 `Anthropic`
3. 再扫 `Google DeepMind / Google AI`
4. 再扫 `Microsoft / GitHub`
5. 再扫 `Meta / Amazon / NVIDIA`
6. 最后补高可信媒体和监管信息

## 扩展来源开工顺序（v1.0）
在原有顺序完成后，执行：
1. 扫描 **新兴企业 P0 级**：xAI、Cursor
2. 扫描 **Agent 基础设施**：LangChain、LlamaIndex、Vercel、AutoGen、CrewAI、Dify
3. 扫描 **新兴企业 P1 级**：Cohere、Stability AI、Perplexity、Mistral、Windsurf
4. 扫描 **技术领袖扩展**：Karpathy、LeCun、Hinton、Andrew Ng 等
5. 参考 **投资机构报告**：a16z、Sequoia、Stanford HAI（仅作趋势判断参考）

## 社交媒体关键词（新增）
详见 `social-media-sources.md`

### X (Twitter) 关键词
- `from:OpenAI`
- `from:AnthropicAI`
- `from:cursor_ai`
- `from:xai`
- `from:karpathy`
- `from:ylecun`
- `from:sama`
- `#AI`
- `#AIAgent`
- `#AICoding`
- `#LLM`
- `#MachineLearning`

### LinkedIn 关键词
- `company:OpenAI`
- `company:Anthropic`
- `company:Google DeepMind`
- `#artificialintelligence`
- `#machinelearning`
- `#generativeai`
- `hiring AI Engineer`
- `hiring LLM`

## 使用方式
- 抓取阶段先从本表选关键词
- 再结合 `sources.md` 的优先级表筛选来源
- 若某条线索无法在 48 小时内确认，直接降级为“待确认线索”
