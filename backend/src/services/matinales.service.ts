import fs from 'fs';
import path from 'path';
import { deleteFromCloudinary } from './cloudinary.service';

interface MatinalItem {
  id: number;
  category: string;
  range: string;
  currentTheme: string;
  pdfUrl: string | null;
  fileName?: string | null;
  fileType?: 'pdf' | 'image' | null;
  files?: SaturdayUpload[];
}

interface SaturdayUpload {
  fileUrl: string;
  fileName: string;
  fileType: 'pdf' | 'image';
  uploadedAt: string;
}

interface SaturdayRegistry {
  [date: string]: {
    [matinalId: string]: SaturdayUpload | SaturdayUpload[];
  };
}

const dataDir = path.join(__dirname, '../../data');
const registryPath = path.join(dataDir, 'matinales_saturdays.json');

// Ensure directories exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let matinalesStaticData = [
  { id: 1, category: 'Niños', range: '6 a 10 años', currentTheme: 'Historias del Antiguo Testamento' },
  { id: 2, category: 'Adolescentes', range: '11 a 16 años', currentTheme: 'Decisiones y Valores Cristianos' },
  { id: 3, category: 'Jóvenes', range: '17 a 30 años', currentTheme: 'Fidelidad en Tiempos Modernos' },
  { id: 4, category: 'Mujeres', range: '20 a 35 años', currentTheme: 'Mujeres de Fe y Oración' },
  { id: 5, category: 'Adultos', range: '30 años en adelante', currentTheme: 'Estudio de las Profecías' }
];

export class MatinalesService {
  private loadRegistry(): SaturdayRegistry {
    try {
      if (fs.existsSync(registryPath)) {
        const raw = fs.readFileSync(registryPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error al leer registro de matinales:', err);
    }
    return {};
  }

  private saveRegistry(registry: SaturdayRegistry) {
    try {
      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error al guardar registro de matinales:', err);
    }
  }

  getMatinalesData(date?: string): MatinalItem[] {
    const registry = this.loadRegistry();
    const targetDate = date || this.getUpcomingSaturdayStr();
    const dateUploads = registry[targetDate] || {};

    return matinalesStaticData.map(item => {
      const uploadsRaw = dateUploads[String(item.id)] || [];
      // Normalize single uploads to array
      const files: SaturdayUpload[] = Array.isArray(uploadsRaw) ? uploadsRaw : [uploadsRaw].filter(Boolean);
      
      const primaryUpload = files[0] || null;
      return {
        ...item,
        pdfUrl: primaryUpload ? primaryUpload.fileUrl : null,
        fileName: primaryUpload ? primaryUpload.fileName : null,
        fileType: primaryUpload ? primaryUpload.fileType : null,
        files: files
      };
    });
  }

  private getUpcomingSaturdayStr(): string {
    const today = new Date();
    const day = today.getDay();
    const diff = 6 - day; 
    const upcoming = new Date(today);
    upcoming.setDate(today.getDate() + diff);
    
    const yyyy = upcoming.getFullYear();
    const mm = String(upcoming.getMonth() + 1).padStart(2, '0');
    const dd = String(upcoming.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  updateMatinalPdf(id: number, filenameOrUrl: string, originalName: string, date: string) {
    const registry = this.loadRegistry();
    if (!registry[date]) {
      registry[date] = {};
    }

    const fileUrl = filenameOrUrl.startsWith('http')
      ? filenameOrUrl
      : `/uploads/matinales/${filenameOrUrl}`;

    const isPdf = originalName.toLowerCase().endsWith('.pdf') || filenameOrUrl.toLowerCase().endsWith('.pdf');
    const fileType = isPdf ? 'pdf' : 'image';
    
    const currentUploadsRaw = registry[date][String(id)] || [];
    const currentUploads: SaturdayUpload[] = Array.isArray(currentUploadsRaw) ? currentUploadsRaw : [currentUploadsRaw].filter(Boolean);

    if (currentUploads.length >= 2) {
      if (!filenameOrUrl.startsWith('http')) {
        const tempPath = path.join(__dirname, '../../uploads/matinales', filenameOrUrl);
        try {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        } catch (err) {
          console.error('Error clean up temp file:', err);
        }
      } else {
        deleteFromCloudinary(filenameOrUrl).catch(() => {});
      }
      throw new Error('Límite alcanzado: máximo de 2 archivos por categoría.');
    }

    const newUpload: SaturdayUpload = {
      fileUrl,
      fileName: originalName,
      fileType,
      uploadedAt: new Date().toISOString()
    };

    registry[date][String(id)] = [...currentUploads, newUpload];

    this.saveRegistry(registry);
    return this.getMatinalesData(date).find(m => m.id === id);
  }

  updateMatinalInfo(id: number, data: Partial<Omit<MatinalItem, 'id' | 'pdfUrl'>>, date: string) {
    const item = matinalesStaticData.find(m => m.id === id);
    if (item) {
      if (data.category) item.category = data.category;
      if (data.range) item.range = data.range;
      if (data.currentTheme !== undefined) item.currentTheme = data.currentTheme;
    }
    return this.getMatinalesData(date).find(m => m.id === id);
  }

  removeMatinalPdf(id: number, date: string, fileUrl?: string) {
    const registry = this.loadRegistry();
    if (registry[date] && registry[date][String(id)]) {
      const uploadsRaw = registry[date][String(id)];
      const uploads: SaturdayUpload[] = Array.isArray(uploadsRaw) ? uploadsRaw : [uploadsRaw].filter(Boolean);

      const targetIndex = fileUrl
        ? uploads.findIndex(u => u.fileUrl === fileUrl)
        : 0;

      if (targetIndex !== -1 && uploads[targetIndex]) {
        const upload = uploads[targetIndex];
        if (upload.fileUrl.includes('cloudinary.com')) {
          deleteFromCloudinary(upload.fileUrl).catch(() => {});
        } else {
          const filePath = path.join(__dirname, '../../', upload.fileUrl);
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (err) {
            console.error('Error al eliminar archivo físico:', err);
          }
        }
        
        uploads.splice(targetIndex, 1);
      }

      if (uploads.length > 0) {
        registry[date][String(id)] = uploads;
      } else {
        delete registry[date][String(id)];
      }

      if (Object.keys(registry[date]).length === 0) {
        delete registry[date];
      }
      this.saveRegistry(registry);
    }
    return this.getMatinalesData(date).find(m => m.id === id);
  }
}

export const matinalesService = new MatinalesService();