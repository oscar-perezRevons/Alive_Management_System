import { Router } from 'express';
import { programController } from '../controllers/program.controller';
import { authMiddleware } from '../middleware/auth';
import { requireAccessRoles } from '../middleware/authorization';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = './uploads/programa';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, uploadDir); },
  filename: (req, file, cb) => {
    cb(null, `programa-guia.pdf`);
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
router.use(requireAccessRoles(['ADMIN', 'LIDER_GP']));

router.get('/guide-url', programController.getGuidePdf);
router.post('/upload-guide', upload.single('pdf'), programController.uploadGuidePdf);
router.delete('/guide', programController.deleteGuidePdf);

router.get('/', programController.getFullSchedule);
router.post('/', programController.storeEvent);
router.put('/:id', programController.modifyEvent);
router.delete('/:id', programController.removeEvent);

export default router;