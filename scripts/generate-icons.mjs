// Dev-only: rasterize PNG icons + a social-share image from the brand SVG.
// Run with `npm run icons`. Output lands in public/ and is committed.
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
const svg = readFileSync(join(pub, "icon.svg"));

const png = (size) => sharp(svg, { density: 384 }).resize(size, size).png();

const tasks = [
  png(192).toFile(join(pub, "icon-192.png")),
  png(512).toFile(join(pub, "icon-512.png")),
  // iOS home-screen icon: opaque background, 180×180.
  sharp(svg, { density: 384 }).resize(180, 180).flatten({ background: "#06121f" }).png().toFile(join(pub, "apple-touch-icon.png")),
];

// Open Graph / social-share card (1200×630) so the shared link previews nicely.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5ad1c2"/><stop offset="1" stop-color="#6c8cff"/>
    </linearGradient>
    <radialGradient id="bg" cx="80%" cy="-10%" r="90%">
      <stop offset="0" stop-color="#10243f"/><stop offset="1" stop-color="#06121f"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g transform="translate(96,150)">
    <rect width="120" height="120" rx="28" fill="url(#g)"/>
    <text x="60" y="86" font-family="Arial, sans-serif" font-size="78" font-weight="800" fill="#06121f" text-anchor="middle">M</text>
  </g>
  <text x="240" y="232" font-family="Arial, sans-serif" font-size="72" font-weight="800" fill="#ffffff">Mnemo Med</text>
  <text x="98" y="360" font-family="Arial, sans-serif" font-size="40" font-weight="600" fill="#cdd6f6">Source-locked study intelligence for premed finals.</text>
  <text x="98" y="436" font-family="Arial, sans-serif" font-size="30" fill="#9aa6c4">Notes, slides &amp; professor wording → verified review sheets,</text>
  <text x="98" y="478" font-family="Arial, sans-serif" font-size="30" fill="#9aa6c4">Anki cards, practice exams, and a finals cram plan.</text>
  <text x="98" y="566" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#5ad1c2">Local-first · No account · Works offline</text>
</svg>`;
tasks.push(sharp(Buffer.from(og)).png().toFile(join(pub, "og.png")));

await Promise.all(tasks);
console.log("Generated: icon-192.png, icon-512.png, apple-touch-icon.png, og.png");
