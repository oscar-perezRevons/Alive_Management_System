import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const dir = './uploads/brand';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req: any, file: any, cb: any) => {
    const fileExtension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-official${fileExtension}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|svg/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: El formato del archivo debe ser una imagen válida (JPG, PNG, SVG).'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post(
  '/upload-brand',
  authMiddleware,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      if (req.userRole !== 'ADMIN') {
        return res.status(403).json({ 
          error: 'Acceso denegado', 
          message: 'Solo el Administrador del sistema posee privilegios para alterar la identidad visual de la plataforma.' 
        });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const responseData: any = {};

      const serverUrl = `${req.protocol}://${req.get('host')}`;

      if (files['logo'] && files['logo'][0]) {
        responseData.logoUrl = `${serverUrl}/static/brand/${files['logo'][0].filename}`;
        console.log('Nuevo logotipo guardado en servidor:', files['logo'][0].filename);
      }

      if (files['banner'] && files['banner'][0]) {
        responseData.bannerUrl = `${serverUrl}/static/brand/${files['banner'][0].filename}`;
        console.log('Nuevo banner hero guardado en servidor:', files['banner'][0].filename);
      }

      return res.json({
        message: '¡Identidad visual sincronizada y almacenada en disco con éxito rotundo!',
        ...responseData
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
);

router.get('/brand-assets', (req, res) => {
  const serverUrl = `${req.protocol}://${req.get('host')}`;
  const dir = './uploads/brand';
  const assets: any = { logoUrl: null, bannerUrl: null };

  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file.startsWith('logo')) assets.logoUrl = `${serverUrl}/static/brand/${file}?t=${Date.now()}`;
      if (file.startsWith('banner')) assets.bannerUrl = `${serverUrl}/static/brand/${file}?t=${Date.now()}`;
    });
  }

  return res.json(assets);
});

export default router;