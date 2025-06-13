import { readFileSync, writeFileSync, existsSync } from "fs";

const parseCSV = (content) => {
  const result = [];
  const lines = content.split("\n");
  const headers = lines[0].split(",");

  let currentRecord = [];
  let currentField = "";
  let inQuotes = false;
  let recordStarted = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = line[j + 1];

      if (char === '"' && !inQuotes) {
        inQuotes = true;
        recordStarted = true;
      } else if (char === '"' && inQuotes) {
        if (nextChar === '"') {
          currentField += '"';
          j++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else if (char === "," && !inQuotes) {
        currentRecord.push(currentField);
        currentField = "";
      } else {
        currentField += char;
        if (!recordStarted && char !== " ") recordStarted = true;
      }
    }

    if (!inQuotes && recordStarted) {
      currentRecord.push(currentField);
      if (currentRecord.length === headers.length) {
        result.push(headers.reduce((obj, header, idx) => ({ ...obj, [header]: currentRecord[idx] || "" }), {}));
        currentRecord = [];
      }
      currentField = "";
      recordStarted = false;
    } else if (inQuotes) {
      currentField += "\n";
    }
  }

  return result;
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getMonthKey = (dateStr) => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const generateHTML = (title, content) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container py-4">
    ${content}
  </div>
</body>
</html>`;

const processData = () => {
  const shares = existsSync("Shares.csv") ? parseCSV(readFileSync("Shares.csv", "utf8")) : [];
  const comments = existsSync("Comments.csv") ? parseCSV(readFileSync("Comments.csv", "utf8")) : [];

  const allPosts = [
    ...shares.map((s) => ({ ...s, type: "share", date: s.Date })),
    ...comments.map((c) => ({ ...c, type: "comment", date: c.Date })),
  ]
    .filter((post) => post.date && !isNaN(new Date(post.date)))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const monthGroups = allPosts.reduce((groups, post) => {
    const monthKey = getMonthKey(post.date);
    if (!groups[monthKey]) groups[monthKey] = [];
    groups[monthKey].push(post);
    return groups;
  }, {});

  // Generate monthly HTML files
  Object.entries(monthGroups).forEach(([monthKey, posts]) => {
    const [year, month] = monthKey.split("-");
    const monthName = new Date(year, month - 1).toLocaleDateString("en-US", { year: "numeric", month: "long" });

    const postsHTML = posts
      .map((post) => {
        if (post.type === "share") {
          return `
          <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span class="badge bg-primary">Share</span>
              <small class="text-muted">${formatDate(post.date)}</small>
            </div>
            <div class="card-body">
              <div class="post-content">${post.ShareCommentary?.replace(/\n/g, "<br>") || ""}</div>
              ${post.SharedUrl ? `<div class="mt-3"><a href="${post.SharedUrl}" class="btn btn-outline-secondary btn-sm" target="_blank">Shared Link</a></div>` : ""}
              <div class="mt-3">
                <a href="${post.ShareLink}" class="btn btn-sm btn-primary" target="_blank">View on LinkedIn</a>
              </div>
            </div>
          </div>`;
        } else {
          return `
          <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span class="badge bg-success">Comment</span>
              <small class="text-muted">${formatDate(post.date)}</small>
            </div>
            <div class="card-body">
              <div class="post-content">${post.Message?.replace(/\n/g, "<br>") || ""}</div>
              <div class="mt-3">
                <a href="${post.Link}" class="btn btn-sm btn-success" target="_blank">View on LinkedIn</a>
              </div>
            </div>
          </div>`;
        }
      })
      .join("");

    const monthHTML = `
      <nav class="mb-4">
        <a href="index.html" class="btn btn-outline-secondary">&larr; Back to Index</a>
      </nav>
      <h1 class="mb-4">${monthName}</h1>
      ${postsHTML}`;

    writeFileSync(`${monthKey}.html`, generateHTML(`${monthName} - LinkedIn Archive`, monthHTML));
  });

  // Generate index.html
  const monthLinks = Object.keys(monthGroups)
    .sort((a, b) => b.localeCompare(a))
    .map((monthKey) => {
      const [year, month] = monthKey.split("-");
      const monthName = new Date(year, month - 1).toLocaleDateString("en-US", { year: "numeric", month: "long" });
      const postCount = monthGroups[monthKey].length;
      const shareCount = monthGroups[monthKey].filter((p) => p.type === "share").length;
      const commentCount = monthGroups[monthKey].filter((p) => p.type === "comment").length;

      return `
        <div class="col-md-6 col-lg-4 mb-3">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">${monthName}</h5>
              <p class="card-text">
                <span class="badge bg-primary me-2">${shareCount} shares</span>
                <span class="badge bg-success">${commentCount} comments</span>
              </p>
              <a href="${monthKey}.html" class="btn btn-primary">View Posts</a>
            </div>
          </div>
        </div>`;
    })
    .join("");

  const indexHTML = `
    <div class="text-center mb-5">
      <h1 class="display-4">LinkedIn Archive</h1>
      <p class="lead">My LinkedIn posts and comments, organized by month</p>
    </div>
    <div class="row g-3">
      ${monthLinks}
    </div>`;

  writeFileSync("index.html", generateHTML("LinkedIn Archive", indexHTML));

  // Generate RSS feed
  const rssItems = allPosts
    .slice(0, 20)
    .map((post) => {
      const title = post.type === "share" ? "LinkedIn Share" : "LinkedIn Comment";
      const content = post.type === "share" ? post.ShareCommentary : post.Message;
      const link = post.type === "share" ? post.ShareLink : post.Link;
      const pubDate = new Date(post.date).toUTCString();

      return `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description><![CDATA[${content?.replace(/\n/g, "<br>") || ""}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid>${link}</guid>
    </item>`;
    })
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>LinkedIn Archive</title>
    <description>My LinkedIn posts and comments</description>
    <link>.</link>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${rssItems}
  </channel>
</rss>`;

  writeFileSync("feed.xml", rss);

  console.log(`Generated ${Object.keys(monthGroups).length} monthly pages and RSS feed`);
};

processData();
