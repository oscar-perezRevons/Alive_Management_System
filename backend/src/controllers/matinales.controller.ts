import { Response } from 'express';
import { matinalesService } from '../services/matinales.service';
import prisma from '../config/database';
import jwt from 'jsonwebtoken';
import { uploadBufferToCloudinary, isCloudinaryConfigured } from '../services/cloudinary.service'; 

async function verificarPermisosAdmin(req: any): Promise<boolean> {
  try {
    let role = req.user?.role || req.user?.user?.role || req.user?.payload?.role || req.headers['x-user-role'];
    let userId = req.user?.id || req.user?.userId || req.user?.sub || req.user?.user?.id;
    let email = req.user?.email || req.user?.user?.email;

    const authHeader = req.headers.authorization;
    if ((!role || !userId) && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as any;
          if (decoded) {
            role = role || decoded.role || decoded.user?.role || decoded.payload?.role;
            userId = userId || decoded.id || decoded.userId || decoded.sub || decoded.user?.id;
            email = email || decoded.email || decoded.user?.email;
          }
        } catch (jwtErr) {
          const decodedFallback = jwt.decode(token) as any;
          if (decodedFallback) {
            role = role || decodedFallback.role || decodedFallback.user?.role;
            userId = userId || decodedFallback.id || decodedFallback.userId || decodedFallback.sub;
            email = email || decodedFallback.email || decodedFallback.user?.email;
          }
        }
      }
    }

    let dbUser: any = null;
    if (userId && !isNaN(Number(userId))) {
      dbUser = await (prisma as any).user.findUnique({ where: { id: Number(userId) } });
    }
    if (!dbUser && email) {
      dbUser = await (prisma as any).user.findFirst({ where: { email: String(email) } });
    }

    if (dbUser) {
      role = dbUser.role;
    }

    if (!role) return false;
    return String(role).trim().toUpperCase() === 'ADMIN';

  } catch (error) {
    console.error('Error crítico en la verificación de seguridad:', error);
    return false;
  }
}

export class MatinalesController {
  async getMatinales(req: any, res: Response): Promise<Response> {
    try {
      const date = req.query.date ? String(req.query.date) : undefined;
      const matinales = matinalesService.getMatinalesData(date);
      return res.status(200).json({ success: true, matinales });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al obtener matinales', error: error.message });
    }
  }

  async uploadMatinalPdf(req: any, res: Response): Promise<Response> {
    try {
      if (!(await verificarPermisosAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Administrador.' });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se ha seleccionado ningún archivo.' });
      }
      
      const date = req.query.date ? String(req.query.date) : req.body.date;
      if (!date) {
        return res.status(400).json({ success: false, message: 'Se requiere especificar la fecha del sábado.' });
      }

      let fileUrlOrName = '';

      if (isCloudinaryConfigured() && req.file.buffer) {
        const uploadResult = await uploadBufferToCloudinary(
          req.file.buffer,
          'matinales',
          `matinal-${req.params.id}-${req.file.originalname}`
        );
        fileUrlOrName = uploadResult.secure_url;
      } else if (req.file.filename) {
        fileUrlOrName = req.file.filename;
      } else {
        return res.status(500).json({ success: false, message: 'Error al procesar el archivo.' });
      }

      const updated = matinalesService.updateMatinalPdf(
        parseInt(req.params.id), 
        fileUrlOrName, 
        req.file.originalname, 
        date
      );
      return res.status(200).json({ success: true, message: 'Material guardado correctamente en la nube.', data: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error en el servidor al procesar archivo.', error: error.message });
    }
  }

  async updateMatinal(req: any, res: Response): Promise<Response> {
    try {
      if (!(await verificarPermisosAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Operación exclusiva de administradores.' });
      }
      
      const date = req.query.date ? String(req.query.date) : req.body.date;
      if (!date) {
        return res.status(400).json({ success: false, message: 'Se requiere especificar la fecha del sábado.' });
      }

      const updated = matinalesService.updateMatinalInfo(parseInt(req.params.id), req.body, date);
      return res.status(200).json({ success: true, message: 'Configuración actualizada con éxito.', data: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al guardar los campos del formulario.', error: error.message });
    }
  }

  async deleteMatinalPdf(req: any, res: Response): Promise<Response> {
    try {
      if (!(await verificarPermisosAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Operación exclusiva de administradores.' });
      }
      
      const date = req.query.date ? String(req.query.date) : req.body.date;
      if (!date) {
        return res.status(400).json({ success: false, message: 'Se requiere especificar la fecha del sábado.' });
      }

      const fileUrl = req.query.fileUrl || req.body.fileUrl;
      const updated = matinalesService.removeMatinalPdf(parseInt(req.params.id), date, fileUrl ? String(fileUrl) : undefined);
      return res.status(200).json({ success: true, message: 'Archivo removido de forma permanente.', data: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al purgar el archivo.', error: error.message });
    }
  }
}

export const matinalesController = new MatinalesController();