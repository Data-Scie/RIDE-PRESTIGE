import path from 'path';
import { promises as fs } from 'fs';
import type { Request } from 'express';
import { isCloudinaryConfigured, uploadDocumentBuffer } from './cloudinary';

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']);

function safeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'document';
}

export function validateDocumentFile(file: Express.Multer.File): string | null {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return 'Document must be a PDF or image file';
  if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    return 'Document must be a PDF or image file';
  }
  return null;
}

export async function storeDocumentFile(req: Request, file: Express.Multer.File, ownerId: string, documentType: string): Promise<string> {
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${Date.now()}-${safeName(documentType)}${ext}`;
  if (isCloudinaryConfigured()) {
    return uploadDocumentBuffer(file.buffer, `ride-prestige/documents/${safeName(ownerId)}`, filename);
  }

  const uploadRoot = path.resolve(process.cwd(), 'uploads', 'documents', safeName(ownerId));
  await fs.mkdir(uploadRoot, { recursive: true });
  await fs.writeFile(path.join(uploadRoot, filename), file.buffer);
  return `${req.protocol}://${req.get('host')}/uploads/documents/${encodeURIComponent(safeName(ownerId))}/${encodeURIComponent(filename)}`;
}
