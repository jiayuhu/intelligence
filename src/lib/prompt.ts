import { renderTemplate } from "./template.js";

export function buildIntelPrompt(categoryName: string, template: string): string {
  return renderTemplate(template, { categoryName });
}

