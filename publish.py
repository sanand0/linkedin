from __future__ import annotations

import csv
import html
import tomllib
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import datetime
from pathlib import Path

CONFIG_PATH = Path("config.toml")
SHARES_CSV = Path("Shares.csv")
COMMENTS_CSV = Path("Comments.csv")


def load_config() -> dict:
    with CONFIG_PATH.open("rb") as f:
        return tomllib.load(f)


def parse_rows(path: Path, date_col: str, text_col: str, link_col: str) -> list[dict]:
    items: list[dict] = []
    with path.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            date_val = row.get(date_col, "").strip()
            if not date_val:
                continue
            try:
                dt = datetime.strptime(date_val, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                continue
            items.append({
                "date": dt,
                "text": row.get(text_col, "").strip(),
                "link": row.get(link_col, "").strip(),
            })
    return items


def group_months(items: list[dict]) -> dict[str, list[dict]]:
    months: dict[str, list[dict]] = defaultdict(list)
    for it in items:
        months[it["date"].strftime("%Y-%m")].append(it)
    for lst in months.values():
        lst.sort(key=lambda x: x["date"], reverse=True)
    return dict(sorted(months.items(), reverse=True))


def header(title: str) -> str:
    return f"""<!doctype html>
<html lang='en'>
<head>
<meta charset='utf-8'>
<meta name='viewport' content='width=device-width,initial-scale=1'>
<link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/css/bootstrap.min.css'>
<link rel='stylesheet' href='style.css'>
<title>{html.escape(title)}</title>
</head>
<body>
"""


def footer() -> str:
    return "</body>\n</html>\n"


def write_month(month: str, entries: list[dict], title: str) -> None:
    parts = [header(title), "<div class='container py-4'>", f"<h1 class='mb-4'>{month}</h1>"]
    for e in entries:
        ts = e["date"].strftime("%Y-%m-%d %H:%M")
        text = html.escape(e["text"]).replace("\n", "<br>")
        parts.append(
            f"<div class='card mb-3'><div class='card-body'>"
            f"<h6 class='card-subtitle mb-2 text-body-secondary'>{ts}</h6>"
            f"<p class='card-text'>{text}</p>"
            f"<a href='{e['link']}' class='card-link'>Original</a>"
            f"</div></div>"
        )
    parts.append("<p><a href='index.html'>Index</a></p></div>")
    parts.append(footer())
    Path(f"{month}.html").write_text("".join(parts), encoding="utf-8")


def write_index(groups: dict[str, list[dict]], title: str) -> None:
    links = [f"<li class='list-group-item'><a href='{m}.html'>{m}</a></li>" for m in groups]
    body = (
        f"<div class='container py-4'><h1 class='mb-4'>{title}</h1>"
        f"<ul class='list-group mb-4'>{''.join(links)}</ul>"
        f"<a href='rss.xml' class='btn btn-primary'>RSS feed</a></div>"
    )
    Path("index.html").write_text(header(title) + body + footer(), encoding="utf-8")


def write_rss(items: list[dict], cfg: dict) -> None:
    root = ET.Element("rss", version="2.0")
    channel = ET.SubElement(root, "channel")
    ET.SubElement(channel, "title").text = cfg["title"]
    ET.SubElement(channel, "link").text = cfg.get("link", "")
    ET.SubElement(channel, "description").text = "LinkedIn archive"
    for e in sorted(items, key=lambda x: x["date"], reverse=True):
        it = ET.SubElement(channel, "item")
        ET.SubElement(it, "title").text = e["text"][:50]
        ET.SubElement(it, "link").text = e["link"]
        ET.SubElement(it, "guid").text = e["link"]
        ET.SubElement(it, "pubDate").text = e["date"].strftime("%a, %d %b %Y %H:%M:%S +0000")
        ET.SubElement(it, "description").text = e["text"]
    ET.ElementTree(root).write("rss.xml", encoding="utf-8", xml_declaration=True)


def main() -> None:
    cfg = load_config()
    posts = parse_rows(SHARES_CSV, "Date", "ShareCommentary", "ShareLink")
    comments = parse_rows(COMMENTS_CSV, "Date", "Message", "Link")
    items = posts + comments
    groups = group_months(items)
    write_index(groups, cfg["title"])
    for m, ent in groups.items():
        write_month(m, ent, cfg["title"])
    write_rss(items, cfg)


if __name__ == "__main__":
    main()
