import { Response } from 'express';
import { ProgramService } from '../services/program.service';

const programService = new ProgramService();

export class ProgramController {
  async getFullSchedule(req: any, res: Response) {
    try {
      const events = await programService.getProgramEvents();
      return res.json({ events });
    } catch (error) {
      return res.status(500).json({ error: 'Error al obtener el cronograma.' });
    }
  }

  async storeEvent(req: any, res: Response) {
    try {
      const newEvent = await programService.createEvent({ ...req.body, order: Number(req.body.order || 0) });
      return res.status(201).json(newEvent);
    } catch (error) {
      return res.status(400).json({ error: 'Error al inyectar el bloque.' });
    }
  }

  async modifyEvent(req: any, res: Response) {
    try {
      const updated = await programService.updateEvent(parseInt(req.params.id), req.body);
      return res.json(updated);
    } catch (error) {
      return res.status(400).json({ error: 'No se pudo actualizar el bloque.' });
    }
  }

  async removeEvent(req: any, res: Response) {
    try {
      await programService.deleteEvent(parseInt(req.params.id));
      return res.json({ message: 'Bloque purgado.' });
    } catch (error) {
      return res.status(400).json({ error: 'Error al eliminar.' });
    }
  }
}

export const programController = new ProgramController();