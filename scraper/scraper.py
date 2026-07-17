#!/usr/bin/env python3
"""Main scraper orchestrator - collects hot topics from all sources."""

import json
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from scraper.sources import scrape_baby_kingdom, scrape_google_news, scrape_google_trends

HKT = timezone(timedelta(hours=8))
BACKUP_TOPICS = [
    {"keyword": "香港美食", "source": "backup", "url": "", "timestamp": "", "extra": {}},
    {"keyword": "香港景點", "source": "backup", "url": "", "timestamp": "", "extra": {}},
    {"keyword": "香港天氣", "source": "backup", "url": "", "timestamp": "", "extra": {}},
    {"keyword": "香港交通", "source": "backup", "url": "", "timestamp": "", "extra": {}},
]

def main():
    today = datetime.now(HKT).strftime("%Y-%m-%d")
    output_dir = Path(__file__).parent.parent / "data"
    output_dir.mkdir(exist_ok=True)

    sources = [
        ("baby_kingdom", scrape_baby_kingdom),
        ("google_news", scrape_google_news),
        ("google_trends", scrape_google_trends),
    ]

    results = []
    errors = []

    for name, func in sources:
        try:
            print(f"[INFO] Scraping {name}...")
            topics = func()
            print(f"[INFO] {name}: found {len(topics)} topics")
            results.extend(topics)
        except Exception as e:
            error_msg = f"[ERROR] {name} failed: {e}"
            print(error_msg)
            errors.append(error_msg)
            continue

    # Use backup if all sources failed
    if not results:
        print("[WARN] All sources failed, using backup topics")
        results = BACKUP_TOPICS

    # Write output
    output_data = {
        "date": today,
        "trends": results,
        "errors": errors
    }

    output_file = output_dir / f"trends_{today}.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"[INFO] Saved {len(results)} topics to {output_file}")
    return output_file

def scrape_to_json(sources: list[str]) -> dict:
    """Scrape and return JSON to stdout (for serverless)."""
    today = datetime.now(HKT).strftime("%Y-%m-%d")

    source_map = {
        "baby_kingdom": scrape_baby_kingdom,
        "google_news": scrape_google_news,
        "google_trends": scrape_google_trends,
    }

    results = []
    errors = []

    for name in sources:
        if name not in source_map:
            continue
        try:
            topics = source_map[name]()
            results.extend(topics)
        except Exception as e:
            errors.append(f"{name}: {e}")

    return {"date": today, "trends": results, "errors": errors}

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--json":
        # JSON mode: scrape specified sources
        sources = sys.argv[2:] if len(sys.argv) > 2 else ["baby_kingdom", "google_news", "google_trends"]
        result = scrape_to_json(sources)
        print(json.dumps(result, ensure_ascii=False))
    else:
        main()
