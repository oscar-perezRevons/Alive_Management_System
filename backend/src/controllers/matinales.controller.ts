import { Response } from 'express';
import { matinalesService } from '../services/matinales.service';
import prisma from '../config/database';

export class MatinalesController {
  async getMatinales(req: any, res: Response): Promise<Response> {
    try {
      const matinales = matinalesService.getMatinalesData();
      return res.status(200).json({ success: true, matinales });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al obtener matinales', error: error.message });
    }
  }

  async uploadMatinalPdf(req: any, res: Response): Promise<Response> {
    try {
      const matinalId = parseInt(req.params.id);

      let userRole = 
        req.user?.role || 
        req.user?.user?.role || 
        req.userRole || 
        req.role || 
        req.headers['x-user-role'];

      const userId = 
        req.userId || 
        req.user?.id || 
        req.user?.userId || 
        req.user?.sub || 
        req.user?.user?.id;

      const userEmail = 
        req.userEmail || 
        req.user?.email || 
        req.user?.user?.email;

      if (!userRole && (userId || userEmail)) {
        const dbUser = await (prisma as any).user.findFirst({
          where: {
            OR: [
              userId ? { id: Number(userId) } : undefined,
              userEmail ? { email: String(userEmail) } : undefined
            ].filter(Boolean) as any
          }
        });
        if (dbUser) {
          userRole = dbUser.role;
        }
      }

      const normalizedRole = String(userRole || '').trim().toUpperCase();

      if (normalizedRole !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: `Acceso denegado. Rol detectado: '${normalizedRole || 'INDEFINIDO'}'. Se requiere explícitamente el rol de 'ADMIN'.`
        });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se ha seleccionado ningún archivo PDF.' });
      }

      const filename = req.file.filename;
      const updated = matinalesService.updateMatinalPdf(matinalId, filename);

      return res.status(200).json({
        success: true,
        message: 'Folleto devocional guardado y sincronizado correctamente.',
        data: updated
      });

    } catch (error: any) {
      console.error('Error crítico en uploadMatinalPdf:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno en el servidor al procesar el archivo.',
        error: error.message
      });
    }
  }
}

export const matinalesController = new MatinalesController();