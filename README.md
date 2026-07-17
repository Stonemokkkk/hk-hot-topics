# HK Daily Hot Topics → Auto-Generated Web Tools

🔥 每日自動收集香港熱門話題，用 AI 生成互動小工具

## 功能

- ✅ 自動收集 Baby Kingdom、Google News、Google Trends 熱話
- ✅ 用 LLM (OpenRouter) 生成互動 HTML 小工具
- ✅ 自動部署到 Nginx
- ✅ 每日凌晨 3 點自動執行
- ✅ 容錯機制：某個 source 失敗唔影響其他

## 快速開始

### 1. 安裝依賴

```bash
# Python dependencies
pip install -r scraper/requirements.txt

# Node.js (already included in package.json)
cd generator && npm install
```

### 2. 配置 API Key

```bash
cp .env.example .env
# Edit .env and add your OpenRouter API token
```

### 3. 安裝 Nginx

```bash
./deploy/install_nginx.sh
```

### 4. 設定 Cron

```bash
./deploy/setup_cron.sh
```

### 5. 測試執行

```bash
./main.sh
```

## 手動執行

```bash
# 只跑 scraper
python -m scraper.scraper

# 只跑 generator
node generator/generator.js

# 只跑 deploy
node deploy/deploy.js
```

## 目錄結構

```
hk-hot-topics/
├── main.sh                    # 主入口 script
├── scraper/                   # Python scraper
├── generator/                 # Node.js LLM generator
├── deploy/                    # Deploy scripts + Nginx config
├── data/                      # 每日 trend JSON
├── output/                    # 生成嘅 HTML
├── logs/                      # Log files
└── config.json                # 配置文件
```

## 配置

編輯 `config.json`:

```json
{
  "openrouter": {
    "base_url": "https://openrouter.ai/api",
    "model": "xiaomi/mimo-v2.5"
  },
  "deploy": {
    "output_dir": "/var/www/hk-tools",
    "max_tools": 30
  },
  "schedule": {
    "cron": "0 3 * * *"
  }
}
```

## Log Files

- `logs/pipeline_YYYY-MM-DD.log` - 完整 pipeline 執行紀錄
- `logs/scraper.log` - Scraper 執行紀錄
- `logs/generator.log` - LLM call 紀錄
- `logs/cron.log` - Cron 執行紀錄

## 故障排除

### Scraper 失敗

檢查 `logs/scraper.log`，常見原因：
- Network timeout → 檢查 network 連接
- Website 改版 → 需要更新 scraper code

### LLM Generator 失敗

檢查 `logs/generator.log`，常見原因：
- API token 過期 → 更新 `.env`
- API quota 用完 → 等待或升級 plan

### Deploy 失敗

檢查 `logs/deploy.log`，常見原因：
- 權限不足 → 檢查 `/var/www/hk-tools/` 權限
- Nginx 未運行 → `sudo systemctl start nginx`

## License

MIT
