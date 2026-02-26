import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import sharp from 'sharp';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 12 * 1024 * 1024; // 12 MB antes de comprimir
const MAX_DIMENSION = 2400; // lado máximo para no guardar imágenes gigantes
const WEBP_QUALITY = 95; // mínima pérdida visible (1-100)

/**
 * Comprime la imagen con sharp: alta calidad, formato WebP.
 * Mantiene la menor pérdida posible sin usar servicios externos.
 */
async function processImage(buffer: Buffer, mime: string): Promise<{ data: Buffer; mimeType: string }> {
  let pipeline = sharp(buffer);
  const meta = await pipeline.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  // Redimensionar solo si excede el máximo (mantiene aspect ratio)
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true });
  }

  const out = await pipeline
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();

  return { data: out, mimeType: 'image/webp' };
}

/**
 * POST /api/admin/upload-image
 * Sube una imagen desde el dispositivo, la comprime con alta calidad y la guarda en la BD.
 */
export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = (req as any).file;
    if (!file || !file.buffer) {
      throw new AppError(400, 'No se envió ninguna imagen. Usa el campo "file" con una imagen.');
    }

    const mime = (file.mimetype || '').toLowerCase();
    if (!ALLOWED_MIMES.includes(mime)) {
      throw new AppError(400, 'Formato no permitido. Usa JPG, PNG o WebP.');
    }

    if (file.size > MAX_SIZE_BYTES) {
      throw new AppError(400, `La imagen no debe superar ${MAX_SIZE_BYTES / 1024 / 1024} MB.`);
    }

    const { data, mimeType } = await processImage(file.buffer, mime);

    const stored = await prisma.storedImage.create({
      data: {
        data,
        mimeType,
      },
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/api/images/${stored.id}`;

    res.status(201).json({
      success: true,
      data: {
        id: stored.id,
        url: imageUrl,
      },
    });
  } catch (error) {
    if (error instanceof AppError) next(error);
    else next(error);
  }
};

/**
 * GET /api/images/:id
 * Sirve una imagen almacenada en la BD (público, para mostrar en rifas).
 */
export const getImageById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const image = await prisma.storedImage.findUnique({
      where: { id },
    });

    if (!image) {
      throw new AppError(404, 'Image not found');
    }

    res.set('Cache-Control', 'public, max-age=31536000');
    res.set('Content-Type', image.mimeType);
    res.send(image.data);
  } catch (error) {
    if (error instanceof AppError) next(error);
    else next(error);
  }
};
