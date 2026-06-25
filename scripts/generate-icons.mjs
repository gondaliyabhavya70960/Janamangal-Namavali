// Dependency-free PNG icon generator for the Riyaz PWA.
// Renders an on-brand "audio bars" mark on a violet gradient into PNGs.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../public/icons");

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // Raw scanlines with filter byte 0.
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function roundedAlpha(x, y, size, radius) {
  const rx = Math.min(x, size - 1 - x);
  const ry = Math.min(y, size - 1 - y);
  if (rx >= radius || ry >= radius) return 1;
  const dx = radius - rx;
  const dy = radius - ry;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist <= radius ? 1 : Math.max(0, 1 - (dist - radius));
}

// Brand gradient stops.
const TOP = [139, 92, 246]; // violet
const BOTTOM = [26, 18, 48]; // deep indigo

function render(size, { maskable } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const radius = maskable ? 0 : Math.round(size * 0.22);
  // Bars geometry (centred). Maskable keeps content within the safe zone.
  const scale = maskable ? 0.62 : 0.8;
  const barCount = 5;
  const heights = [0.42, 0.72, 1.0, 0.6, 0.46];
  const barW = size * scale * 0.1;
  const gap = size * scale * 0.06;
  const groupW = barCount * barW + (barCount - 1) * gap;
  const startX = (size - groupW) / 2;
  const maxBarH = size * scale * 0.62;
  const centerY = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * size);
      let r = lerp(TOP[0], BOTTOM[0], t);
      let g = lerp(TOP[1], BOTTOM[1], t);
      let b = lerp(TOP[2], BOTTOM[2], t);

      // Draw bars in white.
      const bi = Math.floor((x - startX) / (barW + gap));
      if (bi >= 0 && bi < barCount) {
        const within = x - startX - bi * (barW + gap);
        if (within >= 0 && within <= barW) {
          const h = maxBarH * heights[bi];
          if (y >= centerY - h / 2 && y <= centerY + h / 2) {
            r = 255;
            g = 255;
            b = 255;
          }
        }
      }

      const a = Math.round(255 * roundedAlpha(x, y, size, radius));
      const idx = (y * size + x) * 4;
      rgba[idx] = r;
      rgba[idx + 1] = g;
      rgba[idx + 2] = b;
      rgba[idx + 3] = a;
    }
  }
  return encodePng(size, size, rgba);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(resolve(OUT_DIR, "icon-192.png"), render(192));
writeFileSync(resolve(OUT_DIR, "icon-512.png"), render(512));
writeFileSync(resolve(OUT_DIR, "icon-maskable-512.png"), render(512, { maskable: true }));
writeFileSync(resolve(OUT_DIR, "apple-touch-icon.png"), render(180));
console.log("Generated PWA icons in", OUT_DIR);
