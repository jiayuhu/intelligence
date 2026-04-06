/**
 * 半导体情报标题配置
 */

export interface SemiconductorTitleSet {
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

export const semiconductorTitles: SemiconductorTitleSet = {
  slug: "semiconductor",
  reportTitle: "半导体情报",
  reportSubtitle: "48小时产业监测",
  emailSubjectPrefix: "【半导体情报】",
  emailSubjectBase: "日报",
  pdfTitleBase: "半导体情报报告",
  promptTitle: "半导体情报提示词",
  fileBaseName: "semiconductor",
  timeWindowHours: 48,
  recipientGroup: "semiconductor",
};

export function getSemiconductorEmailSubject(reportDate: string): string {
  return `${semiconductorTitles.emailSubjectPrefix}${semiconductorTitles.emailSubjectBase} · ${reportDate}`;
}

export function getSemiconductorPdfTitle(reportDate: string): string {
  return `${semiconductorTitles.pdfTitleBase} · ${reportDate}`;
}

export function getSemiconductorFileName(args: {
  reportDate: string;
  extension: "md" | "html" | "pdf";
}): string {
  return `${semiconductorTitles.fileBaseName}-${args.reportDate}.${args.extension}`;
}
