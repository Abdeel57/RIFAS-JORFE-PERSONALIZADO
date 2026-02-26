import multer from 'multer';

const MAX_SIZE = 12 * 1024 * 1024; // 12 MB

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes JPG, PNG o WebP.'));
  }
};

export const uploadImageMiddleware = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter,
}).single('file');
