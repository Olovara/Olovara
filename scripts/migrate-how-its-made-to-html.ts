/**
 * Migration script: convert plain-text "How it's made" (product) to HTML for Quill.
 *
 * After switching the product form How It's Made field to the Quill rich text
 * editor, existing values are plain text. Quill stores HTML. This script
 * wraps plain-text values in <p>...</p> so they display correctly and open
 * correctly in the editor. Values that already look like HTML are left unchanged.
 *
 * Run with: npx tsx scripts/migrate-how-its-made-to-html.ts
 * Dry run (no writes):
 *   Bash:    DRY_RUN=1 npx tsx scripts/migrate-how-its-made-to-html.ts
 *   PowerShell: $env:DRY_RUN="1"; npx tsx scripts/migrate-how-its-made-to-html.ts
 * To run for real in PowerShell (clear dry run if set earlier):
 *   $env:DRY_RUN=$null; npx tsx scripts/migrate-how-its-made-to-html.ts
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
  console.log("How it's made (product) → HTML migration");
  if (DRY_RUN) console.log("DRY RUN – no updates will be written.\n");

  const products = await db.product.findMany({
    where: {
      howItsMade: { not: null },
    },
    select: {
      id: true,
      name: true,
      howItsMade: true,
    },
  });

  const toUpdate: { id: string; name: string; newValue: string }[] = [];

  for (const p of products) {
    const current = p.howItsMade;
    if (!current || current.trim() === "") continue;
    if (isLikelyHtml(current)) continue;
    const newValue = plainTextToHtml(current);
    if (newValue) toUpdate.push({ id: p.id, name: p.name, newValue });
  }

  console.log(`Products with How it's made: ${products.length}`);
  console.log(`Plain-text to migrate: ${toUpdate.length}`);

  if (toUpdate.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  if (!DRY_RUN) {
    for (const { id, name, newValue } of toUpdate) {
      await db.product.update({
        where: { id },
        data: { howItsMade: newValue },
      });
      console.log(`Updated: ${name}`);
    }
    console.log(`Done. Updated ${toUpdate.length} product(s).`);
  } else {
    toUpdate.forEach(({ name, newValue }) => {
      console.log(`Would update "${name}": ${newValue.slice(0, 60)}...`);
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
