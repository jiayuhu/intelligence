import type { IntelCategoryKey } from "../../titles/intel-titles.js";

export interface IntelReportContext {
  categoryKey: IntelCategoryKey;
  reportDate: string;
  prompt: string;
  title: string;
  emailSubject: string;
  htmlPath: string;
}

