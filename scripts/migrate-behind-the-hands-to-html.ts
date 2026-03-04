/**
 * Migration script: convert plain-text "Behind the Hands" to HTML for Quill.
 *
 * After switching the About > Behind the Hands field to the Quill rich text
 * editor, existing values are plain text. Quill stores HTML. This script
 * wraps plain-text values in <p>...</p> so they display correctly and open
 * correctly in the editor. Values that already look like HTML (e.g. start
 * with "<") are left unchanged.
 *
 * Run with: npx tsx scripts/migrate-behind-the-hands-to-html.ts
 * Dry run (no writes):
 *   Bash:    DRY_RUN=1 npx tsx scripts/migrate-behind-the-hands-to-html.ts
 *   PowerShell: $env:DRY_RUN="1"; npx tsx scripts/migrate-behind-the-hands-to-html.ts
 * To run for real in PowerShell (clear dry run if you set it earlier):
 *   $env:DRY_RUN=$null; npx tsx scripts/migrate-behind-the-hands-to-html.ts
 */

import { db } from "@/lib/db";

const DRY_RUN = process.env.DRY_RUN === "1";

// Escape only characters that would break HTML or cause XSS. Apostrophes stay as-is for readability (e.g. I'm).
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isLikelyHtml(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("<") && trimmed.includes(">");
}

function plainTextToHtml(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  // Preserve paragraphs and blank lines: split on newlines, wrap each in <p>
  const lines = trimmed.split(/\r?\n/);
  return lines
    .map((line) => {
      const p = line.trim();
      return p ? `<p>${escapeHtml(p)}</p>` : "<p><br></p>";
    })
    .join("");
}

async function main() {
  console.log("Behind the Hands → HTML migration");
  if (DRY_RUN) console.log("DRY RUN – no updates will be written.\n");

  const sellers = await db.seller.findMany({
    where: {
      behindTheHands: { not: null },
    },
    select: {
      id: true,
      shopName: true,
      behindTheHands: true,
    },
  });

  const toUpdate: { id: string; shopName: string | null; newValue: string }[] = [];

  for (const s of sellers) {
    const current = s.behindTheHands;
    if (!current || current.trim() === "") continue;
    if (isLikelyHtml(current)) continue;
    const newValue = plainTextToHtml(current);
    if (newValue) toUpdate.push({ id: s.id, shopName: s.shopName, newValue });
  }

  console.log(`Sellers with Behind the Hands: ${sellers.length}`);
  console.log(`Plain-text to migrate: ${toUpdate.length}`);

  if (toUpdate.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  if (!DRY_RUN) {
    for (const { id, shopName, newValue } of toUpdate) {
      await db.seller.update({
        where: { id },
        data: { behindTheHands: newValue },
      });
      console.log(`Updated: ${shopName ?? id}`);
    }
    console.log(`Done. Updated ${toUpdate.length} seller(s).`);
  } else {
    toUpdate.forEach(({ shopName, newValue }) => {
      console.log(`Would update ${shopName}: ${newValue.slice(0, 60)}...`);
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
