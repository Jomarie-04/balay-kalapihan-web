import fs from 'node:fs/promises';
import path from 'node:path';

export async function deleteUploadedImageFile(imageUrl, uploadsDir = path.resolve(process.cwd(), 'uploads')) {
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('/uploads/')) {
    return false;
  }

  const imagePath = path.resolve(uploadsDir, path.basename(imageUrl));

  try {
    await fs.unlink(imagePath);
    return true;
  } catch (error) {
    if (error && (error.code === 'ENOENT' || error.code === 'ERR_INVALID_ARG_TYPE')) {
      return false;
    }

    throw error;
  }
}
