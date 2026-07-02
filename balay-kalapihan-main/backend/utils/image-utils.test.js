import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

import { deleteUploadedImageFile } from './image-utils.js';

test('deleteUploadedImageFile removes an uploaded image from the local uploads directory', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'menu-image-'));
  const uploadsDir = path.join(tempDir, 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });

  const imageName = 'sample-image.png';
  const imagePath = path.join(uploadsDir, imageName);
  await fs.writeFile(imagePath, 'test');

  await deleteUploadedImageFile(`/uploads/${imageName}`, uploadsDir);

  await assert.rejects(fs.access(imagePath), /ENOENT/);
});
