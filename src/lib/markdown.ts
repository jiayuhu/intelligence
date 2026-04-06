export function extractMarkdownSection(markdown: string, heading: string): string {
  const lines = markdown.split(/\r?\n/);
  const sectionLines: string[] = [];
  let inSection = false;

  for (const line of lines) {
    if (line.trim() === heading.trim()) {
      inSection = true;
      continue;
    }

    if (inSection && /^##\s+/.test(line)) {
      break;
    }

    if (inSection) {
      sectionLines.push(line);
    }
  }

  return sectionLines.join("\n").trim();
}

export function extractMarkdownBullets(section: string): string[] {
  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^-\s+/.test(line))
    .map((line) => line.replace(/^-\s+/, "").trim())
    .filter(Boolean);
}

export function normalizeMarkdownText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripMarkdown(value: string): string {
  return normalizeMarkdownText(value.replace(/\*\*/g, "").replace(/`/g, ""));
}

function renderMarkdownBold(value: string): string {
  // 将 **text** 转换为 <strong>text</strong>
  return value.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#312e81;">$1</strong>');
}

function renderCheckbox(value: string): string {
  // 将 [ ] 和 [x] 转换为可视化的复选框
  return value
    .replace(/\[ \]/g, '☐')
    .replace(/\[x\]/g, '☑')
    .replace(/\[X\]/g, '☑');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMetaRow(label: string, value: string): string {
  return `<td style="padding:0 16px 0 0; vertical-align:top;">
    <div style="font-size:11px; font-weight:600; color:#8b5cf6; letter-spacing:0.03em; margin-bottom:2px;">${escapeHtml(label)}</div>
    <div style="font-size:13px; color:#374151;">${escapeHtml(value)}</div>
  </td>`;
}

function renderInlineValue(value: string): string {
  const trimmed = value.trim();
  const escaped = escapeHtml(trimmed);
  return escaped.replace(/https?:\/\/[^\s；]+/g, (url) => `<a href="${url}" style="color:#1d4ed8; text-decoration:none;">${url}</a>`);
}

function renderDetailRow(label: string, value: string): string {
  // 处理标签中的加粗标记
  const processedLabel = renderMarkdownBold(escapeHtml(label));
  // 处理值中的加粗标记
  const processedValue = renderMarkdownBold(renderInlineValue(value));
  return `<tr>
    <td style="width:80px; padding:0 12px 10px 0; font-size:12px; font-weight:600; color:#6b7280; vertical-align:top; white-space:nowrap;">${processedLabel}</td>
    <td style="padding:0 0 10px 0; font-size:14px; line-height:1.7; color:#374151; overflow-wrap:anywhere; word-break:break-word;">${processedValue}</td>
  </tr>`;
}

function renderNumberedBlock(index: string, title: string, details: Array<{ label: string; value: string }>): string {
  const detailRows = details
    .map((detail) => renderDetailRow(detail.label, detail.value))
    .join("");

  return `<tr>
  <td style="padding:0 28px 16px 28px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse; width:100%; background-color:#ffffff; border:1px solid #e5e5f0; border-left:3px solid #8b5cf6; mso-table-lspace:0pt; mso-table-rspace:0pt;">
      <tr>
        <td style="padding:14px 18px 12px 18px; border-bottom:1px solid #f3f4f6; font-size:15px; line-height:1.5; font-weight:600; color:#312e81; overflow-wrap:anywhere; word-break:break-word;">${escapeHtml(index)}. ${escapeHtml(stripMarkdown(title))}</td>
      </tr>
      <tr>
        <td style="padding:12px 18px 6px 18px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse; width:100%; mso-table-lspace:0pt; mso-table-rspace:0pt;">
            ${detailRows}
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function flushTable(rows: string[]): string {
  if (!rows.length) {
    return "";
  }

  const parsedRows = rows
    .map((row) => row
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim())
      .filter(Boolean),
    )
    .filter((cells) => cells.length);

  if (!parsedRows.length) {
    return "";
  }

  const header = parsedRows[0];
  const body = parsedRows.slice(1).filter((row) => row.length === header.length);

  const renderRow = (cells: string[], isHeader = false) => {
    const tag = isHeader ? "th" : "td";
    return `<tr>${cells
      .map((cell) => {
        // 表格单元格也需要处理加粗标记
        const processedCell = renderMarkdownBold(escapeHtml(cell));
        return `<${tag} style="padding:10px 12px; border:1px solid #e5e5f0; font-size:13px; color:${isHeader ? "#312e81" : "#374151"}; background-color:${isHeader ? "#f9f8fc" : "#ffffff"}; font-weight:${isHeader ? "600" : "400"}; overflow-wrap:anywhere; word-break:break-word;">${processedCell}</${tag}>`;
      })
      .join("")}</tr>`;
  };

  const headerHtml = renderRow(header, true);
  const bodyHtml = body.map((row) => renderRow(row)).join("");

  return `<tr>
  <td style="padding:0 28px 16px 28px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse; width:100%; border:1px solid #e5e5f0; mso-table-lspace:0pt; mso-table-rspace:0pt;">
      ${headerHtml}
      ${bodyHtml}
    </table>
  </td>
</tr>`;
}

export function renderMarkdownReportHtml(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const html: string[] = [];
  const meta: Record<string, string> = {};
  let skippedMainTitle = false;
  let tableBuffer: string[] = [];
  let currentNumberedBlock:
    | {
        index: string;
        title: string;
        details: Array<{ label: string; value: string }>;
      }
    | null = null;

  const flushNumberedBlock = (): void => {
    if (!currentNumberedBlock) {
      return;
    }

    html.push(renderNumberedBlock(currentNumberedBlock.index, currentNumberedBlock.title, currentNumberedBlock.details));
    currentNumberedBlock = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      // 空行不关闭编号块（卡片），让卡片可以跨空行收集内容
      if (tableBuffer.length) {
        html.push(flushTable(tableBuffer));
        tableBuffer = [];
      }
      continue;
    }

    if (/^\|.*\|$/.test(trimmed)) {
      flushNumberedBlock();
      tableBuffer.push(trimmed);
      continue;
    }

    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      flushNumberedBlock();
      if (tableBuffer.length) {
        html.push(flushTable(tableBuffer));
        tableBuffer = [];
      }
      currentNumberedBlock = {
        index: numberedMatch[1],
        title: numberedMatch[2],
        details: [],
      };
      continue;
    }

    if (currentNumberedBlock) {
      // 匹配 "标签：内容" 格式
      const detailMatch = trimmed.match(/^([^：]+)：\s*(.+)$/);
      if (detailMatch) {
        currentNumberedBlock.details.push({
          label: detailMatch[1],
          value: detailMatch[2],
        });
        continue;
      }

      // 匹配 "**标签**：" 加粗格式（内容可能在下一行）
      const boldLabelMatch = trimmed.match(/^\*\*([^*]+)\*\*：\s*$/);
      if (boldLabelMatch) {
        currentNumberedBlock.details.push({
          label: boldLabelMatch[1],
          value: "", // 内容将在后续行填充
        });
        continue;
      }

      // 匹配 "**标签**：内容" 加粗格式（内容在同一行）
      const boldLabelWithValueMatch = trimmed.match(/^\*\*([^*]+)\*\*：\s*(.+)$/);
      if (boldLabelWithValueMatch) {
        currentNumberedBlock.details.push({
          label: boldLabelWithValueMatch[1],
          value: boldLabelWithValueMatch[2],
        });
        continue;
      }

      const lastDetail = currentNumberedBlock.details[currentNumberedBlock.details.length - 1];
      if (lastDetail && !trimmed.startsWith("# ") && !trimmed.startsWith("## ") && !trimmed.startsWith("### ")) {
        lastDetail.value = `${lastDetail.value} ${trimmed}`.trim();
        continue;
      }
    }

    if (trimmed.startsWith("# ")) {
      flushNumberedBlock();
      if (tableBuffer.length) {
        html.push(flushTable(tableBuffer));
        tableBuffer = [];
      }
      if (!skippedMainTitle) {
        skippedMainTitle = true;
        continue;
      }
      const processedTitle = renderMarkdownBold(escapeHtml(trimmed.slice(2)));
      html.push(`<tr><td style="padding:16px 28px 8px 28px; font-size:22px; font-weight:700; line-height:1.3; color:#312e81; letter-spacing:-0.01em;">${processedTitle}</td></tr>`);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushNumberedBlock();
      const processedHeading = renderMarkdownBold(escapeHtml(trimmed.slice(3)));
      html.push(`<tr>
  <td style="padding:24px 28px 12px 28px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse; width:100%; mso-table-lspace:0pt; mso-table-rspace:0pt;">
      <tr>
        <td style="width:4px; background-color:#8b5cf6; font-size:0; line-height:0;">&nbsp;</td>
        <td style="padding-left:12px; font-size:17px; font-weight:600; color:#312e81; letter-spacing:0;">${processedHeading}</td>
      </tr>
    </table>
  </td>
</tr>`);
      continue;
    }

    // 匹配 "### [#数字 | 分数] 标题" 格式的卡片标题
    const cardTitleMatch = trimmed.match(/^###\s+\[?(#[\d]+\s*\|\s*\d+分)\]?\s*(.+)$/);
    if (cardTitleMatch) {
      flushNumberedBlock();
      currentNumberedBlock = {
        index: cardTitleMatch[1],
        title: cardTitleMatch[2],
        details: [],
      };
      continue;
    }

    // 普通三级标题作为标签（专栏标题）
    if (trimmed.startsWith("### ")) {
      flushNumberedBlock();
      const processedSubHeading = renderMarkdownBold(escapeHtml(trimmed.slice(4)));
      html.push(`<tr>
  <td style="padding:12px 28px 8px 28px;">
    <div style="display:inline-block; padding:6px 14px; background-color:#f9f8fc; border:1px solid #ddd6fe; border-left:3px solid #8b5cf6; font-size:14px; font-weight:700; color:#312e81;">${processedSubHeading}</div>
  </td>
</tr>`);
      continue;
    }

    // 四级标题（情报条目标题）
    if (trimmed.startsWith("#### ")) {
      flushNumberedBlock();
      const processedItemTitle = renderMarkdownBold(escapeHtml(trimmed.slice(5)));
      html.push(`<tr>
  <td style="padding:16px 28px 8px 28px;">
    <div style="font-size:15px; font-weight:600; color:#312e81; line-height:1.5;">${processedItemTitle}</div>
  </td>
</tr>`);
      continue;
    }

    if (/^日期：/.test(trimmed)) {
      meta.date = trimmed.replace(/^日期：/, "").trim();
      continue;
    }

    if (/^时间窗口：/.test(trimmed)) {
      meta.window = trimmed.replace(/^时间窗口：/, "").trim();
      continue;
    }

    if (/^数据来源：/.test(trimmed)) {
      meta.sources = trimmed.replace(/^数据来源：/, "").trim();
      continue;
    }

    if (/^-\s+/.test(trimmed)) {
      flushNumberedBlock();
      const content = renderCheckbox(renderMarkdownBold(escapeHtml(trimmed.slice(2))));
      html.push(`<tr>
  <td style="padding:0 28px 8px 28px; vertical-align:top;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse; width:100%; mso-table-lspace:0pt; mso-table-rspace:0pt;">
      <tr>
        <td style="width:16px; color:#8b5cf6; font-weight:600; vertical-align:top; padding-top:3px;">•</td>
        <td style="font-size:14px; line-height:1.7; color:#374151;">${content}</td>
      </tr>
    </table>
  </td>
</tr>`);
      continue;
    }

    flushNumberedBlock();
    // 处理加粗标记和复选框
    const processedText = renderCheckbox(renderMarkdownBold(escapeHtml(trimmed)));
    html.push(`<tr>
  <td style="padding:0 28px 10px 28px; font-size:14px; line-height:1.7; color:#374151;">${processedText}</td>
</tr>`);
  }

  flushNumberedBlock();
  if (tableBuffer.length) {
    html.push(flushTable(tableBuffer));
    tableBuffer = [];
  }

  const metaEntries = [
    ["日期", meta.date],
    ["时间窗口", meta.window],
    ["数据来源", meta.sources],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  const metaHtml = metaEntries.length
    ? `<tr>
  <td style="padding:20px 28px 4px 28px; background-color:#ffffff; border-bottom:1px solid #f3f4f6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse; width:100%; mso-table-lspace:0pt; mso-table-rspace:0pt;">
      <tr>
        ${metaEntries
          .map(([label, value]) => renderMetaRow(label, value))
          .join("")}
      </tr>
    </table>
  </td>
</tr>`
    : "";

  return `${metaHtml}
${html.join("\n")}
`;
}
