export type IntelCategoryKey = "industry" | "technology" | "competitor" | "risk";

export interface IntelTitleDefinition {
  categoryKey: IntelCategoryKey;
  categoryName: string;
  emailSubject: string;
  fileTitle: string;
}

export const intelTitles: Record<IntelCategoryKey, IntelTitleDefinition> = {
  industry: {
    categoryKey: "industry",
    categoryName: "行业情报",
    emailSubject: "行业情报日报",
    fileTitle: "行业情报日报",
  },
  technology: {
    categoryKey: "technology",
    categoryName: "科技情报",
    emailSubject: "科技情报简报",
    fileTitle: "科技情报简报",
  },
  competitor: {
    categoryKey: "competitor",
    categoryName: "竞品情报",
    emailSubject: "竞品情报监测",
    fileTitle: "竞品情报监测",
  },
  risk: {
    categoryKey: "risk",
    categoryName: "风险情报",
    emailSubject: "风险情报预警",
    fileTitle: "风险情报预警",
  },
};

