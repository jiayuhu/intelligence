import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const chineseRegularFont = require.resolve("@fontsource/noto-sans-sc/files/noto-sans-sc-100-400-normal.woff");
const chineseBoldFont = require.resolve("@fontsource/noto-sans-sc/files/noto-sans-sc-100-700-normal.woff");

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function injectPdfStyles(html: string, pdfTitle: string): string {
  const regularFontUrl = pathToFileURL(chineseRegularFont).href;
  const boldFontUrl = pathToFileURL(chineseBoldFont).href;
  const printStyles = `
    <style>
      @font-face {
        font-family: 'Noto Sans SC';
        src: url('${regularFontUrl}') format('woff');
        font-weight: 400;
        font-style: normal;
      }

      @font-face {
        font-family: 'Noto Sans SC';
        src: url('${boldFontUrl}') format('woff');
        font-weight: 700;
        font-style: normal;
      }

      html, body {
        background: #ffffff !important;
      }

      body {
        font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif !important;
        color: #1f2937 !important;
      }

      @page {
        size: A4;
        margin: 10mm 10mm;
      }

      @media print {
        html, body {
          background: #ffffff !important;
        }

        body {
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        table {
          page-break-inside: auto;
        }

        tr, td, th {
          page-break-inside: avoid;
          page-break-after: auto;
        }
      }
    </style>
  `;

  const withTitle = html.replace(
    /<title>.*?<\/title>/i,
    `<title>${escapeHtml(pdfTitle)}</title>`,
  );

  if (withTitle.includes("</head>")) {
    return withTitle.replace("</head>", `${printStyles}</head>`);
  }

  return `${printStyles}${withTitle}`;
}

export async function renderMarkdownReportToPdf(args: {
  htmlPath: string;
  outputPath: string;
  pdfTitle: string;
  reportDate: string;
}): Promise<void> {
  await mkdir(path.dirname(args.outputPath), { recursive: true });
  const html = await readFile(args.htmlPath, "utf8");
  const injectedHtml = injectPdfStyles(html, args.pdfTitle);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });

  try {
    const page = await browser.newPage({
      viewport: {
        width: 1280,
        height: 1800,
      },
    });

    await page.setContent(injectedHtml, { waitUntil: "load" });
    await page.emulateMedia({ media: "print" });
    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
    });

    await page.pdf({
      path: args.outputPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    });
  } finally {
    await browser.close();
  }
}
