// =============================================================================
// Gate: plain-Node image header parser (no sharp).
//
//   node tools/image-size.test.mjs
// =============================================================================

import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  parseImageSize,
  imageSizeFromPath,
  siblingModernFormats,
  resolvePublicPath,
} from "../lib/image-size.mjs";
import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

// Minimal 1x1 PNG (IHDR width=1, height=1).
const PNG_1X1 = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082",
  "hex",
);

// Minimal JPEG with SOF0 2x3 (hand-built).
function makeJpeg(width, height) {
  const sof = Buffer.from([
    0xff, 0xc0, 0x00, 0x0b, 0x08,
    (height >> 8) & 0xff, height & 0xff,
    (width >> 8) & 0xff, width & 0xff,
    0x01, 0x01, 0x11, 0x00,
  ]);
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]), // SOI
    Buffer.from([0xff, 0xd9]), // we insert SOF before EOI below - rebuild properly
  ]);
}

// Rebuild a tiny JPEG: SOI + SOF0 + EOI
function jpegWxH(width, height) {
  return Buffer.from([
    0xff, 0xd8,
    0xff, 0xc0, 0x00, 0x0b, 0x08,
    (height >> 8) & 0xff, height & 0xff,
    (width >> 8) & 0xff, width & 0xff,
    0x01, 0x01, 0x11, 0x00,
    0xff, 0xd9,
  ]);
}

test("parseImageSize reads PNG IHDR", () => {
  const s = parseImageSize(PNG_1X1);
  assert.equal(s.width, 1);
  assert.equal(s.height, 1);
  assert.equal(s.type, "png");
});

test("parseImageSize reads JPEG SOF0", () => {
  const s = parseImageSize(jpegWxH(640, 480));
  assert.equal(s.width, 640);
  assert.equal(s.height, 480);
  assert.equal(s.type, "jpeg");
});

test("parseImageSize returns null on garbage", () => {
  assert.equal(parseImageSize(Buffer.from("not-an-image")), null);
  assert.equal(parseImageSize(Buffer.alloc(0)), null);
});

test("imageSizeFromPath + siblingModernFormats discover on-disk siblings", () => {
  const dir = mkdtempSync(join(tmpdir(), "imgsize-"));
  const pub = join(dir, "public");
  mkdirSync(join(pub, "photos"), { recursive: true });
  writeFileSync(join(pub, "photos", "hero.jpg"), jpegWxH(800, 600));
  writeFileSync(join(pub, "photos", "hero.webp"), Buffer.from("RIFF")); // existence only for sibling check
  // Fix: sibling check only needs existsSync; size parse of webp stub may fail - that's ok.
  writeFileSync(
    join(pub, "photos", "hero.webp"),
    // VP8X 10x20
    Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x58,
      0x0a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, 0x00, 0x13, 0x00, 0x00,
    ]),
  );
  try {
    const abs = join(pub, "photos", "hero.jpg");
    const s = imageSizeFromPath(abs);
    assert.equal(s.width, 800);
    assert.equal(s.height, 600);
    const modern = siblingModernFormats("/photos/hero.jpg", pub);
    assert.equal(modern.webp, "/photos/hero.webp");
    assert.equal(modern.avif, undefined);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Hero.tsx uses a real img with fetchPriority high (not CSS background-image)", () => {
  const src = readFileSync(join(ROOT, "components", "sections", "Hero.tsx"), "utf8");
  assert.ok(!/backgroundImage/.test(src), "must not set inline backgroundImage");
  assert.ok(/fetchPriority=\{?"high"?\}/.test(src) || /fetchPriority="high"/.test(src));
  assert.ok(/className="hero__bg"/.test(src));
  assert.ok(/siblingModernFormats/.test(src));
});

test("About.tsx stamps width/height from image-size", () => {
  const src = readFileSync(join(ROOT, "components", "sections", "About.tsx"), "utf8");
  assert.ok(/imageSizeFromPath/.test(src));
  assert.ok(/width=\{dims\?\.width\}/.test(src));
  assert.ok(/className="about__img"/.test(src));
});

test("package has no sharp dependency", () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  assert.equal(pkg.dependencies?.sharp, undefined);
  assert.equal(pkg.devDependencies?.sharp, undefined);
});

// silence unused
void makeJpeg;
void resolvePublicPath;

let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message}`);
  }
}
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
