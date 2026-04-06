import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportTitle = "AI行业情报";
const timeWindowHours = 48;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value) {
  return typeof value === "string" ? value : null;
}

function asNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value) {
  return typeof value === "boolean" ? value : null;
}

function asStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : null;
}

async function readJson(relativePath) {
  const content = await readFile(path.join(repoRoot, relativePath), "utf8");
  return JSON.parse(content);
}

function validateFetchItem(item, groupName, index) {
  assert(isRecord(item), `${groupName}[${index}] 不是对象`);

  const title = asString(item.title);
  const publishedAt = asString(item.published_at);
  const sourceName = asString(item.source_name);
  const sourceUrl = asString(item.source_url);
  const subject = asString(item.subject);
  const classification = asString(item.classification);
  const eventSummary = asString(item.event_summary);
  const whyItMatters = asString(item.why_it_matters);
  const confidence = asString(item.confidence);
  const relatedFocus = asString(item.related_focus) ?? asStringArray(item.related_focus);
  const within48h = asBoolean(item.within_48h);
  const status = asString(item.status);
  const sourceTier = asString(item.source_tier);

  assert(title, `${groupName}[${index}].title 缺失`);
  assert(publishedAt, `${groupName}[${index}].published_at 缺失`);
  assert(sourceName, `${groupName}[${index}].source_name 缺失`);
  assert(sourceUrl, `${groupName}[${index}].source_url 缺失`);
  assert(subject, `${groupName}[${index}].subject 缺失`);
  assert(classification, `${groupName}[${index}].classification 缺失`);
  assert(eventSummary, `${groupName}[${index}].event_summary 缺失`);
  assert(whyItMatters, `${groupName}[${index}].why_it_matters 缺失`);
  assert(confidence && ["high", "medium", "low"].includes(confidence), `${groupName}[${index}].confidence 无效`);
  assert(relatedFocus, `${groupName}[${index}].related_focus 缺失`);
  assert(within48h !== null, `${groupName}[${index}].within_48h 缺失`);
  assert(status && ["confirmed", "tentative"].includes(status), `${groupName}[${index}].status 无效`);
  if (sourceTier) {
    assert(["tier1", "tier2", "tier3", "P0", "P1", "P2", "P3"].includes(sourceTier), `${groupName}[${index}].source_tier 无效`);
  }

  if (item.supporting_sources !== undefined) {
    assert(Array.isArray(item.supporting_sources), `${groupName}[${index}].supporting_sources 不是数组`);
  }
}

function validateFetchGroup(group, index) {
  assert(isRecord(group), `groups[${index}] 不是对象`);

  const category = asString(group.category);
  const summary = asString(group.summary);
  assert(category, `groups[${index}].category 缺失`);
  assert(summary, `groups[${index}].summary 缺失`);
  assert(Array.isArray(group.items), `groups[${index}].items 不是数组`);

  group.items.forEach((item, itemIndex) => validateFetchItem(item, `${category}.items`, itemIndex));
}

function validateFetchResult(value, label) {
  assert(isRecord(value), `${label} 不是对象`);

  const reportTitleValue = asString(value.report_title);
  const reportDate = asString(value.report_date);
  const timeWindowHoursValue = asNumber(value.time_window_hours);
  const groups = value.groups;

  assert(reportTitleValue !== null, `${label}.report_title 缺失`);
  assert(reportDate, `${label}.report_date 缺失`);
  assert(timeWindowHoursValue !== null, `${label}.time_window_hours 缺失`);
  assert(reportTitleValue === reportTitle, `${label}.report_title 与固定标题不一致`);
  assert(timeWindowHoursValue === timeWindowHours, `${label}.time_window_hours 与固定窗口不一致`);
  assert(Array.isArray(groups), `${label}.groups 不是数组`);

  groups.forEach((group, index) => validateFetchGroup(group, index));

  return `${reportDate} / ${groups.map((group) => `${group.category}:${group.items.length}`).join(", ")}`;
}

function validateSendResult(value) {
  assert(isRecord(value), "发送结果不是对象");

  const reportTitleValue = asString(value.report_title);
  const reportDate = asString(value.report_date);
  const timeWindowHoursValue = asNumber(value.time_window_hours);
  const emailSubject = asString(value.email_subject);
  const opening = asString(value.opening);
  const closing = asString(value.closing);
  const highlights = value.highlights;

  assert(reportTitleValue !== null, "发送结果 report_title 缺失");
  assert(reportDate, "发送结果 report_date 缺失");
  assert(timeWindowHoursValue !== null, "发送结果 time_window_hours 缺失");
  assert(emailSubject, "email_subject 缺失");
  assert(opening, "opening 缺失");
  assert(closing, "closing 缺失");
  assert(reportTitleValue === reportTitle, "发送结果 report_title 不一致");
  assert(timeWindowHoursValue === timeWindowHours, "发送结果 time_window_hours 不一致");
  assert(emailSubject === `【AI行业情报】日报 · ${reportDate}`, "email_subject 与固定主题不一致");
  assert(Array.isArray(highlights), "highlights 不是数组");
  assert(highlights.length >= 3 && highlights.length <= 5, "highlights 数量应在 3 到 5 条之间");
  assert(
    highlights.every((item) => isRecord(item)
      && asString(item.title)
      && asString(item.evidence)
      && asString(item.decision_implication)),
    "highlights 结构无效",
  );

  return `${reportDate} / ${highlights.length} 条摘要`;
}

async function main() {
  const collectExample = await readJson("prompts/ai-industry/collect-output-example.json");
  const sampleSet = await readJson("prompts/ai-industry/first-run-fetch-sample-set.json");
  const sendExample = await readJson("prompts/ai-industry/send-output-example.json");

  const collectSummary = validateFetchResult(collectExample, "collect-output-example.json");
  const sampleSummary = validateFetchResult(sampleSet, "first-run-fetch-sample-set.json");
  const sendSummary = validateSendResult(sendExample);

  console.log(`抓取示例校验通过：${collectSummary}`);
  console.log(`首轮样例校验通过：${sampleSummary}`);
  console.log(`发送示例校验通过：${sendSummary}`);
  console.log(`固定邮件标题：${sendExample.email_subject}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
