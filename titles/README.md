# 标题配置目录

这里存放情报类型的标题与命名规则。

## 通用标题
- `intel-titles.ts`：通用情报分类的标题映射

## 专用标题
- `ai-industry.ts`：`AI行业情报` 的专用配置，包含：
  - `slug`
  - `reportTitle`
  - `reportSubtitle`
  - `emailSubjectPrefix`
  - `emailSubjectBase`
  - `pdfTitleBase`
  - `promptTitle`
  - `fileBaseName`
  - `timeWindowHours`
  - `recipientGroup`
- `ai-industry.md`：`AI行业情报` 的配置清单、字段表、开发速查和维护规则

新增其他情报类型时，优先采用同样的专用配置文件模式，并保持文件名、邮件标题、报告标题一致。
