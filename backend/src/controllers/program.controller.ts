import { Response } from 'express';
import { ProgramService } from '../services/program.service';
import fs from 'fs';
import path from 'path';

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

  async getGuidePdf(req: any, res: Response) {
    try {
      const filePath = './uploads/programa/programa-guia.pdf';
      if (fs.existsSync(filePath)) {
        const serverUrl = `${req.protocol}://${req.get('host')}`;
        return res.json({ pdfUrl: `${serverUrl}/uploads/programa/programa-guia.pdf` });
      }
      return res.json({ pdfUrl: null });
    } catch (error) {
      return res.status(500).json({ error: 'Error al consultar el programa guía.' });
    }
  }

  async uploadGuidePdf(req: any, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se ha seleccionado ningún archivo PDF.' });
      }

      // Parsear texto del PDF
      const pdf = require('pdf-parse');
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdf(dataBuffer);
      const text = pdfData.text || '';

      // Normalizar texto: unir líneas que no inician con horario
      const rawLines = text.split('\n');
      const lines: string[] = [];
      let currentLine = '';

      for (const line of rawLines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Si inicia con formato de hora (ej: "09:00" o "18:45")
        if (trimmed.match(/^(\d{1,2}:\d{2})/)) {
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = trimmed;
        } else {
          // Concatenar con la línea actual si existe, si no iniciar una
          if (currentLine) {
            currentLine += ' ' + trimmed;
          } else {
            currentLine = trimmed;
          }
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }

      const parsedEvents: any[] = [];
      let currentOrder = 1;

      for (const line of lines) {
        const trimmed = line.trim();
        
        // Comprueba si inicia con un horario
        const timeMatch = trimmed.match(/^(\d{1,2}:\d{2})/);
        if (timeMatch) {
          const timeSlot = timeMatch[1];
          let remaining = trimmed.substring(timeMatch[0].length).trim();

          // Limpiar separadores iniciales
          if (remaining.startsWith('-') || remaining.startsWith(':')) {
            remaining = remaining.substring(1).trim();
          }

          // Capturar Responsable entre paréntesis: (Responsable: Juan) o (Por: Juan)
          let responsible = '-';
          const respMatch = remaining.match(/\((?:Responsable:|resp:|por:|dirige:)?\s*([^\)]+)\)/i);
          if (respMatch) {
            responsible = respMatch[1].trim();
            remaining = remaining.replace(respMatch[0], '').trim();
          }

          // Capturar Descripción entre corchetes: [Descripción: Comentario] o [desc: ...]
          let description = '';
          const descMatch = remaining.match(/\[(?:Descripción:|descripcion:|desc:|detalles:|detalle:|info:)?\s*([^\]]+)\]/i);
          if (descMatch) {
            description = descMatch[1].trim();
            remaining = remaining.replace(descMatch[0], '').trim();
          }

          const title = remaining.trim() || 'Punto del Programa';

          parsedEvents.push({
            timeSlot,
            title,
            description,
            responsible,
            order: currentOrder++
          });
        }
      }

      const serverUrl = `${req.protocol}://${req.get('host')}`;
      return res.status(200).json({
        success: true,
        message: '¡Programa guía en formato PDF subido y analizado con éxito!',
        pdfUrl: `${serverUrl}/uploads/programa/programa-guia.pdf`,
        parsedEvents
      });
    } catch (error: any) {
      console.error('Error al analizar PDF de guía:', error);
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  async deleteGuidePdf(req: any, res: Response) {
    try {
      const filePath = './uploads/programa/programa-guia.pdf';
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(200).json({ success: true, message: 'Programa guía eliminado correctamente.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const programController = new ProgramController();