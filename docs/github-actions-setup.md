# GitHub Actions 自动化设置指南

> 实现完全无人值守的每日情报收集和发送

---

## 快速开始

### 1. 推送代码到 GitHub

```bash
git add .
git commit -m "Add automated intelligence workflow"
git push origin main
```

### 2. 配置 Secrets

在 GitHub 仓库页面：
1. 点击 **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**
3. 添加以下 secrets：

| Secret Name | 说明 | 获取方式 |
|-------------|------|----------|
| `GOOGLE_SEARCH_API_KEY` | Google Custom Search API Key | [Google Cloud Console](https://console.cloud.google.com/) |
| `GOOGLE_SEARCH_ENGINE_ID` | Google Custom Search Engine ID | [Programmable Search Engine](https://cse.google.com/cse/) |
| `AGENTMAIL_API_KEY` | AgentMail API Key | AgentMail 控制台 |
| `AGENTMAIL_INBOX_ID` | AgentMail Inbox ID | AgentMail 控制台 |
| `AGENTMAIL_BASE_URL` | AgentMail API URL | 默认: `https://api.agentmail.to` |
| `EMAIL_TO` | 收件人邮箱 | 如: `your-email@example.com` |
| `EMAIL_FROM` | 发件人邮箱 | 如: `sender@agentmail.to` |

### 3. 手动触发测试

1. 进入 GitHub 仓库 → **Actions** 标签
2. 点击 **Daily AI Intelligence Report**
3. 点击 **Run workflow**
4. 选择是否使用 Google API
5. 点击 **Run workflow**

---

## 工作流程说明

### 触发方式

1. **定时触发**：每天北京时间 09:00 (UTC 01:00)
2. **手动触发**：通过 GitHub Actions 页面手动运行

### 执行流程

```
┌─────────────────────────────────────────────────────────┐
│ 1. 检出代码                                              │
├─────────────────────────────────────────────────────────┤
│ 2. 安装依赖 (npm ci)                                     │
├─────────────────────────────────────────────────────────┤
│ 3. 抓取情报                                              │
│    方式A: Google Search API (npm run fetch:google)      │
│    方式B: 手动提供 search-results.json                   │
├─────────────────────────────────────────────────────────┤
│ 4. 生成报告 (npm run generate:all)                       │
│    - Markdown                                            │
│    - HTML                                                │
│    - PDF                                                 │
│    - Email                                               │
├─────────────────────────────────────────────────────────┤
│ 5. 发送邮件 (npm run send:email)                         │
│    通过 AgentMail API                                    │
├─────────────────────────────────────────────────────────┤
│ 6. 上传产物                                              │
│    保存为 GitHub Artifacts (保留30天)                    │
├─────────────────────────────────────────────────────────┤
│ 7. 提交更新                                              │
│    自动提交 source-logs/ 目录的更新到仓库                │
└─────────────────────────────────────────────────────────┘
```

---

## Secrets 配置详解

### Google Search API

**GOOGLE_SEARCH_API_KEY**
- 类型：字符串
- 格式：`AIzaSy...` (39字符)
- 获取：[Google Cloud Console](https://console.cloud.google.com/apis/credentials)

**GOOGLE_SEARCH_ENGINE_ID**
- 类型：字符串
- 格式：`a1b2c3d4e5f6...` (17字符)
- 获取：[Programmable Search Engine](https://cse.google.com/cse/all)

### AgentMail 配置

**AGENTMAIL_API_KEY**
- 你的 AgentMail API 密钥

**AGENTMAIL_INBOX_ID**
- 你的 AgentMail Inbox ID

**AGENTMAIL_BASE_URL** (可选)
- 默认：`https://api.agentmail.to`
- 如果使用自托管，填写你的 URL

### 邮件配置

**EMAIL_TO**
- 收件人邮箱地址
- 支持多个收件人用逗号分隔：`a@example.com,b@example.com`

**EMAIL_FROM**
- 发件人邮箱地址
- 必须与 AgentMail Inbox 关联的地址一致

---

## 故障排除

### 问题：工作流运行失败 - "Missing secrets"

**原因**：Secrets 未配置或名称错误

**解决**：
1. 检查 Settings → Secrets → Actions 中的配置
2. 确保所有必需 secrets 都已添加
3. 注意大小写敏感

### 问题：Google Search API 返回 403

**原因**：API Key 无效或配额已用完

**解决**：
1. 检查 API Key 是否正确
2. 检查 Google Cloud Console 中的配额使用情况
3. 确认 Custom Search API 已启用

### 问题：邮件发送失败

**原因**：AgentMail 配置错误或 API 限制

**解决**：
1. 检查 AgentMail API Key 和 Inbox ID
2. 验证 EMAIL_FROM 是否与 Inbox 匹配
3. 检查 AgentMail 控制台的发送日志

### 问题：生成的报告内容为空

**原因**：搜索无结果或 source log 格式错误

**解决**：
1. 检查工作流日志中的搜索步骤
2. 下载 Artifacts 检查 source log 内容
3. 手动运行 `npm run fetch:google` 本地测试

---

## 高级配置

### 修改定时时间

编辑 `.github/workflows/daily-intelligence.yml`：

```yaml
on:
  schedule:
    # 北京时间 09:00 = UTC 01:00
    - cron: '0 1 * * *'
    # 如需改为 08:00
    # - cron: '0 0 * * *'
```

### 多收件人

在 `EMAIL_TO` secret 中添加：
```
team-lead@company.com,engineer1@company.com,pm@company.com
```

### 使用 SMTP 替代 AgentMail

如需使用 SMTP，修改工作流中的发送步骤：

```yaml
- name: Send email via SMTP
  env:
    AI_INDUSTRY_SMTP_HOST: ${{ secrets.SMTP_HOST }}
    AI_INDUSTRY_SMTP_PORT: ${{ secrets.SMTP_PORT }}
    AI_INDUSTRY_SMTP_USER: ${{ secrets.SMTP_USER }}
    AI_INDUSTRY_SMTP_PASS: ${{ secrets.SMTP_PASS }}
  run: npm run send:email
```

并添加 SMTP 相关 secrets。

---

## 监控和通知

### 查看执行历史

1. 进入 GitHub 仓库 → **Actions** 标签
2. 查看工作流运行历史
3. 点击具体运行查看详细日志

### 失败通知

GitHub 默认会在工作流失败时发送邮件通知仓库管理员。

如需额外通知（如 Slack），可以添加步骤：

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    fields: repo,message,commit,author,action,eventName,ref,workflow
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## 本地测试工作流

使用 [act](https://github.com/nektos/act) 工具本地测试：

```bash
# 安装 act
brew install act

# 运行工作流
act -s GOOGLE_SEARCH_API_KEY=your_key \
    -s GOOGLE_SEARCH_ENGINE_ID=your_id \
    -s AGENTMAIL_API_KEY=your_key \
    -s AGENTMAIL_INBOX_ID=your_id
```

---

## 安全最佳实践

1. **Never commit secrets**：所有敏感信息必须通过 GitHub Secrets 管理
2. **Rotate API keys**：定期轮换 Google 和 AgentMail 的 API keys
3. **Restrict workflow permissions**：在仓库设置中限制 Actions 权限
4. **Audit logs**：定期检查 GitHub 的 security logs

---

*文档版本: 2026-04-06*