# AI行业情报第一批搜索语句

## 目标
这份表用于第一期开工时的实际检索，优先配合 `keywords.md` 和 `sources.md` 使用。

## 使用规则
- 每次先限定 `48` 小时内的发布时间
- 先搜官方站点，再搜高可信媒体
- 同一主题至少用 2-3 条语句交叉验证
- 若搜索结果无法确认发布时间，直接降级为待确认线索

## AI Agent
- `site:openai.com AI agent`
- `site:openai.com agent launch`
- `site:anthropic.com agent`
- `site:anthropic.com workflow automation`
- `site:deepmind.google agent`
- `site:blog.google AI agent`
- `site:github.com agent builder`
- `site:techcrunch.com AI agent`
- `site:reuters.com AI agent`

## AI Coding
- `site:openai.com coding`
- `site:openai.com developer assistant`
- `site:anthropic.com coding`
- `site:github.com copilot`
- `site:github.com coding assistant`
- `site:news.microsoft.com copilot`
- `site:blog.google coding assistant`
- `site:techcrunch.com AI coding`
- `site:reuters.com AI coding`

## AI 公司

### 头部公司
- `site:openai.com news`
- `site:anthropic.com news`
- `site:deepmind.google blog`
- `site:blog.google AI update`
- `site:news.microsoft.com AI`
- `site:blogs.microsoft.com Copilot`
- `site:aws.amazon.com AI`
- `site:nvidia.com AI`
- `site:meta.com AI`

### 创新型公司
- `site:x.ai AI OR Grok`
- `site:cohere.com model OR API OR release`
- `site:perplexity.ai search OR AI OR update`
- `site:cursor.com changelog OR feature OR agent`
- `site:mistral.ai model OR release OR Pixtral`

## AI 领袖人物
- `site:x.com OpenAI CEO AI`
- `site:x.com Anthropic CEO AI`
- `site:x.com DeepMind CEO AI`
- `site:x.com GitHub CEO AI`
- `site:blog.company.com founder interview AI`
- `site:techcrunch.com CEO AI interview`
- `site:reuters.com founder AI`
- `site:theinformation.com AI leader`

## 模型 / 基础设施
- `site:openai.com model update`
- `site:anthropic.com model update`
- `site:deepmind.google benchmark`
- `site:nvidia.com inference`
- `site:aws.amazon.com inference cost`
- `site:blog.google benchmark`
- `site:paperswithcode.com AI benchmark`
- `site:arxiv.org reasoning model`

## 开源生态
- `site:github.com release AI`
- `site:github.com repository agent`
- `site:huggingface.co model release`
- `site:huggingface.co agent`
- `site:arxiv.org open source AI`
- `site:paperswithcode.com coding assistant`

## 监管与合规
- `site:reuters.com AI regulation`
- `site:reuters.com AI safety`
- `site:ec.europa.eu AI`
- `site:ftc.gov AI`
- `site:europa.eu AI Act`
- `site:gov.uk AI regulation`
- `site:ca.gov AI`

## 第一批执行顺序
1. OpenAI
2. Anthropic
3. Google DeepMind / Google AI
4. GitHub / Microsoft
5. Meta / Amazon / NVIDIA
6. Reuters / Bloomberg / The Information / TechCrunch 补充验证

## 扩展来源搜索语句（v1.0）

### 新兴/垂直 AI 企业
- `site:x.ai AI OR Grok`
- `site:cohere.com model OR API OR release`
- `site:stability.ai release OR Stable Diffusion`
- `site:perplexity.ai search OR AI OR update`
- `site:cursor.com changelog OR feature OR agent`
- `site:codeium.com update OR Cascade OR Windsurf`
- `site:replicate.com model OR API`
- `site:together.ai inference OR pricing OR model`
- `site:mistral.ai model OR release OR Pixtral`
- `site:midjourney.com update OR V7`

### AI Agent 基础设施
- `site:langchain.dev agent OR LangGraph OR workflow`
- `site:llamaindex.ai RAG OR agent OR retrieval`
- `site:sdk.vercel.ai AI SDK OR streaming`
- `site:microsoft.github.io/autogen multi-agent`
- `site:crewai.com workflow OR agent`
- `site:dify.ai LLM OR workflow OR agent`
- `site:n8n.io AI OR automation OR workflow`

### 技术领袖扩展
- `"Andrej Karpathy" AI OR LLM OR neural network`
- `"Yann LeCun" JEPA OR open source OR LLM`
- `"Geoffrey Hinton" AI safety OR neural`
- `"Fei-Fei Li" human-centered AI OR policy`
- `"Andrew Ng" AI application OR machine learning`
- `"Noam Brown" reasoning OR agent OR game playing`
- `"François Chollet" Keras OR ARC OR benchmark`

### 投资机构/智库
- `site:a16z.com AI OR artificial intelligence`
- `site:sequoiacap.com AI OR generative`
- `site:greylock.com AI OR startup`
- `site:hai.stanford.edu AI OR artificial intelligence`
- `site:technologyreview.com AI OR machine learning`

### 学术/技术深度
- `site:pytorch.org release OR update`
- `site:research.google AI OR machine learning`
- `site:lilianweng.github.io AI OR LLM OR safety`
- `site:distill.pub machine learning OR visualization`
- `site:epochai.org AI trends OR compute`

## 社交媒体搜索策略（X / LinkedIn）
详见 `social-media-sources.md` 完整搜索策略。

### X (Twitter) 搜索
```
# 按账号搜索（官方）
from:OpenAI AI agent
from:AnthropicAI Claude
from:cursor_ai feature
from:xai Grok

# 按账号搜索（领袖人物）
from:karpathy LLM
from:ylecun open source
from:sama announcement
from:demishassabis research

# 按话题标签
#AI OR #ArtificialIntelligence
#MachineLearning OR #DeepLearning
#AIAgent OR #AICoding OR #LLM

# 带筛选条件
AI agent filter:links min_faves:100 since:2026-04-04
OpenAI announcement min_retweets:50
```

### LinkedIn 搜索
```
# 按公司搜索
company:OpenAI AI
company:Anthropic Claude
company:Google DeepMind research

# 按话题标签
#artificialintelligence
#machinelearning
#generativeai

# 招聘信号
"hiring" AND "AI Engineer" AND "OpenAI"
"hiring" AND "LLM" AND "remote"
```

## 扩展来源执行顺序
在原有顺序完成后，按以下顺序执行：
1. 新兴企业扩展搜索（xAI, Cursor 等）
2. Agent 基础设施搜索（LangChain, LlamaIndex 等）
3. 技术领袖扩展搜索（Karpathy, LeCun 等）
4. 投资机构/智库搜索（a16z, Sequoia 等）
5. **社交媒体搜索（X 官方 + 核心领袖）**
6. **LinkedIn 企业动态搜索**

## 输出要求
- 每条语句检索到的结果必须能提取发布时间
- 结果必须记录来源名称和链接
- 先保留高可信来源命中，低可信来源只做线索
- **扩展来源结果**：统一标注 `source_tier: P1/P2`，便于区分优先级
- **社交媒体结果**：额外标注 `source_platform: x/linkedin`
