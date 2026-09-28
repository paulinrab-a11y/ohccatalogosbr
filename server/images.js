import sharp from "sharp";
import { problem } from "./runtime.js";

// Fully decode and encode trusted raster formats; metadata is not copied.
export async function sanitizeImage(
  file,
  { webpOnly = false, maxBytes = 2621440 } = {},
) {
  const formats = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/webp": "webp",
  };
  if (
    !file ||
    typeof file !== "object" ||
    !formats[file.content_type] ||
    (webpOnly && file.content_type !== "image/webp")
  )
    throw problem("Use uma imagem JPG, PNG ou WebP válida.");
  if (
    typeof file.data !== "string" ||
    !file.data.length ||
    file.data.length > Math.ceil(maxBytes / 3) * 4 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(file.data)
  )
    throw problem("Imagem inválida ou grande demais.");
  const input = Buffer.from(file.data, "base64");
  if (
    !input.length ||
    input.length > maxBytes ||
    (file.size !== undefined && file.size !== input.length)
  )
    throw problem("Tamanho de imagem inválido.");
  try {
    const pipeline = sharp(input, {
      failOn: "warning",
      limitInputPixels: 16000000,
    });
    const meta = await pipeline.metadata();
    if (meta.format !== formats[file.content_type] || (meta.pages || 1) !== 1)
      throw new Error("unsupported image");
    const output = await pipeline
      .rotate()
      .webp({ lossless: true })
      .timeout({ seconds: 5 })
      .toBuffer();
    if (output.length > maxBytes) throw new Error("oversized output");
    return output;
  } catch {
    throw problem(
      "Não foi possível validar a imagem. Use uma imagem estática de até 16 megapixels dentro do limite de tamanho.",
    );
  }
}
