import { Router } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { uploadImage, makeBucketPublic } from '../controllers/upload.js';

const router = Router();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem são permitidos (JPEG, PNG, WebP)'));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

router.post('/', authenticateToken, upload.single('file'), uploadImage);
router.get('/make-public', makeBucketPublic);

export default router;
