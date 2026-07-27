import { Router } from 'express';
import { eventosController } from '../controllers/eventos.controller';
import { authMiddleware } from '../middleware/auth';
import { requireAccessRoles } from '../middleware/authorization';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(__dirname, '../../uploads/eventos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const router = Router();
router.use(authMiddleware);

router.get('/', eventosController.getEvents);
router.get('/kpis', eventosController.getKpis);
router.get('/mi-grupo-miembros', eventosController.getMyGroupMembers);
router.post('/', requireAccessRoles(['ADMIN']), eventosController.storeEvent);
router.put('/:id', requireAccessRoles(['ADMIN']), eventosController.modifyEvent);
router.delete('/:id', requireAccessRoles(['ADMIN']), eventosController.removeEvent);
router.post('/:id/participar', eventosController.joinEvent);
router.delete('/:id/participar', eventosController.leaveEvent);
router.post('/:id/participantes', eventosController.updateConfirmedMembers);
router.get('/:id/admin-details', eventosController.getEventAdminDetails);
router.get('/mis-participaciones', eventosController.getMyParticipations);

router.post('/upload', upload.single('file'), (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se envió ningún archivo.' });
    }
    const fileUrl = `/uploads/eventos/${req.file.filename}`;
    return res.status(200).json({ success: true, fileUrl });
  } catch (error: any) {
    return res.status(555).json({ success: false, message: error.message });
  }
});

export default router;