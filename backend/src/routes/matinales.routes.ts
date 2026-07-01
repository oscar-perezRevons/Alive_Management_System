import { Router } from 'express';
import { matinalesController } from '../controllers/matinales.controller';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(__dirname, '../../uploads/matinales');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, uploadDir); },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `matinal-${req.params.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Solo se permiten archivos en formato PDF'));
  }
});

const router = Router();

router.use(authMiddleware);

router.get('/', matinalesController.getMatinales);
router.post('/:id/upload', upload.single('pdf'), matinalesController.uploadMatinalPdf);

export default router;