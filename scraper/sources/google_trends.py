import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone, timedelta
import xml.etree.ElementTree as ET

HKT = timezone(timedelta(hours=8))

def scrape_google_trends_rss() -> list[dict]:
    """Try Google Trends RSS endpoint."""
    url = "https://trends.google.com/trending/rss?geo=HK"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "zh-HK,zh;q=0.9,en;q=0.8",
        "Accept": "application/rss+xml,application/xml,text/xml"
    }

    resp = requests.get(url, headers=headers, timeout=10)
    resp.raise_for_status()

    root = ET.fromstring(resp.content)
    items = root.findall(".//item")
    results = []

    for item in items[:20]:
        title = item.find("title")
        link = item.find("link")
        pub_date = item.find("pubDate")

        if title is None:
            continue

        results.append({
            "keyword": title.text.strip(),
            "source": "google_trends",
            "url": link.text.strip() if link is not None else "",
            "timestamp": datetime.now(HKT).isoformat(),
            "extra": {
                "pub_date": pub_date.text if pub_date is not None else ""
            }
        })

    return results

def scrape_google_trends_pytrends() -> list[dict]:
    """Fallback: use pytrends library."""
    try:
        from pytrends.request import TrendReq
        pytrends = TrendReq(hl='zh-HK', tz=480)
        pytrends.build_graph(['香港'], timeframe='now 1-d')

        # Get related queries
        related = pytrends.related_queries()
        results = []

        for keyword, data in related.items():
            if data['rising'] is not None:
                for _, row in data['rising'].head(10).iterrows():
                    results.append({
                        "keyword": row['query'],
                        "source": "google_trends",
                        "url": "",
                        "timestamp": datetime.now(HKT).isoformat(),
                        "extra": {
                            "value": int(row['value']) if 'value' in row else 0
                        }
                    })

        return results
    except ImportError:
        print("[WARN] pytrends not installed, skipping fallback")
        return []
    except Exception as e:
        print(f"[WARN] pytrends failed: {e}")
        return []

def scrape_google_trends() -> list[dict]:
    """Scrape Google Trends with RSS first, pytrends fallback."""
    try:
        return scrape_google_trends_rss()
    except Exception as e:
        print(f"[WARN] Google Trends RSS failed: {e}, trying pytrends")
        return scrape_google_trends_pytrends()
