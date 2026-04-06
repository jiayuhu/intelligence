# 搜索工具对比与选择指南

本文档对比项目中可用的不同搜索工具，帮助你选择最适合的抓取方案。

## 工具概览

| 工具 | 类型 | 速度 | 质量 | 成本 | 适用场景 |
|------|------|------|------|------|----------|
| **Tavily** | AI 搜索引擎 | ⚡ 快 | ⭐⭐⭐⭐⭐ | 免费 1000次/月 | **推荐** - AI 情报抓取 |
| **Google Search API** | 传统搜索引擎 | ⚡ 快 | ⭐⭐⭐⭐ | 免费 100次/天 | 备用方案 |
| **Playwright** | 浏览器自动化 | 🐢 慢 | ⭐⭐⭐⭐⭐ | 免费 | 官方源深度抓取 |
| **RSS/Feed** | 订阅源 | ⚡⚡ 极快 | ⭐⭐⭐ | 免费 | 实时增量更新 |
| **Cheerio** | 静态 HTML | ⚡ 快 | ⭐⭐⭐ | 免费 | 简单页面抓取 |

---

## 详细对比

### 1. Tavily (推荐 ⭐)

**特点：**
- 专门为 AI Agent 设计的搜索引擎
- 返回结构化、去噪的搜索结果
- 自动抓取网页正文内容 (`raw_content`)
- AI 生成的内容摘要
- 每条结果都有相关性评分 (0-1)
- 国内网络可直接访问

**使用：**
```bash
npm run fetch:tavily
```

**配置：**
```bash
export TAVILY_API_KEY=tvly-xxxxx
```

**优势场景：**
- 需要高质量内容摘要
- 需要自动提取网页正文
- 需要相关性评分筛选
- 不想处理反爬限制

---

### 2. Google Search API

**特点：**
- 传统搜索引擎 API
- 返回标题、链接、摘要
- 支持按日期排序和过滤
- 需要翻墙访问

**使用：**
```bash
npm run fetch:google
```

**配置：**
```bash
export GOOGLE_SEARCH_API_KEY=xxxxx
export GOOGLE_SEARCH_ENGINE_ID=xxxxx
```

**优势场景：**
- 已有 Google Cloud 账号
- 需要特定站点的站内搜索
-  Tavily 额度用尽时的备用

---

### 3. Playwright (浏览器自动化)

**特点：**
- 真实浏览器环境
- 可执行 JavaScript、处理动态内容
- 可截图、可导出 PDF
- 资源消耗大、速度慢

**使用：**
```bash
npm run fetch:playwright
# 或
npm run fetch        # 统一抓取（包含 Playwright 降级策略）
```

**优势场景：**
- 需要抓取动态渲染的页面
- 需要截图验证
- 处理复杂的登录/验证流程

---

### 4. RSS/Feed 抓取

**特点：**
- 极快的增量更新
- 资源消耗最小
- 仅适用于提供 RSS 的源

**使用：**
```bash
npm run fetch:feeds
```

**优势场景：**
- 实时监控已知源
- 低资源消耗的持续监控

---

## 选择建议

### 日常自动化流程 (推荐顺序)

```bash
# 方案 A：Tavily 全自动 (⭐ 第一优先推荐)
# 优势: AI优化结果、自动内容提取、国内可访问
npm run fetch:tavily && npm run generate:all

# 方案 B：Google API 全自动 (备选)
# 适用: 已有 Google Cloud 配置，或 Tavily 额度用尽
npm run fetch:google && npm run generate:all

# 方案 C：混合策略（RSS + 浏览器降级）
# 适用: 补充抓取特定源或 Tavily/Google 都不可用时
npm run fetch && npm run generate:all
```

### 优先级决策树

```
有 TAVILY_API_KEY? 
├── 是 → 使用 Tavily (npm run fetch:tavily) ⭐
│        额度用尽? → 切换到 Google API
└── 否 → 有 Google API Key?
         ├── 是 → 使用 Google (npm run fetch:google)
         └── 否 → 使用统一抓取 (npm run fetch)
```

### 不同情报类型的最佳工具

| 情报类型 | 推荐工具 | 原因 |
|---------|---------|------|
| AI 公司动态 | Tavily | AI 相关结果质量高 |
| 模型发布 | Tavily | 能快速获取技术博客内容 |
| 官方公告 | Playwright | 需要准确抓取官方页面 |
| 融资新闻 | Tavily/Google | 新闻聚合效果好 |
| 技术论文 | Tavily | arXiv 等内容抓取完整 |

---

## 成本对比

### Tavily
- 免费额度：1000 次/月
- 付费方案：$0.025/次
- 估算：每天 12 个搜索任务 × 30 天 = 360 次/月 (在免费额度内)

### Google Search API
- 免费额度：100 次/天 = 3000 次/月
- 超出后：$5/1000 次
- 限制：需要绑定信用卡

### Playwright/RSS
- 完全免费
- 成本：服务器资源（内存、CPU）

---

## 集成架构

```
┌─────────────────────────────────────────────────────────┐
│                    情报抓取层 (按优先级)                   │
├─────────────┬─────────────┬─────────────┬───────────────┤
│   Tavily    │   Google    │  Playwright │    RSS/Feed   │
│  ⭐第一优先  │  第二备选   │ (深度抓取)  │   (增量更新)  │
│  AI搜索优化 │ 传统搜索    │             │               │
└──────┬──────┴──────┬──────┴──────┬──────┴───────┬───────┘
       │             │             │              │
       └─────────────┴──────┬──────┴──────────────┘
                            │
                    ┌───────▼────────┐
                    │   统一去重      │
                    │  (相似度算法)   │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │  生成标准 JSON  │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │  Markdown 成稿 │
                    │  HTML/PDF 导出 │
                    │  邮件发送      │
                    └────────────────┘
```

---

## 快速开始

### 使用 Tavily (推荐)

1. 获取 API Key：
   ```bash
   # 访问 https://tavily.com 注册
   # 获取 API Key: tvly-xxxxx
   ```

2. 配置环境变量：
   ```bash
   echo "TAVILY_API_KEY=tvly-xxxxx" >> .env.local
   ```

3. 执行抓取：
   ```bash
   npm run fetch:tavily
   npm run generate:all
   ```

### 对比测试

```bash
# 同时运行两个搜索工具对比结果
npm run fetch:tavily   # 输出到 source-logs/2026-XX-XX.md
npm run fetch:google   # 输出到另一个文件

# 查看差异
diff prompts/ai-industry/source-logs/2026-XX-XX-tavily.md \
     prompts/ai-industry/source-logs/2026-XX-XX-google.md
```

---

## 故障排除

### Tavily 返回结果较少
- 检查 `time_range` 设置（day/week/month）
- 增加 `max_results` 参数（默认 8，最大 20）
- 使用 `search_depth: "advanced"` 获取更深度结果

### Google API 限额错误
- 免费额度：100 次/天
- 等待次日重置或升级付费
- 切换到 Tavily 作为备用

### Playwright 内存占用过高
- 减少并发页面数
- 缩短页面超时时间
- 优先使用 RSS/Tavily，Playwright 作为降级
