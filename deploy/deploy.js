#!/usr/bin/env node
/**
 * Deploy script - copies generated HTML to web server directory and GitHub Pages
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

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

async function deployToGitHubPages(date, config) {
  const tempDir = path.join(ROOT_DIR, '.gh-pages-temp');

  try {
    // Create temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });

    // Copy today's HTML
    const srcPath = path.join(ROOT_DIR, 'output', `${date}.html`);
    await fs.copyFile(srcPath, path.join(tempDir, `${date}.html`));

    // Copy or create index.html
    const indexSrc = path.join(config.deploy.output_dir, 'index.html');
    try {
      await fs.copyFile(indexSrc, path.join(tempDir, 'index.html'));
    } catch {
      // Create simple index if not exists
      const simpleIndex = `<!DOCTYPE html>
<html lang="zh-HK">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>香港每日熱話小工具</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow: hidden; }
    header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; }
    h1 { font-size: 28px; margin-bottom: 10px; }
    .tools-list { list-style: none; padding: 20px; }
    .tools-list li { padding: 15px; margin: 10px 0; background: #f8f9fa; border-radius: 8px; }
    .tools-list a { color: #333; text-decoration: none; font-size: 18px; font-weight: 500; }
    .tools-list .date { color: #666; font-size: 14px; margin-top: 5px; }
    footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🇭🇰 香港每日熱話小工具</h1>
      <p class="subtitle">每日自動生成嘅互動小工具</p>
    </header>
    <ul class="tools-list">
      <li>
        <a href="${date}.html">${date} 熱話小工具</a>
        <div class="date">${date}</div>
      </li>
    </ul>
    <footer>
      <p>自動生成 by HK Hot Topics Bot</p>
    </footer>
  </div>
</body>
</html>`;
      await fs.writeFile(path.join(tempDir, 'index.html'), simpleIndex, 'utf-8');
    }

    // Git operations
    execSync('git checkout --orphan gh-pages', { cwd: ROOT_DIR, stdio: 'pipe' });
    execSync('git rm -rf . 2>/dev/null || true', { cwd: ROOT_DIR, stdio: 'pipe' });

    // Move temp files to root
    const files = await fs.readdir(tempDir);
    for (const file of files) {
      await fs.rename(path.join(tempDir, file), path.join(ROOT_DIR, file));
    }

    execSync('git add .', { cwd: ROOT_DIR, stdio: 'pipe' });
    execSync(`git commit -m "Deploy ${date} hot topics tool"`, { cwd: ROOT_DIR, stdio: 'pipe' });
    execSync('git push origin gh-pages --force', { cwd: ROOT_DIR, stdio: 'pipe' });

    // Switch back to master
    execSync('git checkout master', { cwd: ROOT_DIR, stdio: 'pipe' });
    execSync('git branch -D gh-pages 2>/dev/null || true', { cwd: ROOT_DIR, stdio: 'pipe' });

    console.log('[INFO] Deployed to GitHub Pages');
  } finally {
    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
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

    // Deploy to GitHub Pages
    await deployToGitHubPages(today, config);

    console.log('[INFO] Deploy complete!');
  } catch (error) {
    console.error(`[ERROR] Deploy failed: ${error.message}`);
    process.exit(1);
  }
}

main();
