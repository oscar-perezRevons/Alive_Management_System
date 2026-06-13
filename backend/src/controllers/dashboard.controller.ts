import { Response } from 'express';
import { AuthRequest } from '../types';
import { DashboardService } from '../services/dashboard.service';

const dashboardService = new DashboardService();

export class DashboardController {
  async getHomeData(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ 
          error: 'No autorizado', 
          message: 'Se requiere una sesión activa para consumir este recurso.' 
        });
      }

      const data = await dashboardService.getHomeData();
      return res.json(data);
    } catch (error: any) {
      console.error('Error en DashboardController:', error);
      return res.status(500).json({ 
        error: 'Error interno del servidor', 
        message: error.message 
      });
    }
  }
}

export const dashboardController = new DashboardController();