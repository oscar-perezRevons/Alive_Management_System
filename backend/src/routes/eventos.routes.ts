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

import { uploadBufferToCloudinary, isCloudinaryConfigured } from '../services/cloudinary.service';

const storage = multer.memoryStorage();
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

router.post('/upload', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se envió ningún archivo.' });
    }

    let fileUrl = '';
    if (isCloudinaryConfigured() && req.file.buffer) {
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer, 'eventos', req.file.originalname);
      fileUrl = uploadResult.secure_url;
    } else if (req.file.filename) {
      fileUrl = `/uploads/eventos/${req.file.filename}`;
    } else {
      return res.status(500).json({ success: false, message: 'Error procesando archivo.' });
    }

    return res.status(200).json({ success: true, fileUrl });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;