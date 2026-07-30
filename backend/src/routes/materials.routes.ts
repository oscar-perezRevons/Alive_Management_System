import { Router } from 'express';
import { materialsController } from '../controllers/materials.controller';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(__dirname, '../../uploads/materials');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedMimes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/gif'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF o imágenes (PNG, JPG, JPEG, WEBP, GIF)'));
    }
  }
});

const router = Router();
router.use(authMiddleware);

router.get('/categories', materialsController.getCategories);
router.post('/categories', materialsController.createCategory);
router.get('/', materialsController.getMaterials);
router.post('/upload', upload.any(), materialsController.uploadMaterial);
router.post('/migrate-to-cloud', materialsController.migrateLocalToCloudinary);
router.put('/:id/visibility', materialsController.toggleVisibility);
router.put('/:id', upload.any(), materialsController.updateMaterial);
router.delete('/:id', materialsController.deleteMaterial);

export default router;
