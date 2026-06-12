import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = (subfolder: string) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../../uploads', subfolder));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  });

const fileFilter = (allowedTypes: string[]) => (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`));
  }
};

export const uploadMusic = multer({
  storage: storage('music'),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: fileFilter(['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/aac']),
});

export const uploadCover = multer({
  storage: storage('covers'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
});

export const uploadAvatar = multer({
  storage: storage('avatars'),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
});
