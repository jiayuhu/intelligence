# AI行业情报来源清单

## 优先级表

| 优先级 | 来源类型 | 用途 | 典型示例 |
| --- | --- | --- | --- |
| P0 | 官方发布与官方技术 | 直接作为抓取主来源 | 公司博客、新闻稿、产品页、文档、GitHub、论文 |
| P1 | 领袖人物原话与官方转写 | 判断观点变化与战略信号 | 采访、演讲、播客、官方账号原帖 |
| P2 | 主流科技媒体与行业媒体 | 交叉验证与补充背景 | Reuters、Bloomberg、TechCrunch、36氪、机器之心 |
| P3 | 监管与标准公告 | 识别政策、合规与标准变化 | 监管机构公告、白皮书、行业协会 |
| P4 | 社区讨论与二手汇总 | 仅用于发现线索 | 讨论串、转述、整理贴 |

## 一级来源
优先扫描以下官方渠道：
- OpenAI Blog、OpenAI News、OpenAI Docs、OpenAI GitHub
- Anthropic News、Anthropic Research、Anthropic Docs、Anthropic GitHub
- Google DeepMind Blog、Google AI Blog、Google Cloud AI Blog
- Meta AI Blog、Meta Research
- Microsoft Blog、Microsoft Research、Azure AI Blog、GitHub Blog
- Amazon AWS News Blog、Amazon Science
- NVIDIA Blog、NVIDIA Developer Blog、NVIDIA Research

## 站点级清单
### OpenAI
- `https://openai.com/blog`
- `https://openai.com/news`
- `https://platform.openai.com/docs`
- `https://github.com/openai`

### Anthropic
- `https://www.anthropic.com/news`
- `https://www.anthropic.com/research`
- `https://docs.anthropic.com`
- `https://github.com/anthropics`

### Google DeepMind / Google AI
- `https://deepmind.google/discover/blog`
- `https://blog.google/technology/ai/`
- `https://cloud.google.com/blog/topics/ai-machine-learning`

### Meta
- `https://ai.meta.com/blog/`
- `https://ai.meta.com/research/`

### Microsoft / GitHub / Azure
- `https://blogs.microsoft.com`
- `https://www.microsoft.com/en-us/research/blog/`
- `https://azure.microsoft.com/en-us/blog/category/ai-machine-learning/`
- `https://github.blog`

### Amazon / AWS / NVIDIA
- `https://aws.amazon.com/blogs/machine-learning/`
- `https://www.amazon.science/`
- `https://blogs.nvidia.com/`
- `https://developer.nvidia.com/blog/`
- `https://research.nvidia.com/`

### 开发者与开源
- `https://github.com/trending`
- `https://github.com/`
- `https://huggingface.co/blog`
- `https://huggingface.co/papers`
- `https://huggingface.co/models`
- `https://arxiv.org/`
- `https://paperswithcode.com/`

## P0 扫描顺序
1. OpenAI
2. Anthropic
3. Google DeepMind / Google AI
4. Meta AI
5. Microsoft / GitHub / Azure
6. Amazon / AWS / Amazon Science
7. NVIDIA
8. GitHub / Hugging Face / arXiv / Papers with Code

## AI Agent 核心来源（重点）
### 代码Agent
- **OpenClaw**：`https://openclaw.com`（新兴代码Agent，重点关注）
- **Devin (Cognition)**：`https://cognition-labs.com`（首个AI软件工程师）
- **OpenDevin**：`https://opendevin.github.io`（开源Devin替代品）
- **SWE-agent** (Princeton)：`https://swe-agent.com`（学术研究型代码Agent）

### 通用Agent
- **MultiOn**：`https://multion.ai`（浏览器自动化Agent）
- **Adept AI**：`https://adept.ai`（动作执行型Agent）
- **Imbue**：`https://imbue.com`（推理型Agent）

### Agent框架与基础设施
- **LangChain**：`https://blog.langchain.dev`（Agent编排框架标准）
- **LlamaIndex**：`https://blog.llamaindex.ai`（RAG/数据Agent）
- **AutoGen** (Microsoft)：`https://microsoft.github.io/autogen`（多Agent编排）
- **CrewAI**：`https://crewai.com`（角色扮演Agent）

## 开发者与开源
- GitHub Releases、GitHub Trending、GitHub Discussions
- Hugging Face Blog、Hugging Face Hub、Hugging Face Papers
- arXiv、Papers with Code
- 官方 SDK、API 文档、Release Notes、Changelog

## AI Agent 扫描优先级（P0级）
1. OpenClaw（重点关注新兴代码Agent）
2. Devin / Cognition Labs
3. OpenAI（GPT-4 with tools/agent mode）
4. Anthropic（Claude with computer use）
5. GitHub Copilot Agent模式
6. LangChain / LlamaIndex（基础设施）

## 领袖人物与人物动态
- 公司创始人、CEO、首席科学家、研究负责人、产品负责人的官方账号
- 公开采访、播客、演讲、峰会实录、官方转写稿
- 重点关注：Sam Altman、Dario Amodei、Demis Hassabis、Mark Zuckerberg、Satya Nadella、Jensen Huang 等头部人物

## 媒体与公告
- Bloomberg、Reuters、The Information、TechCrunch、The Verge、Wired、VentureBeat
- 36氪、机器之心、量子位、极客公园、InfoQ、AI科技评论
- 监管公告、投融资公告、会议报道、产品发布会报道

## 人物重点
- Sam Altman
- Dario Amodei
- Demis Hassabis
- Mark Zuckerberg
- Satya Nadella
- Jensen Huang

## 监管与标准
- 美国、欧盟、英国、新加坡等监管机构的官方公告
- 标准组织、行业协会、会议论文集、官方白皮书

## 扩展来源（v1.0）
为增强情报覆盖度，新增以下扩展来源，详见 `extended-sources.md`：

### 新兴/垂直 AI 企业（P0-P1）
- **xAI** (P0) - Elon Musk 的 AI 公司，Grok 开发商
- **Cursor** (P0) - AI Coding 现象级产品
- **Cohere** (P1) - 企业级 LLM 头部玩家
- **Stability AI** (P1) - 开源图像/视频模型
- **Perplexity** (P1) - AI 搜索代表产品
- **Windsurf** (P1) - AI Coding 头部产品
- **Replicate** (P1) - 模型托管与推理平台
- **Together AI** (P1) - 开源模型推理优化
- **Mistral AI** (P1) - 欧洲开源 LLM 代表
- **Midjourney** (P2) - AI 图像生成头部

### AI Agent 基础设施（P1）
- **LangChain** - Agent 开发框架标准
- **LlamaIndex** - RAG/数据 Agent 框架
- **Vercel AI SDK** - 前端 AI 集成标准
- **AutoGen (Microsoft)** - 多 Agent 编排框架
- **CrewAI** - 新兴 Agent 框架
- **Dify** - 开源 LLM 应用开发平台
- **n8n AI** - 工作流自动化 + AI

### 技术领袖扩展（P1）
- **Andrej Karpathy** - 前 OpenAI/Tesla，AI 教育领袖
- **Yann LeCun** - Meta AI 首席科学家
- **Geoffrey Hinton** - AI 教父，图灵奖得主
- **Fei-Fei Li** - 斯坦福 HAI 联合主任
- **Andrew Ng** - AI 教育/应用推广
- **Noam Brown** - 推理/Agent 研究专家
- **François Chollet** - Keras 作者，ARC 基准提出者

### 投资机构/智库（P2）
- **a16z** - 顶级 VC 的 AI 趋势判断
- **Sequoia Capital** - 行业趋势报告
- **Greylock** - 早期 AI 投资洞察
- **Stanford HAI** - 学术+政策交叉视角
- **MIT Technology Review** - 权威科技媒体

### 学术/技术深度源（P2）
- **PyTorch Blog** - Meta 主导的学习框架
- **Google AI Research** - 研究前沿
- **Lilian Weng** - OpenAI 安全研究 VP
- **Distill.pub** - 高质量可视化 ML 解释
- **Epoch AI** - AI 趋势与预测研究

## 扩展来源扫描顺序（补充）
在原有 P0-P4 扫描完成后，按以下顺序扫描扩展来源：
1. 新兴企业 P0 级（xAI, Cursor）
2. Agent 基础设施 P1 级（LangChain, LlamaIndex 等）
3. 技术领袖扩展 P1 级（Karpathy, LeCun 等）
4. 新兴企业 P1 级（Cohere, Mistral 等）
5. 投资机构/智库 P2 级（a16z, Sequoia 等）

## 使用方式
1. 先按 P0 到 P4 顺序扫描，不跳级。
2. 人物动态必须优先找原话和原始场景。
3. 只有二级或三级来源时，必须标注待确认线索。
4. 同一事件优先保留最高优先级来源，低优先级来源只作补充。
5. **扩展来源优先级**：P0 扩展 = 原有 P0，P1 扩展 = 原有 P1，以此类推。
6. **冲突处理**：扩展来源与原有来源冲突时，优先采信原有来源。
