#!/usr/bin/env node
/**
 * Fill title_en + English summary for Romanian law items in law-items.json.
 * Usage: node scripts/translate-law-items.js
 */
const fs = require("fs");
const path = require("path");
const { translateLawItems } = require("../translate");

const DATA_DIR =
  process.env.MOBILE_APP_DATA_DIR || path.resolve(__dirname, "../../../data");
const LAW_FILE = path.join(DATA_DIR, "law-items.json");

async function main() {
  const data = JSON.parse(fs.readFileSync(LAW_FILE, "utf8"));
  const items = data.items || [];
  console.log(`Translating ${items.length} law items…`);

  const translated = await translateLawItems(
    items.map((item) => {
      if (item.sourceLang === "ro" && item.feedCategory === "law") {
        const { title_en, ...rest } = item;
        return rest;
      }
      return item;
    }),
    { delayMs: 200 },
  );

  const roTranslated = translated.filter(
    (item) => item.sourceLang === "ro" && item.title_en,
  ).length;

  fs.writeFileSync(
    LAW_FILE,
    JSON.stringify(
      {
        ...data,
        items: translated,
        meta: {
          ...data.meta,
          translatedAt: new Date().toISOString(),
          translatedRoCount: roTranslated,
        },
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`Done. ${roTranslated} Romanian law items now have English fields.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
