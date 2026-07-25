// =============================================================================
// Plain-Node image header parser (PNG / JPEG / WebP / AVIF). Zero npm deps.
// Used at build/render time to stamp real width/height on content images (CLS)
// and to discover sibling modern-format variants for <picture>/<srcset>.
// DO NOT add sharp: its libvips binaries are LGPL-3.0-or-later (and statically
// linked on Windows). House license policy: do not vendor.
// =============================================================================

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, extname, basename } from "node:path";

/**
 * @param {Buffer} buf
 * @returns {{ width: number, height: number, type: string } | null}
 */
export function parseImageSize(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 10) return null;
  // PNG: 8-byte sig, then IHDR chunk (length=13, type IHDR) at offset 8.
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    if (buf.length < 24) return null;
    if (buf.toString("ascii", 12, 16) !== "IHDR") return null;
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), type: "png" };
  }
  // JPEG: scan for SOF0/SOF1/SOF2 markers.
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      if (marker === 0xd9 || marker === 0xda) break;
      const size = buf.readUInt16BE(i + 2);
      if (size < 2) break;
      // SOF0 / SOF1 / SOF2
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        const height = buf.readUInt16BE(i + 5);
        const width = buf.readUInt16BE(i + 7);
        return { width, height, type: "jpeg" };
      }
      i += 2 + size;
    }
    return null;
  }
  // WebP: RIFF....WEBP then VP8 / VP8L / VP8X
  if (
    buf.length >= 30 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    const chunk = buf.toString("ascii", 12, 16);
    if (chunk === "VP8X" && buf.length >= 30) {
      const width = 1 + buf.readUIntLE(24, 3);
      const height = 1 + buf.readUIntLE(27, 3);
      return { width, height, type: "webp" };
    }
    if (chunk === "VP8 " && buf.length >= 30) {
      // Lossy VP8 bitstream: 3-byte frame tag, then start code 0x9d 0x01 0x2a, then 16-bit dims.
      const start = 20;
      if (buf[start + 3] === 0x9d && buf[start + 4] === 0x01 && buf[start + 5] === 0x2a) {
        const width = buf.readUInt16LE(start + 6) & 0x3fff;
        const height = buf.readUInt16LE(start + 8) & 0x3fff;
        return { width, height, type: "webp" };
      }
    }
    if (chunk === "VP8L" && buf.length >= 25) {
      // Lossless: signature 0x2f, then 14-bit width-1 / height-1 packed.
      if (buf[20] !== 0x2f) return null;
      const bits = buf.readUInt32LE(21);
      const width = (bits & 0x3fff) + 1;
      const height = ((bits >> 14) & 0x3fff) + 1;
      return { width, height, type: "webp" };
    }
    return null;
  }
  // AVIF / HEIF: ftyp brand, then walk boxes for ispe (width/height).
  if (buf.length >= 12 && buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12);
    if (!/^(avif|avis|mif1|msf1|heic|heix)/.test(brand)) {
      // Still may be avif with major brand elsewhere; continue scan loosely.
    }
    const size = findIspe(buf);
    if (size) return { ...size, type: "avif" };
  }
  return null;
}

function findIspe(buf) {
  // Naive scan for the 'ispe' box type; payload is version/flags (4) + width/height u32.
  for (let i = 0; i + 16 < buf.length; i++) {
    if (
      buf[i] === 0x69 &&
      buf[i + 1] === 0x73 &&
      buf[i + 2] === 0x70 &&
      buf[i + 3] === 0x65
    ) {
      // ispe at i; full box starts 4 bytes earlier with size.
      const width = buf.readUInt32BE(i + 8);
      const height = buf.readUInt32BE(i + 12);
      if (width > 0 && height > 0 && width < 100000 && height < 100000) {
        return { width, height };
      }
    }
  }
  return null;
}

/**
 * Read and parse an on-disk image. Returns null on missing/unreadable/unknown.
 * @param {string} absPath
 */
export function imageSizeFromPath(absPath) {
  try {
    if (!existsSync(absPath)) return null;
    return parseImageSize(readFileSync(absPath));
  } catch {
    return null;
  }
}

/**
 * Resolve a site-relative public URL ("/foo.jpg") against process.cwd()/public.
 * @param {string} url
 * @param {string} [publicRoot]
 */
export function resolvePublicPath(url, publicRoot = join(process.cwd(), "public")) {
  if (typeof url !== "string" || !url.startsWith("/") || url.startsWith("//")) return null;
  const clean = url.split(/[?#]/)[0];
  const abs = join(publicRoot, ...clean.slice(1).split("/"));
  if (!abs.startsWith(publicRoot)) return null;
  return existsSync(abs) ? abs : null;
}

/**
 * When sibling .avif / .webp files exist next to a raster source, return their
 * public URLs for a <picture> element. Never invents files.
 * @param {string} url public URL of the configured source
 * @param {string} [publicRoot]
 * @returns {{ avif?: string, webp?: string }}
 */
export function siblingModernFormats(url, publicRoot = join(process.cwd(), "public")) {
  /** @type {{ avif?: string, webp?: string }} */
  const out = {};
  if (typeof url !== "string" || !url.startsWith("/")) return out;
  const clean = url.split(/[?#]/)[0];
  const ext = extname(clean);
  if (!ext || !/\.(jpe?g|png)$/i.test(ext)) return out;
  const stem = clean.slice(0, -ext.length);
  const dir = dirname(join(publicRoot, ...clean.slice(1).split("/")));
  const base = basename(stem);
  for (const kind of ["avif", "webp"]) {
    const abs = join(dir, `${base}.${kind}`);
    if (existsSync(abs)) out[kind] = `${stem}.${kind}`;
  }
  return out;
}
