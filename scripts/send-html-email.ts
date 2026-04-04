import { intelTitles } from "../titles/intel-titles.js";

function main(): void {
  const title = intelTitles.industry;
  const reportDate = new Date().toISOString().slice(0, 10);
  console.log(`这里将根据 ${title.emailSubject} 发送 HTML 电子邮件。`);
  console.log(`邮件正文模板：templates/email.html`);
  console.log(`发送日期：${reportDate}`);
}

main();
