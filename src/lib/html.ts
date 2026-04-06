import { renderTemplate } from "./template.js";

export function renderHtmlDocument(args: {
  baseTemplate: string;
  headerTemplate: string;
  bodyTemplate: string;
  values: Record<string, string>;
}): string {
  const header = renderTemplate(args.headerTemplate, args.values);
  const body = renderTemplate(args.bodyTemplate, args.values);
  return renderTemplate(args.baseTemplate, {
    ...args.values,
    header,
    body,
  });
}

