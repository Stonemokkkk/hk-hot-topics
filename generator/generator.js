#!/usr/bin/env node
/**
 * LLM Generator - reads trends JSON and generates HTML tool via OpenRouter API
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

async function loadConfig() {
  const configPath = path.join(ROOT_DIR, 'config.json');
  const config = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(config);
}

async function loadTrends(date) {
  const trendsPath = path.join(ROOT_DIR, 'data', `trends_${date}.json`);
  const trends = await fs.readFile(trendsPath, 'utf-8');
  return JSON.parse(trends);
}

async function loadPromptTemplate() {
  const promptPath = path.join(__dirname, 'prompts', 'tool_creator.txt');
  return await fs.readFile(promptPath, 'utf-8');
}

function formatTrendsList(trends) {
  return trends
    .sort((a, b) => (b.extra?.replies || 0) - (a.extra?.replies || 0))
    .slice(0, 5)
    .map((t, i) => `${i + 1}. ${t.keyword} (source: ${t.source}, replies: ${t.extra?.replies || 0})`)
    .join('\n');
}

async function callLLM(prompt, config) {
  const response = await fetch(`${config.openrouter.base_url}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.openrouter.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function saveHTML(html, date, config) {
  const outputDir = path.join(ROOT_DIR, 'output');
  await fs.mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `${date}.html`);
  await fs.writeFile(outputPath, html, 'utf-8');

  console.log(`[INFO] Saved HTML to ${outputPath}`);
  return outputPath;
}

async function main() {
  const today = new Date().toISOString().split('T')[0];

  try {
    console.log(`[INFO] Generating tool for ${today}...`);

    const config = await loadConfig();
    const trendsData = await loadTrends(today);
    const promptTemplate = await loadPromptTemplate();

    // Format trends list for prompt
    const trendsList = formatTrendsList(trendsData.trends);
    const prompt = promptTemplate.replace('{trends_list}', trendsList);

    console.log('[INFO] Calling LLM API...');
    const html = await callLLM(prompt, config);

    // Clean up HTML if wrapped in markdown code block
    const cleanedHtml = html.replace(/^```html\n?/, '').replace(/\n?```$/, '');

    await saveHTML(cleanedHtml, today, config);

    console.log('[INFO] Generation complete!');
  } catch (error) {
    console.error(`[ERROR] Generation failed: ${error.message}`);
    process.exit(1);
  }
}

main();
