#!/usr/bin/env tsx
/**
 * Tavily Search API 测试脚本
 * 
 * 快速验证 Tavily API 是否配置正确
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const TEST_QUERY = "OpenAI latest news 2026";

interface TavilySearchResponse {
  query: string;
  results: Array<{
    title: string;
    url: string;
    content: string;
    raw_content?: string;
    score: number;
  }>;
  answer?: string;
  response_time: number;
}

async function testTavily(): Promise<void> {
  const apiKey = process.env.TAVILY_API_KEY;
  
  if (!apiKey) {
    console.error("❌ 未找到 TAVILY_API_KEY 环境变量");
    console.error("\n请配置:");
    console.error("  export TAVILY_API_KEY=tvly-xxxxx");
    console.error("\n或创建 .env.local 文件:");
    console.error("  echo 'TAVILY_API_KEY=tvly-xxxxx' > .env.local");
    process.exit(1);
  }
  
  console.log("🧪 测试 Tavily Search API");
  console.log(`🔑 API Key: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`);
  console.log(`🔍 测试查询: "${TEST_QUERY}"`);
  console.log("");
  
  try {
    const startTime = Date.now();
    
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: TEST_QUERY,
        search_depth: "advanced",
        include_answer: true,
        include_raw_content: true,
        max_results: 5,
        time_range: "week",
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    const data: TavilySearchResponse = await response.json();
    const totalTime = Date.now() - startTime;
    
    console.log(`✅ API 调用成功 (${totalTime}ms)`);
    console.log(`📊 返回结果: ${data.results.length} 条`);
    console.log(`⏱️  Tavily 响应时间: ${(data.response_time * 1000).toFixed(0)}ms`);
    
    if (data.answer) {
      console.log("\n🤖 AI 直接回答:");
      console.log(`   ${data.answer.slice(0, 150)}${data.answer.length > 150 ? "..." : ""}`);
    }
    
    console.log("\n📰 搜索结果摘要:");
    for (let i = 0; i < Math.min(3, data.results.length); i++) {
      const result = data.results[i];
      console.log(`\n  ${i + 1}. ${result.title}`);
      console.log(`     URL: ${result.url.slice(0, 60)}...`);
      console.log(`     相关度: ${(result.score * 100).toFixed(1)}%`);
      console.log(`     摘要: ${result.content.slice(0, 80)}...`);
      if (result.raw_content) {
        console.log(`     原始内容: ✓ (${result.raw_content.length} 字符)`);
      }
    }
    
    console.log("\n✨ 测试通过！可以运行:");
    console.log("   npm run fetch:tavily");
    
  } catch (error) {
    console.error("\n❌ 测试失败:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

testTavily();
