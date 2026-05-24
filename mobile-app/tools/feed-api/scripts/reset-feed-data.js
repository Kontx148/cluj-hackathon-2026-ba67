#!/usr/bin/env node
/**
 * Reset workflow-generated feed JSON (law + news). Keeps registry/schemas untouched.
 * Local:  node scripts/reset-feed-data.js
 * Cloud:  MOBILE_APP_DATA_DIR=/root/.../mobile-app/data node scripts/reset-feed-data.js
 */
const fs = require("fs");
const path = require("path");

const DATA_DIR =
  process.env.MOBILE_APP_DATA_DIR || path.resolve(__dirname, "../../../data");

function emptyFeed(feed) {
  return {
    items: [],
    meta: {
      feed,
      updatedAt: new Date().toISOString(),
      reset: true,
    },
  };
}

const targets = [
  { file: "law-items.json", feed: "law" },
  { file: "news-items.json", feed: "news" },
];

for (const { file, feed } of targets) {
  const filePath = path.join(DATA_DIR, file);
  fs.writeFileSync(filePath, `${JSON.stringify(emptyFeed(feed), null, 2)}\n`, "utf8");
  console.log(`cleared ${filePath}`);
}

const legacy = path.join(DATA_DIR, "feed-items.json");
try {
  fs.unlinkSync(legacy);
  console.log(`deleted legacy ${legacy}`);
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}

console.log("Done. Re-run n8n workflows to repopulate.");
