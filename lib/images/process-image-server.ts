import sharp from "sharp";

// Match client-side product-photo intent: sharp enough for gallery zoom, not micro-files.
const MAX_EDGE = 3000;
const WEBP_QUALITY = 92;

/**
 * Normalize raster uploads: cap longest edge, encode WebP (server backup for non-browser paths).
 */
export async function processImageBufferToWebP(
  buffer: Buffer,
): Promise<Buffer> {
  if (!buffer.length) {
    return buffer;
  }

  const out = await sharp(buffer)
    .rotate()
    .resize(MAX_EDGE, MAX_EDGE, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  return Buffer.from(out);
}
