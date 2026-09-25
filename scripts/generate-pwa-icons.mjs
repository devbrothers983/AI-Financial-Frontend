// Regenerates every PWA/favicon icon from one hand-drawn design (no image
// libraries needed for the drawing itself): a rounded square with the same
// diagonal emerald -> indigo gradient used in components/Logo.jsx, and a
// white 4-point sparkle mark. sharp is only used to pack the raw RGBA pixel
// buffers into real PNG/ICO files.

import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(__dirname, "..", "app");
const iconsDir = path.join(__dirname, "..", "public", "icons");
mkdirSync(iconsDir, { recursive: true });

// ---------- Geometry ----------

function insideRoundedRect(x, y, w, h, r) {
  if (x < 0 || y < 0 || x > w || y > h) return false;
  if (x < r && y < r) return (x - r) ** 2 + (y - r) ** 2 <= r * r;
  if (x > w - r && y < r) return (x - (w - r)) ** 2 + (y - r) ** 2 <= r * r;
  if (x < r && y > h - r) return (x - r) ** 2 + (y - (h - r)) ** 2 <= r * r;
  if (x > w - r && y > h - r) return (x - (w - r)) ** 2 + (y - (h - r)) ** 2 <= r * r;
  return true;
}

function starPoints(cx, cy, outerR, innerR, spikes, rotationDeg) {
  const pts = [];
  const step = Math.PI / spikes;
  let rot = (rotationDeg * Math.PI) / 180;
  for (let i = 0; i < spikes; i++) {
    pts.push([cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR]);
    rot += step;
    pts.push([cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR]);
    rot += step;
  }
  return pts;
}

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// emerald-400 -> indigo-600 (matches components/Logo.jsx)
const FROM = [52, 211, 153];
const TO = [79, 70, 229];

function renderIcon({ size, rounded, safeZone }) {
  const SS = 4; // supersample factor for anti-aliasing
  const big = size * SS;
  const r = rounded ? big * 0.22 : 0;
  const outerR = big * (safeZone ? 0.19 : 0.27);
  const innerR = outerR * 0.42;
  const star = starPoints(big / 2, big / 2, outerR, innerR, 4, -90);

  const big32 = new Float64Array(big * big * 4);

  for (let y = 0; y < big; y++) {
    for (let x = 0; x < big; x++) {
      const idx = (y * big + x) * 4;
      if (!insideRoundedRect(x, y, big, big, r)) continue;

      const t = Math.min(Math.max((x + y) / (2 * (big - 1)), 0), 1);
      let cr = FROM[0] + (TO[0] - FROM[0]) * t;
      let cg = FROM[1] + (TO[1] - FROM[1]) * t;
      let cb = FROM[2] + (TO[2] - FROM[2]) * t;

      if (pointInPolygon(x, y, star)) {
        cr = 255;
        cg = 255;
        cb = 255;
      }

      big32[idx] = cr;
      big32[idx + 1] = cg;
      big32[idx + 2] = cb;
      big32[idx + 3] = 255;
    }
  }

  const out = Buffer.alloc(size * size * 4);
  const n = SS * SS;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let sr = 0, sg = 0, sb = 0, sa = 0;
      for (let dy = 0; dy < SS; dy++) {
        for (let dx = 0; dx < SS; dx++) {
          const sidx = ((y * SS + dy) * big + (x * SS + dx)) * 4;
          const a = big32[sidx + 3];
          sr += big32[sidx] * (a / 255);
          sg += big32[sidx + 1] * (a / 255);
          sb += big32[sidx + 2] * (a / 255);
          sa += a;
        }
      }
      const avgA = sa / n;
      const oidx = (y * size + x) * 4;
      if (avgA > 0.5) {
        out[oidx] = Math.round(Math.min((sr / n) / (avgA / 255), 255));
        out[oidx + 1] = Math.round(Math.min((sg / n) / (avgA / 255), 255));
        out[oidx + 2] = Math.round(Math.min((sb / n) / (avgA / 255), 255));
        out[oidx + 3] = Math.round(avgA);
      }
    }
  }

  return out;
}

async function toPngBuffer(size, opts) {
  const raw = renderIcon({ size, ...opts });
  return sharp(raw, { raw: { width: size, height: size, channels: 4 } }).ensureAlpha().png().toBuffer();
}

// ---------- ICO packing ----------

async function buildIco(sizes) {
  const images = [];
  for (const size of sizes) {
    const data = await toPngBuffer(size, { rounded: false, safeZone: true });
    images.push({ size, data });
  }

  const headerSize = 6;
  const entrySize = 16;
  let offset = headerSize + entrySize * images.length;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  const datas = [];
  for (const img of images) {
    const entry = Buffer.alloc(entrySize);
    const dim = img.size >= 256 ? 0 : img.size;
    entry.writeUInt8(dim, 0);
    entry.writeUInt8(dim, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    datas.push(img.data);
    offset += img.data.length;
  }

  return Buffer.concat([header, ...entries, ...datas]);
}

async function run() {
  writeFileSync(path.join(iconsDir, "icon-192.png"), await toPngBuffer(192, { rounded: true, safeZone: false }));
  writeFileSync(path.join(iconsDir, "icon-512.png"), await toPngBuffer(512, { rounded: true, safeZone: false }));
  writeFileSync(
    path.join(iconsDir, "icon-512-maskable.png"),
    await toPngBuffer(512, { rounded: false, safeZone: true })
  );
  writeFileSync(path.join(appDir, "apple-icon.png"), await toPngBuffer(180, { rounded: false, safeZone: true }));

  const ico = await buildIco([16, 32, 48, 256]);
  writeFileSync(path.join(appDir, "favicon.ico"), ico);

  console.log("Wrote icon-192.png, icon-512.png, icon-512-maskable.png, apple-icon.png, favicon.ico");
}

run();
