import { Response } from 'express';
import prisma from '../config/database';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { uploadBufferToCloudinary, isCloudinaryConfigured, deleteFromCloudinary } from '../services/cloudinary.service';

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
      const files: any[] = req.files || (req.file ? [req.file] : []);
      if (!(await verificarPermisosAdmin(req))) {
        files.forEach((f: any) => { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); });
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Administrador.' });
      }

      if (files.length === 0) {
        return res.status(400).json({ success: false, message: 'No se ha seleccionado ningún archivo.' });
      }

      const { title, description, category } = req.body;
      if (!title || !category) {
        files.forEach((f: any) => { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); });
        return res.status(400).json({ success: false, message: 'El título y la categoría son obligatorios.' });
      }

      const f1 = files[0];
      const type1 = f1.mimetype === 'application/pdf' ? 'PDF' : 'IMAGE';
      const size1 = formatSize(f1.size);
      let fileUrl1 = '';

      if (isCloudinaryConfigured() && f1.buffer) {
        const upload1 = await uploadBufferToCloudinary(f1.buffer, 'materials', f1.originalname);
        fileUrl1 = upload1.secure_url;
      } else if (f1.filename) {
        fileUrl1 = `/uploads/materials/${f1.filename}`;
      }

      // Validate: never save a material with an empty file URL
      if (!fileUrl1) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo almacenar el archivo. Cloudinary no está configurado o el archivo no fue procesado correctamente.'
        });
      }

      let type2 = '';
      let size2 = '';
      let fileUrl2 = '';

      if (files.length > 1) {
        const f2 = files[1];
        type2 = f2.mimetype === 'application/pdf' ? 'PDF' : 'IMAGE';
        size2 = formatSize(f2.size);
        if (isCloudinaryConfigured() && f2.buffer) {
          const upload2 = await uploadBufferToCloudinary(f2.buffer, 'materials', f2.originalname);
          fileUrl2 = upload2.secure_url;
        } else if (f2.filename) {
          fileUrl2 = `/uploads/materials/${f2.filename}`;
        }
        // fileUrl2 is optional so we don't validate it the same way
      }

      const newMaterial = await (prisma as any).material.create({
        data: {
          title,
          description: description || '',
          category,
          type: type1,
          size: size1,
          fileUrl: fileUrl1,
          type2,
          size2,
          fileUrl2,
          isVisible: true
        }
      });

      return res.status(201).json({ success: true, message: 'Material subido correctamente en la nube.', material: newMaterial });
    } catch (error: any) {
      const files: any[] = req.files || (req.file ? [req.file] : []);
      files.forEach((f: any) => { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); });
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

      // Eliminar los archivos físicos o de Cloudinary
      if (material.fileUrl) {
        if (material.fileUrl.includes('cloudinary.com')) {
          deleteFromCloudinary(material.fileUrl).catch(() => {});
        } else {
          const filename = path.basename(material.fileUrl);
          const filepath = path.join(__dirname, '../../uploads/materials', filename);
          if (fs.existsSync(filepath)) {
            try { fs.unlinkSync(filepath); } catch (e) {}
          }
        }
      }

      if (material.fileUrl2) {
        if (material.fileUrl2.includes('cloudinary.com')) {
          deleteFromCloudinary(material.fileUrl2).catch(() => {});
        } else {
          const filename2 = path.basename(material.fileUrl2);
          const filepath2 = path.join(__dirname, '../../uploads/materials', filename2);
          if (fs.existsSync(filepath2)) {
            try { fs.unlinkSync(filepath2); } catch (e) {}
          }
        }
      }

      await (prisma as any).material.delete({ where: { id } });

      return res.status(200).json({ success: true, message: 'Material eliminado de forma permanente.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error al eliminar material', error: error.message });
    }
  }

  async updateMaterial(req: any, res: Response): Promise<Response> {
    try {
      const files: any[] = req.files || (req.file ? [req.file] : []);
      if (!(await verificarPermisosAdmin(req))) {
        files.forEach((f: any) => { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); });
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Administrador.' });
      }

      const id = parseInt(req.params.id);
      const material = await (prisma as any).material.findUnique({ where: { id } });

      if (!material) {
        files.forEach((f: any) => { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); });
        return res.status(404).json({ success: false, message: 'Material no encontrado.' });
      }

      const { title, description, category } = req.body;
      if (!title || !category) {
        files.forEach((f: any) => { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); });
        return res.status(400).json({ success: false, message: 'El título y la categoría son obligatorios.' });
      }

      const updateData: any = {
        title,
        description: description || '',
        category
      };

      if (files.length > 0) {
        // Eliminar el archivo antiguo 1 del servidor o Cloudinary
        if (material.fileUrl) {
          if (material.fileUrl.includes('cloudinary.com')) {
            deleteFromCloudinary(material.fileUrl).catch(() => {});
          } else {
            const oldFilename = path.basename(material.fileUrl);
            const oldFilepath = path.join(__dirname, '../../uploads/materials', oldFilename);
            if (fs.existsSync(oldFilepath)) {
              try { fs.unlinkSync(oldFilepath); } catch (e) {}
            }
          }
        }
        // Eliminar el archivo antiguo 2 del servidor o Cloudinary
        if (material.fileUrl2) {
          if (material.fileUrl2.includes('cloudinary.com')) {
            deleteFromCloudinary(material.fileUrl2).catch(() => {});
          } else {
            const oldFilename2 = path.basename(material.fileUrl2);
            const oldFilepath2 = path.join(__dirname, '../../uploads/materials', oldFilename2);
            if (fs.existsSync(oldFilepath2)) {
              try { fs.unlinkSync(oldFilepath2); } catch (e) {}
            }
          }
        }

        const f1 = files[0];
        updateData.size = formatSize(f1.size);
        updateData.type = f1.mimetype === 'application/pdf' ? 'PDF' : 'IMAGE';
        if (isCloudinaryConfigured() && f1.buffer) {
          const up1 = await uploadBufferToCloudinary(f1.buffer, 'materials', f1.originalname);
          updateData.fileUrl = up1.secure_url;
        } else if (f1.filename) {
          updateData.fileUrl = `/uploads/materials/${f1.filename}`;
        }

        // Validate: never update to an empty file URL
        if (!updateData.fileUrl) {
          return res.status(500).json({
            success: false,
            message: 'No se pudo almacenar el archivo de reemplazo. Cloudinary no está configurado o el archivo no fue procesado correctamente.'
          });
        }

        if (files.length > 1) {
          const f2 = files[1];
          updateData.size2 = formatSize(f2.size);
          updateData.type2 = f2.mimetype === 'application/pdf' ? 'PDF' : 'IMAGE';
          if (isCloudinaryConfigured() && f2.buffer) {
            const up2 = await uploadBufferToCloudinary(f2.buffer, 'materials', f2.originalname);
            updateData.fileUrl2 = up2.secure_url;
          } else if (f2.filename) {
            updateData.fileUrl2 = `/uploads/materials/${f2.filename}`;
          }
        } else {
          updateData.size2 = '';
          updateData.type2 = '';
          updateData.fileUrl2 = '';
        }
      }

      const updated = await (prisma as any).material.update({
        where: { id },
        data: updateData
      });

      return res.status(200).json({ success: true, message: 'Material actualizado correctamente.', material: updated });
    } catch (error: any) {
      const files: any[] = req.files || (req.file ? [req.file] : []);
      files.forEach((f: any) => { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); });
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

  /**
   * Migrates materials stored with local file paths (/uploads/...) to Cloudinary.
   * This is a one-time admin utility to ensure all files are cloud-persisted.
   */
  async migrateLocalToCloudinary(req: any, res: Response): Promise<Response> {
    try {
      if (!(await verificarPermisosAdmin(req))) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Administrador.' });
      }

      if (!isCloudinaryConfigured()) {
        return res.status(400).json({ success: false, message: 'Cloudinary no está configurado. No se puede realizar la migración.' });
      }

      const allMaterials = await (prisma as any).material.findMany();
      const results: { id: number; title: string; status: string; error?: string }[] = [];

      for (const material of allMaterials) {
        const needsMigration1 = material.fileUrl && material.fileUrl.startsWith('/uploads/');
        const needsMigration2 = material.fileUrl2 && material.fileUrl2.startsWith('/uploads/');

        if (!needsMigration1 && !needsMigration2) {
          results.push({ id: material.id, title: material.title, status: 'skipped (already on Cloudinary or no local path)' });
          continue;
        }

        const updateData: any = {};

        try {
          if (needsMigration1) {
            const localPath = path.join(__dirname, '../../', material.fileUrl);
            if (fs.existsSync(localPath)) {
              const buffer = fs.readFileSync(localPath);
              const filename = path.basename(material.fileUrl);
              const uploaded = await uploadBufferToCloudinary(buffer, 'materials', filename);
              updateData.fileUrl = uploaded.secure_url;
            } else {
              results.push({ id: material.id, title: material.title, status: 'error', error: `Local file not found: ${localPath}` });
              continue;
            }
          }

          if (needsMigration2) {
            const localPath2 = path.join(__dirname, '../../', material.fileUrl2);
            if (fs.existsSync(localPath2)) {
              const buffer2 = fs.readFileSync(localPath2);
              const filename2 = path.basename(material.fileUrl2);
              const uploaded2 = await uploadBufferToCloudinary(buffer2, 'materials', filename2);
              updateData.fileUrl2 = uploaded2.secure_url;
            }
            // fileUrl2 is optional — if local file is missing, just clear it
            else {
              updateData.fileUrl2 = '';
            }
          }

          await (prisma as any).material.update({
            where: { id: material.id },
            data: updateData
          });

          results.push({ id: material.id, title: material.title, status: 'migrated to Cloudinary' });
        } catch (err: any) {
          results.push({ id: material.id, title: material.title, status: 'error', error: err.message });
        }
      }

      const migrated = results.filter(r => r.status === 'migrated to Cloudinary').length;
      const skipped = results.filter(r => r.status.startsWith('skipped')).length;
      const errors = results.filter(r => r.status === 'error').length;

      return res.status(200).json({
        success: true,
        message: `Migración completada: ${migrated} migrados, ${skipped} omitidos, ${errors} errores.`,
        results
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Error durante la migración', error: error.message });
    }
  }
}

export const materialsController = new MaterialsController();

