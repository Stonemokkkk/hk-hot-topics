import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone, timedelta
import xml.etree.ElementTree as ET

HKT = timezone(timedelta(hours=8))

QUERIES = [
    "東張西望",
    "連登 熱話",
    "香港 熱門話題",
]

def scrape_google_news() -> list[dict]:
    """Scrape hot topics from Google News RSS."""
    results = []

    for query in QUERIES:
        url = f"https://news.google.com/rss/search?q={query}&hl=zh-HK&gl=HK&ceid=HK:zh-Hant"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept-Language": "zh-HK,zh;q=0.9,en;q=0.8"
        }

        try:
            resp = requests.get(url, headers=headers, timeout=10)
            resp.raise_for_status()

            root = ET.fromstring(resp.content)
            items = root.findall(".//item")[:5]  # Top 5 per query

            for item in items:
                title = item.find("title")
                link = item.find("link")
                pub_date = item.find("pubDate")

                if title is None:
                    continue

                results.append({
                    "keyword": title.text.strip(),
                    "source": "google_news",
                    "url": link.text.strip() if link is not None else "",
                    "timestamp": datetime.now(HKT).isoformat(),
                    "extra": {
                        "query": query,
                        "pub_date": pub_date.text if pub_date is not None else ""
                    }
                })
        except Exception as e:
            print(f"[WARN] Google News query '{query}' failed: {e}")
            continue

    return results
