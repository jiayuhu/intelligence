export interface AiIndustryTitleSet {
  slug: string;
  reportTitle: string;
  reportSubtitle: string;
  emailSubjectPrefix: string;
  emailSubjectBase: string;
  pdfTitleBase: string;
  promptTitle: string;
  fileBaseName: string;
  timeWindowHours: number;
  recipientGroup: string;
}

export const aiIndustryTitles: AiIndustryTitleSet = {
  slug: "ai-industry",
  reportTitle: "AI行业情报",
  reportSubtitle: "48小时滚动监测",
  emailSubjectPrefix: "【AI行业情报】",
  emailSubjectBase: "日报",
  pdfTitleBase: "AI行业情报报告",
  promptTitle: "AI行业情报提示词",
  fileBaseName: "ai-industry",
  timeWindowHours: 48,
  recipientGroup: "ai-industry",
};

export function getAiIndustryEmailSubject(reportDate: string): string {
  // 格式: AI行业情报 | 2026-04-06 | 48小时滚动监测
  return `${aiIndustryTitles.reportTitle} | ${reportDate} | ${aiIndustryTitles.reportSubtitle}`;
}

export function getAiIndustryPdfTitle(reportDate: string): string {
  return `${aiIndustryTitles.pdfTitleBase} · ${reportDate}`;
}

export function getAiIndustryFileName(args: {
  reportDate: string;
  extension: "md" | "html" | "pdf";
}): string {
  return `${aiIndustryTitles.fileBaseName}-${args.reportDate}.${args.extension}`;
}
