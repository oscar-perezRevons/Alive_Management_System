interface MatinalItem {
  id: number;
  category: string;
  range: string;
  responsible: string;
  currentTheme: string;
  nextDate: string;
  pdfUrl: string | null;
}

let matinalesRealData: MatinalItem[] = [
  { id: 1, category: 'Niños', range: '6 a 10 años', responsible: 'Ana Flores', currentTheme: 'Historias del Antiguo Testamento', nextDate: '27/06/2026', pdfUrl: null },
  { id: 2, category: 'Adolescentes', range: '11 a 16 años', responsible: 'Luis Ramos', currentTheme: 'Decisiones y Valores Cristianos', nextDate: '27/06/2026', pdfUrl: null },
  { id: 3, category: 'Jóvenes', range: '17 a 30 años', responsible: 'Mario Pérez', currentTheme: 'Fidelidad en Tiempos Modernos', nextDate: '04/07/2026', pdfUrl: null },
  { id: 4, category: 'Mujeres', range: '20 a 35 años', responsible: 'Sofía Hernández', currentTheme: 'Mujeres de Fe y Oración', nextDate: '27/06/2026', pdfUrl: null },
  { id: 5, category: 'Adultos', range: '30 años en adelante', responsible: 'Pastor Central', currentTheme: 'Estudio de las Profecías', nextDate: '11/07/2026', pdfUrl: null }
];

export class MatinalesService {
  getMatinalesData() {
    return matinalesRealData;
  }

  updateMatinalPdf(id: number, filename: string) {
    const matinal = matinalesRealData.find(m => m.id === id);
    if (matinal) {
      matinal.pdfUrl = `/uploads/matinales/${filename}`;
    }
    return matinal;
  }
}

export const matinalesService = new MatinalesService();