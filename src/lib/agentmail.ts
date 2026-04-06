export interface AgentMailConfig {
  apiKey: string;
  inboxId: string;
  baseUrl: string;
}

export interface AgentMailAttachment {
  filename: string;
  contentType: string;
  contentBase64: string;
}

export async function sendEmailViaAgentMail(args: {
  config: AgentMailConfig;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: AgentMailAttachment[];
  headers?: Record<string, string>;
}): Promise<void> {
  const response = await fetch(
    `${args.config.baseUrl.replace(/\/$/, "")}/v0/inboxes/${encodeURIComponent(args.config.inboxId)}/messages/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
        attachments: args.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content_type: attachment.contentType,
          content: attachment.contentBase64,
        })),
        headers: args.headers,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`AgentMail 发送失败：${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`);
  }
}
