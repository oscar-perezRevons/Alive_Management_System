import { Response } from 'express';
import prisma from '../config/database';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

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

    let dbUser = null;
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

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export class MaterialsController {
  async getMaterials(req: any, res: Response): Promise<Response> {
    try {
      const isAdmin = await verificarPermisosAdmin(req);
      
      const materials = await (prisma as any).material.findMany({
        where: isAdmin ? {} : { isVisible: true },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json({ success: true, materials });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al obtener materiales', error: error.message });
    }
  }

  async uploadMaterial(req: any, res: Response): Promise<Response> {
    try {
      if (!(await verificarPermisosAdmin(req))) {
        // Borrar el archivo subido si no es admin para no dejar basura
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Administrador.' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se ha seleccionado ningún archivo.' });
      }

      const { title, description, category } = req.body;
      if (!title || !category) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: 'El título y la categoría son obligatorios.' });
      }

      const sizeFormatted = formatSize(req.file.size);
      
      // Determinar si es PDF o IMAGEN por mimetype
      const type = req.file.mimetype === 'application/pdf' ? 'PDF' : 'IMAGE';
      const fileUrl = `/uploads/materials/${req.file.filename}`;

      const newMaterial = await (prisma as any).material.create({
        data: {
          title,
          description: description || '',
          category,
          type,
          size: sizeFormatted,
          fileUrl,
          isVisible: true
        }
      });

      return res.status(201).json({ success: true, message: 'Material subido correctamente.', material: newMaterial });
    } catch (error: any) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ success: false, message: 'Error al subir material', error: error.message });
    }
  }

  async toggleVisibility(req: any, res: Response): Promise<Response> {
    try {
      if (!(await verificarPermisosAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Administrador.' });
      }

      const id = parseInt(req.params.id);
      const material = await (prisma as any).material.findUnique({ where: { id } });

      if (!material) {
        return res.status(404).json({ success: false, message: 'Material no encontrado.' });
      }

      const updated = await (prisma as any).material.update({
        where: { id },
        data: { isVisible: !material.isVisible }
      });

      return res.status(200).json({ success: true, message: 'Visibilidad del material actualizada.', material: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al cambiar visibilidad', error: error.message });
    }
  }

  async deleteMaterial(req: any, res: Response): Promise<Response> {
    try {
      if (!(await verificarPermisosAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Administrador.' });
      }

      const id = parseInt(req.params.id);
      const material = await (prisma as any).material.findUnique({ where: { id } });

      if (!material) {
        return res.status(404).json({ success: false, message: 'Material no encontrado.' });
      }

      // Eliminar el archivo físico
      const filename = path.basename(material.fileUrl);
      const filepath = path.join(__dirname, '../../uploads/materials', filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }

      await (prisma as any).material.delete({ where: { id } });

      return res.status(200).json({ success: true, message: 'Material eliminado de forma permanente.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al eliminar material', error: error.message });
    }
  }

  async updateMaterial(req: any, res: Response): Promise<Response> {
    try {
      if (!(await verificarPermisosAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Administrador.' });
      }

      const id = parseInt(req.params.id);
      const material = await (prisma as any).material.findUnique({ where: { id } });

      if (!material) {
        return res.status(404).json({ success: false, message: 'Material no encontrado.' });
      }

      const { title, description, category } = req.body;
      if (!title || !category) {
        return res.status(400).json({ success: false, message: 'El título y la categoría son obligatorios.' });
      }

      const updated = await (prisma as any).material.update({
        where: { id },
        data: {
          title,
          description: description || '',
          category
        }
      });

      return res.status(200).json({ success: true, message: 'Material actualizado correctamente.', material: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al actualizar material', error: error.message });
    }
  }

  async getCategories(req: any, res: Response): Promise<Response> {
    try {
      const categories = await (prisma as any).materialCategory.findMany({
        orderBy: { name: 'asc' }
      });
      return res.status(200).json({ success: true, categories });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al obtener categorías', error: error.message });
    }
  }

  async createCategory(req: any, res: Response): Promise<Response> {
    try {
      if (!(await verificarPermisosAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Administrador.' });
      }

      const { name } = req.body;
      if (!name || String(name).trim() === '') {
        return res.status(400).json({ success: false, message: 'El nombre de la categoría es obligatorio.' });
      }

      const trimmedName = String(name).trim();

      const existing = await (prisma as any).materialCategory.findUnique({
        where: { name: trimmedName }
      });

      if (existing) {
        return res.status(400).json({ success: false, message: 'La categoría ya existe.' });
      }

      const newCategory = await (prisma as any).materialCategory.create({
        data: { name: trimmedName }
      });

      return res.status(201).json({ success: true, message: 'Categoría creada con éxito.', category: newCategory });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al crear categoría', error: error.message });
    }
  }
}

export const materialsController = new MaterialsController();
