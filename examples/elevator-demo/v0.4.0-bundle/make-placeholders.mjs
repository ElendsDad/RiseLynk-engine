// =============================================================================
// Generates the checked-in placeholder before/after images for the v0.4.0 bundle fixture.
//
//   node examples/elevator-demo/v0.4.0-bundle/make-placeholders.mjs
//
// Dependency-free: hand-builds tiny solid-color PNGs (valid signature + IHDR/IDAT/IEND, each
// chunk CRC32'd) using node:zlib for the IDAT deflate. These stand in for real modernization
// photos so the paired-project bundle fixture and its build proof need no binary fetch. The
// images are checked in; this script only exists so they are reproducible byte-for-byte.
//
// proj-3 is intentionally NOT generated: the bundle snapshot references its files so the
// hydrator's asset resolver drops that project (missing file) with a trace record, proving
// the degrade-not-fail path (addendum 8.2).
// =============================================================================

import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "summit-vertical", "2026-07-10T183000Z", "assets");

// CRC32 (PNG/zlib polynomial), table-driven.
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
// A minimal solid-color RGB PNG (color type 2, 8-bit). Every row filters to None (0).
function png(width, height, [r, g, b]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  // ihdr[10..12] = compression / filter / interlace = 0 (already zeroed)
  const row = Buffer.alloc(1 + width * 3);
  for (let x = 0; x < width; x++) {
    row[1 + x * 3] = r;
    row[1 + x * 3 + 1] = g;
    row[1 + x * 3 + 2] = b;
  }
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  const idat = deflateSync(raw);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

mkdirSync(OUT, { recursive: true });
const files = {
  "proj-1-before.png": [90, 96, 104], // aged grey (old controller)
  "proj-1-after.png": [18, 50, 74], // brand primary tone (new controller)
  "proj-2-before.png": [110, 100, 88], // worn machine
  "proj-2-after.png": [242, 165, 65], // brand accent tone (new machine)
};
for (const [name, color] of Object.entries(files)) {
  const buf = png(64, 48, color);
  writeFileSync(join(OUT, name), buf);
  console.log(`wrote ${name} (${buf.length} bytes)`);
}
