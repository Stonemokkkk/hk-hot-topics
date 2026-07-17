import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone, timedelta

HKT = timezone(timedelta(hours=8))

def scrape_baby_kingdom() -> list[dict]:
    """Scrape hot topics from Baby Kingdom forum."""
    url = "https://www.baby-kingdom.com/forum.php?mod=forumdisplay&fid=162&filter=heat&orderby=heats"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "zh-HK,zh;q=0.9,en;q=0.8"
    }

    resp = requests.get(url, headers=headers, timeout=10)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "lxml")
    results = []

    # Find thread list items
    threads = soup.select("tbody[id^='normalthread_']")
    for thread in threads[:20]:  # Limit to top 20
        title_elem = thread.select_one("a.s.xst")
        if not title_elem:
            continue

        keyword = title_elem.get_text(strip=True)
        thread_url = title_elem.get("href", "")

        # Extract reply count
        reply_elem = thread.select_one("td.num a")
        replies = int(reply_elem.get_text(strip=True)) if reply_elem else 0

        # Extract view count
        view_elem = thread.select_one("td.num em")
        views = int(view_elem.get_text(strip=True)) if view_elem else 0

        # Check for hot level indicator
        hot_img = thread.select_one("img[alt*='熱']")
        hot_level = 2 if hot_img else 0

        results.append({
            "keyword": keyword,
            "source": "baby_kingdom",
            "url": thread_url,
            "timestamp": datetime.now(HKT).isoformat(),
            "extra": {
                "replies": replies,
                "views": views,
                "hot_level": hot_level
            }
        })

    return results
