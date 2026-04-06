import type {
  AiIndustryClassification,
  AiIndustryFetchGroup,
  AiIndustryFetchItem,
  AiIndustryFetchResult,
  AiIndustryItemStatus,
  AiIndustrySourceKind,
  AiIndustrySourceTier,
  AiIndustrySupportingSource,
} from "../types/ai-industry.js";

const VALID_CLASSIFICATIONS: AiIndustryClassification[] = [
  "AI Agent",
  "AI Coding",
  "头部 AI 企业",
  "AI 领袖人物",
  "模型与基础设施",
  "开源生态",
  "政策与监管",
  "待确认线索",
];

const GROUP_ORDER: Array<Exclude<AiIndustryClassification, "待确认线索">> = [
  "AI Agent",
  "AI Coding",
  "头部 AI 企业",
  "AI 领袖人物",
  "模型与基础设施",
  "开源生态",
  "政策与监管",
];

type SourceLogEntry = {
  标题?: string;
  检索时间?: string;
  主题分类?: string;
  检索语句?: string;
  来源名称?: string;
  来源链接?: string;
  发布时间?: string;
  "是否在 48 小时内"?: string;
  主体?: string;
  事件摘要?: string;
  影响说明?: string;
  可信度?: string;
  是否已确认?: string;
  是否进入成稿?: string;
  来源等级?: string;
  相关主题?: string;
  补充来源?: string;
  备注?: string;
};

export function normalizeSourceTier(value: string | undefined): AiIndustrySourceTier | undefined {
  const normalized = (value ?? "").trim().toLowerCase();
  if (["tier1", "p0", "p1"].includes(normalized)) {
    return "tier1";
  }
  if (["tier2", "p2"].includes(normalized)) {
    return "tier2";
  }
  if (["tier3", "p3"].includes(normalized)) {
    return "tier3";
  }
  return undefined;
}

export function normalizeRelatedFocus(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  return (value ?? "")
    .split(/[\/,，|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeClassification(value: string | undefined): AiIndustryClassification {
  const normalized = (value ?? "").trim();
  if (VALID_CLASSIFICATIONS.includes(normalized as AiIndustryClassification)) {
    return normalized as AiIndustryClassification;
  }

  if (normalized === "Headliners") {
    return "头部 AI 企业";
  }

  return "待确认线索";
}

function normalizeStatus(value: string | undefined): AiIndustryItemStatus {
  const normalized = (value ?? "").trim();
  return ["已确认", "是", "confirmed", "true"].includes(normalized.toLowerCase()) ? "confirmed" : "tentative";
}

function normalizeConfidence(value: string | undefined): AiIndustryFetchItem["confidence"] {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "high" || normalized === "medium" || normalized === "low") {
    return normalized;
  }

  if (["高", "较高"].includes(value ?? "")) {
    return "high";
  }
  if (["中", "中等"].includes(value ?? "")) {
    return "medium";
  }
  return "low";
}

function normalizeBoolean(value: string | undefined): boolean {
  return ["是", "true", "yes", "y"].includes((value ?? "").trim().toLowerCase());
}

function normalizeSourceKind(value: string | undefined): AiIndustrySourceKind {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "official" || normalized === "media" || normalized === "community" || normalized === "podcast" || normalized === "transcript") {
    return normalized;
  }
  return "media";
}

function parseSupportingSources(value: string | undefined): AiIndustrySupportingSource[] {
  if (!value?.trim()) {
    return [];
  }

  const sources: AiIndustrySupportingSource[] = [];

  for (const entry of value.split(/[；\n]/).map((segment) => segment.trim()).filter(Boolean)) {
    const [label, url, kind, note] = entry.split(/[|｜]/).map((part) => part.trim());
    if (!label || !url) {
      continue;
    }

    sources.push({
      label,
      url,
      kind: normalizeSourceKind(kind),
      note: note || undefined,
    });
  }

  return sources;
}

export function normalizeFetchResult(input: AiIndustryFetchResult): AiIndustryFetchResult {
  return {
    ...input,
    groups: input.groups.map((group) => ({
      ...group,
      category: normalizeClassification(group.category),
      items: group.items.map((item) => ({
        ...item,
        classification: normalizeClassification(item.classification),
        related_focus: normalizeRelatedFocus(item.related_focus),
        source_tier: normalizeSourceTier(item.source_tier),
        supporting_sources: (item.supporting_sources ?? []).map((source) => ({
          ...source,
          kind: normalizeSourceKind(source.kind),
        })),
      })),
    })),
  };
}

export function extractSourceLogEntries(markdown: string): SourceLogEntry[] {
  const marker = "## 本期已记录条目";
  const markerIndex = markdown.indexOf(marker);
  if (markerIndex === -1) {
    return [];
  }

  const lines = markdown.slice(markerIndex + marker.length).split(/\r?\n/);
  const entries: SourceLogEntry[] = [];
  let current: SourceLogEntry | null = null;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      if (current && Object.keys(current).length > 0) {
        entries.push(current);
        current = null;
      }
      continue;
    }

    if (!trimmed.startsWith("- ")) {
      continue;
    }

    const match = trimmed.match(/^- ([^：]+)：\s*(.*)$/);
    if (!match) {
      continue;
    }

    current ??= {};
    current[match[1] as keyof SourceLogEntry] = match[2];
  }

  if (current && Object.keys(current).length > 0) {
    entries.push(current);
  }

  return entries;
}

function buildGroupSummary(category: string, items: AiIndustryFetchItem[]): string {
  const subjects = Array.from(new Set(items.map((item) => item.subject).filter(Boolean))).slice(0, 3);
  const focus = Array.from(new Set(items.flatMap((item) => item.related_focus))).slice(0, 3);
  const subjectText = subjects.join("、");
  const focusText = focus.join("、");

  if (subjectText && focusText) {
    return `${subjectText} 在 ${focusText} 上出现新的可追踪变化。`;
  }

  if (subjectText) {
    return `${subjectText} 出现新的可追踪变化。`;
  }

  return `${category} 在本窗口内出现新的可追踪变化。`;
}

export function buildFetchResultFromSourceLog(args: {
  markdown: string;
  reportDate: string;
  reportTitle: string;
  timeWindowHours: number;
}): AiIndustryFetchResult {
  const entries = extractSourceLogEntries(args.markdown);
  const normalizedItems = entries
    .map((entry) => {
      const classification = normalizeClassification(entry["主题分类"]);
      const item: AiIndustryFetchItem = {
        title: entry["标题"] || entry["事件摘要"] || "待补充标题",
        published_at: entry["发布时间"] || args.reportDate,
        source_name: entry["来源名称"] || "待确认来源",
        source_url: entry["来源链接"] || "",
        subject: entry["主体"] || "待确认主体",
        classification,
        event_summary: entry["事件摘要"] || "",
        why_it_matters: entry["影响说明"] || entry["备注"] || "",
        confidence: normalizeConfidence(entry["可信度"]),
        related_focus: normalizeRelatedFocus(entry["相关主题"]),
        within_48h: normalizeBoolean(entry["是否在 48 小时内"]),
        status: normalizeStatus(entry["是否已确认"]),
        notes: entry["备注"] || undefined,
        source_tier: normalizeSourceTier(entry["来源等级"]),
        supporting_sources: parseSupportingSources(entry["补充来源"]),
      };

      return item;
    })
    .filter((item) => item.within_48h && item.status === "confirmed" && item.source_url);

  const groups: AiIndustryFetchGroup[] = [];

  for (const category of GROUP_ORDER) {
    const items = normalizedItems.filter((item) => item.classification === category);
    if (!items.length) {
      continue;
    }

    groups.push({
      category,
      summary: buildGroupSummary(category, items),
      items,
    });
  }

  return {
    report_title: args.reportTitle,
    report_date: args.reportDate,
    time_window_hours: args.timeWindowHours,
    generated_at: new Date(`${args.reportDate}T12:00:00Z`).toISOString(),
    groups,
  };
}
