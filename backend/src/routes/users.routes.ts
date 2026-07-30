import { Router } from 'express';
import { usersController } from '../controllers/users.controller';
import { authMiddleware } from '../middleware/auth';
import { requireAccessRoles } from '../middleware/authorization';
import multer from 'multer';
import path from 'path';

const router = Router();
router.use(authMiddleware);

const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('El archivo debe ser una imagen válida.'));
  }
});

router.get('/', requireAccessRoles(['ADMIN']), usersController.getAllUsers);
router.put('/:id', usersController.updateUser); 
router.post('/:id/avatar', upload.single('avatar'), usersController.uploadAvatar);
router.put('/:id/role', requireAccessRoles(['ADMIN']), usersController.updateUserRole);
router.put('/:id/status', requireAccessRoles(['ADMIN']), usersController.toggleUserStatus);
router.get('/:id/password', requireAccessRoles(['ADMIN']), usersController.getUserPassword);
router.put('/:id/password', requireAccessRoles(['ADMIN']), usersController.resetUserPassword);

export default router;