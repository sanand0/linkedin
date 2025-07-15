import { readFileSync, writeFileSync, existsSync } from "fs";
import { parse } from "csv-parse/sync";

const autolinkURLs = text =>
  text?.replace(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g, url => `<a href="${url}" target="_blank">${url}</a>`) || "";

const cleanContent = content =>
  autolinkURLs(content?.replace(/\n/g, "<br>").trim());

const parseCSV = (file) => {
  if (!existsSync(file)) return [];

  const data = parse(readFileSync(file, "utf8"), {
    columns: true,
    escape: '"',
    quote: '"',
    relax_quotes: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  // Post-process to clean up extra quotes in ShareCommentary and Message fields
  return data.map((row) => ({
    ...row,
    ShareCommentary: row.ShareCommentary?.replace(/^"+|"+$/gm, "") || row.ShareCommentary,
    Message: row.Message?.replace(/^"+|"+$/g, "").replace(/\\"/g, '"') || row.Message,
  }));
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const generateHTML = (title, content, isIndex = false) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>a:not([href^='http']) code { color: var(--bs-danger); }</style>
</head>
<body class="bg-light">
  <header class="text-bg-warning py-5 mb-4">
    <div class="container text-center">
      <h1 class="display-4 fw-bold"><a href="index.html" class="text-decoration-none text-dark">Anand's LinkedIn Archive</a></h1>
      <p class="lead mb-0"><a class="link-dark link-offset-3" href="https://linkedin.com/in/sanand0">LinkedIn Profile</a></p>
    </div>
  </header>
  <div class="container py-4" style="max-width: 40rem;">${content}</div>
  ${isIndex ? `<footer class="text-center mb-4"><a href="feed.xml" class="btn btn-outline-secondary btn-sm"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-rss-fill mb-1" viewBox="0 0 16 16"><path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm1.5 2.5c5.523 0 10 4.477 10 10a1 1 0 1 1-2 0 8 8 0 0 0-8-8 1 1 0 0 1 0-2zm0 4a6 6 0 0 1 6 6 1 1 0 1 1-2 0 4 4 0 0 0-4-4 1 1 0 0 1 0-2zm.5 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg> Subscribe to RSS</a></footer>` : ""}
</body>
</html>`;

const allPosts = [
  ...parseCSV("Shares.csv").map((s) => ({ ...s, type: "share", date: s.Date })),
  ...parseCSV("Comments.csv").map((c) => ({ ...c, type: "comment", date: c.Date })),
]
  .filter((post) => post.date && !isNaN(new Date(post.date)))
  .sort((a, b) => new Date(b.date) - new Date(a.date));

// Group by year, split to months if >40 posts
const yearGroups = allPosts.reduce((groups, post) => {
  const year = new Date(post.date).getFullYear().toString();
  (groups[year] ||= []).push(post);
  return groups;
}, {});

const finalGroups = {};
Object.entries(yearGroups).forEach(([year, posts]) => {
  if (posts.length < 40) finalGroups[year] = posts;
  else {
    posts.forEach((post) => {
      const monthKey = `${new Date(post.date).getFullYear()}-${String(new Date(post.date).getMonth() + 1).padStart(2, "0")}`;
      (finalGroups[monthKey] ||= []).push(post);
    });
  }
});

// Generate group pages
Object.entries(finalGroups).forEach(([groupKey, posts]) => {
  const isYear = groupKey.length === 4;
  const title = isYear
    ? groupKey
    : new Date(groupKey + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" });

  const postsHTML = posts
    .map((post) => {
      const isShare = post.type === "share";
      const link = isShare ? post.ShareLink : post.Link;
      const content = cleanContent(isShare ? post.ShareCommentary : post.Message);

      return `<div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <div>
            <a href="${link}" target="_blank" class="text-decoration-none">
              <span class="badge ${isShare ? "bg-primary" : "bg-success"} me-2">${isShare ? "Share" : "Comment"}</span>
              <small class="text-muted">${formatDate(post.date)}</small>
            </a>
          </div>
          <a href="${link}" class="btn btn-sm ${isShare ? "btn-primary" : "btn-success"}" target="_blank">View on LinkedIn</a>
        </div>
        <div class="card-body">
          <div class="post-content">${content}</div>
          ${isShare && post.SharedUrl ? `<div class="mt-3"><a href="${post.SharedUrl}" class="btn btn-outline-secondary btn-sm" target="_blank">Shared Link</a></div>` : ""}
        </div>
      </div>`;
    })
    .join("");

  writeFileSync(
    `${groupKey}.html`,
    generateHTML(`${title} - Anand's LinkedIn Archive`, `<h1 class="mb-4">${title}</h1>${postsHTML}`),
  );
});

// Generate index
const indexHTML = Object.keys(finalGroups)
  .sort((a, b) => b.localeCompare(a))
  .map((groupKey) => {
    const isYear = groupKey.length === 4;
    const title = isYear
      ? groupKey
      : new Date(groupKey + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" });
    const posts = finalGroups[groupKey];
    const shareCount = posts.filter((p) => p.type === "share").length;
    const commentCount = posts.filter((p) => p.type === "comment").length;

    return `<a href="${groupKey}.html" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
      <div>
        <h2 class="h5 my-2">${title}</h2>
        <div>
          <span class="badge bg-primary me-2">${shareCount} shares</span>
          <span class="badge bg-success">${commentCount} comments</span>
        </div>
      </div>
      <span class="text-muted">→</span>
    </a>`;
  })
  .join("");

writeFileSync(
  "index.html",
  generateHTML("Anand's LinkedIn Archive", `<div class="list-group">${indexHTML}</div>`, true),
);

// Generate RSS
const rssItems = allPosts
  .slice(0, 20)
  .map((post) => {
    const title = post.type === "share" ? "LinkedIn Share" : "LinkedIn Comment";
    const content = post.type === "share" ? post.ShareCommentary : post.Message;
    const link = post.type === "share" ? post.ShareLink : post.Link;
    return `<item><title>${title}</title><link>${link}</link><description><![CDATA[${content?.replace(/\n/g, "<br>") || ""}]]></description><pubDate>${new Date(post.date).toUTCString()}</pubDate><guid>${link}</guid></item>`;
  })
  .join("");

writeFileSync(
  "feed.xml",
  `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Anand's LinkedIn Archive</title><description>My LinkedIn posts and comments</description><link>.</link><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${rssItems}</channel></rss>`,
);

console.log(`Generated ${Object.keys(finalGroups).length} group pages and RSS feed`);
