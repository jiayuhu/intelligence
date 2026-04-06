export type AiIndustrySourceTier = "tier1" | "tier2" | "tier3";

export type AiIndustryConfidence = "high" | "medium" | "low";

export type AiIndustryItemStatus = "confirmed" | "tentative";

export type AiIndustrySourceKind = "official" | "media" | "community" | "podcast" | "transcript";

export interface AiIndustrySupportingSource {
  label: string;
  url: string;
  kind: AiIndustrySourceKind;
  note?: string;
}

export type AiIndustryClassification =
  | "AI Agent"
  | "AI Coding"
  | "模型与基础设施"
  | "政策与监管"
  | "社区热点";

export interface AiIndustryFetchItem {
  title: string;
  published_at: string;
  source_name: string;
  source_url: string;
  subject: string;
  classification: AiIndustryClassification;
  event_summary: string;
  why_it_matters: string;
  confidence: AiIndustryConfidence;
  related_focus: string[];
  within_48h: boolean;
  status: AiIndustryItemStatus;
  notes?: string;
  source_tier?: AiIndustrySourceTier;
  supporting_sources?: AiIndustrySupportingSource[];
}

export interface AiIndustryFetchGroup {
  category: string;
  summary: string;
  items: AiIndustryFetchItem[];
}

export interface AiIndustryFetchResult {
  report_title: string;
  report_date: string;
  time_window_hours: number;
  generated_at?: string;
  groups: AiIndustryFetchGroup[];
}

export interface AiIndustryEmailSendResult {
  report_title: string;
  report_date: string;
  time_window_hours: number;
  email_subject: string;
  opening: string;
  highlights: AiIndustryEmailHighlight[];
  closing: string;
}

export interface AiIndustryEmailHighlight {
  title: string;
  evidence: string;
  decision_implication: string;
}
