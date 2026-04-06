import type { AiIndustryEmailHighlight } from "../types/ai-industry.js";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const highlightStyles = [
  { border: "#312e81", background: "#f9f8fc", badge: "#312e81" },
  { border: "#8b5cf6", background: "#faf9ff", badge: "#6d28d9" },
  { border: "#a78bfa", background: "#fcfcff", badge: "#7c3aed" },
];

export function renderEmailHighlightsHtml(highlights: AiIndustryEmailHighlight[]): string {
  return highlights
    .map((highlight, index) => {
      const style = highlightStyles[index % highlightStyles.length];
      return `<tr>
  <td style="padding:0 0 12px 0;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse; width:100%; border-left:4px solid ${style.border}; background-color:${style.background}; border-radius:8px; mso-table-lspace:0pt; mso-table-rspace:0pt;">
      <tr>
        <td style="padding:12px 14px; font-size:15px; line-height:1.7; color:#1f2937; vertical-align:top;">
          <div style="margin:0 0 6px 0; font-size:15px; font-weight:700; color:${style.badge}; line-height:1.5;">${index + 1}. ${escapeHtml(highlight.title)}</div>
          <div style="margin:0 0 6px 0; color:#1f2937;">依据：${escapeHtml(highlight.evidence)}</div>
          <div style="margin:0; color:#334155;">决策含义：${escapeHtml(highlight.decision_implication)}</div>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
    })
    .join("");
}

export function renderEmailTextBody(htmlBody: string): string {
  return htmlBody
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wrapBase64Lines(input: string): string {
  return input.match(/.{1,76}/g)?.join("\r\n") ?? "";
}

function buildAttachmentPart(args: {
  filename: string;
  contentType: string;
  content: Buffer;
}): string {
  const base64Content = wrapBase64Lines(args.content.toString("base64"));
  return [
    `Content-Type: ${args.contentType}; name="${args.filename}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${args.filename}"`,
    "",
    base64Content,
    "",
  ].join("\r\n");
}

export function buildEmailMimeMessage(args: {
  from: string;
  to: string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    content: Buffer;
  }>;
}): string {
  const boundary = `----intelligence-boundary-${Date.now()}`;
  const altBoundary = `----intelligence-alt-${Date.now()}`;
  const textBody =
    args.textBody ?? renderEmailTextBody(args.htmlBody);
  const hasAttachments = (args.attachments?.length ?? 0) > 0;
  const bodyParts = [
    `--${altBoundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    textBody,
    "",
    `--${altBoundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    args.htmlBody,
    "",
    `--${altBoundary}--`,
    "",
  ].join("\r\n");

  const messageParts = [
    `From: ${args.from}`,
    `To: ${args.to.join(", ")}`,
    `Subject: ${args.subject}`,
    "MIME-Version: 1.0",
    hasAttachments
      ? `Content-Type: multipart/mixed; boundary="${boundary}"`
      : `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    "",
  ];

  if (hasAttachments) {
    messageParts.push(
      `--${boundary}`,
      `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
      "",
      bodyParts,
      "",
    );

    for (const attachment of args.attachments ?? []) {
      messageParts.push(`--${boundary}`, buildAttachmentPart(attachment));
    }

    messageParts.push(`--${boundary}--`, "");
    return messageParts.join("\r\n");
  }

  messageParts.push(bodyParts);
  return messageParts.join("\r\n");
}
