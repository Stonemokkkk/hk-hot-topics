#!/usr/bin/env node
/**
 * Deploy script - copies generated HTML to web server directory
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

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function copyHTML(date, config) {
  const srcPath = path.join(ROOT_DIR, 'output', `${date}.html`);
  const destPath = path.join(config.deploy.output_dir, `${date}.html`);

  await fs.copyFile(srcPath, destPath);
  console.log(`[INFO] Copied ${date}.html to ${config.deploy.output_dir}`);
  return destPath;
}

async function updateIndex(date, config) {
  const indexPath = path.join(config.deploy.output_dir, 'index.html');
  const templatePath = path.join(__dirname, 'templates', 'index.html');

  let indexContent;
  try {
    indexContent = await fs.readFile(indexPath, 'utf-8');
  } catch {
    // Index doesn't exist, create from template
    indexContent = await fs.readFile(templatePath, 'utf-8');
  }

  // Add new tool link to top of list
  const newLink = `
      <li>
        <a href="${date}.html">${date} 熱話小工具</a>
        <div class="date">${date}</div>
      </li>`;

  // Insert after <ul class="tools-list">
  indexContent = indexContent.replace(
    /(<ul class="tools-list">)/,
    `$1${newLink}`
  );

  await fs.writeFile(indexPath, indexContent, 'utf-8');
  console.log(`[INFO] Updated index.html with ${date} link`);
}

async function cleanupOldTools(config) {
  const outputDir = config.deploy.output_dir;
  const files = await fs.readdir(outputDir);
  const htmlFiles = files
    .filter(f => f.endsWith('.html') && f !== 'index.html')
    .sort();

  while (htmlFiles.length > config.deploy.max_tools) {
    const oldest = htmlFiles.shift();
    await fs.unlink(path.join(outputDir, oldest));
    console.log(`[INFO] Cleaned up old tool: ${oldest}`);
  }
}

async function main() {
  const today = new Date().toISOString().split('T')[0];

  try {
    console.log(`[INFO] Deploying tool for ${today}...`);

    const config = await loadConfig();

    // Ensure output directory exists
    await ensureDir(config.deploy.output_dir);

    // Copy HTML
    await copyHTML(today, config);

    // Update index page
    await updateIndex(today, config);

    // Cleanup old tools
    await cleanupOldTools(config);

    console.log('[INFO] Deploy complete!');
  } catch (error) {
    console.error(`[ERROR] Deploy failed: ${error.message}`);
    process.exit(1);
  }
}

main();
