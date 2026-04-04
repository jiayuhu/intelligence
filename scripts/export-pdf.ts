import { intelTitles } from "../titles/intel-titles.js";

function main(): void {
  const title = intelTitles.industry;
  console.log(`这里将把 ${title.fileTitle} 导出为 PDF。`);
  console.log("后续可接入 PDF 渲染工具或浏览器导出流程。");
}

main();
