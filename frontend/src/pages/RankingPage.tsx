import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { rankingService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { resolveAccessRole } from '../utils/access';
import { 
  Trophy, Shield, Star, RefreshCw,
  ArrowUp, ArrowDown, Calendar, Download, Settings2, X, Clock, Zap, TrendingUp, FileText, BarChart3, Sparkles,
  Maximize2, Minimize2, Eye, EyeOff
} from 'lucide-react';

// ─── Custom Loader animation matching reference image ───────────────────────
const CustomLoader = () => (
  <div className="flex flex-col items-center justify-center py-20 space-y-6 select-none animate-[fadeInUp_0.4s_ease_both]">
    <div className="flex items-center gap-5">
      {/* Three sequential horizontal lines */}
      <div className="flex gap-2 items-center">
        <div className="w-8 h-1 rounded-full animate-[loadingBar_1.4s_infinite]" style={{ animationDelay: '0s' }} />
        <div className="w-8 h-1 rounded-full animate-[loadingBar_1.4s_infinite]" style={{ animationDelay: '0.2s' }} />
        <div className="w-8 h-1 rounded-full animate-[loadingBar_1.4s_infinite]" style={{ animationDelay: '0.4s' }} />
      </div>

      {/* Hexagon with two columns inside */}
      <div className="relative w-16 h-16 flex items-center justify-center animate-[glowPulse_2s_infinite_alternate]">
        <svg viewBox="0 0 100 100" className="w-full h-full text-indigo-500 stroke-current fill-none stroke-[6] stroke-linejoin-round">
          <polygon points="50,6 93,31 93,80 50,95 7,80 7,31" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 pt-0.5">
          <div className="w-2.5 h-6.5 bg-indigo-600 rounded-full animate-[pulse_1.5s_infinite_alternate]" />
          <div className="w-2.5 h-6.5 bg-indigo-600 rounded-full animate-[pulse_1.5s_infinite_alternate_0.3s]" />
        </div>
      </div>
    </div>
    
    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500/80 dark:text-slate-400">
      Cargando Información...
    </p>
  </div>
);

// ─── Animated border wrapper ─────────────────────────────────────────────────
const FlowBorder = ({ children, gradient, className = '' }: { children: React.ReactNode; gradient: string; className?: string }) => (
  <div className={`p-[2.5px] rounded-3xl ${className}`} style={{ background: gradient, backgroundSize: '400% 400%', animation: 'borderFlow 5s ease infinite' }}>
    <div className="bg-white dark:bg-slate-900 rounded-[22px] overflow-hidden h-full text-slate-800 dark:text-slate-100 transition-colors duration-300">{children}</div>
  </div>
);

// ─── Modal wrapper with animated border ─────────────────────────────────────
const ModalWrap = ({ children, gradient, maxW = 'max-w-md' }: { children: React.ReactNode; gradient: string; maxW?: string }) => (
  <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ animation: 'fadeInUp 0.25s ease both' }}>
    <div className={`p-[2.5px] rounded-3xl ${maxW} w-full`} style={{ background: gradient, backgroundSize: '400% 400%', animation: 'borderFlow 5s ease infinite' }}>
      <div className="bg-white dark:bg-slate-900 rounded-[22px] overflow-hidden shadow-2xl text-slate-800 dark:text-slate-100 transition-colors duration-300">{children}</div>
    </div>
  </div>
);

// ─── Date utilities ──────────────────────────────────────────────────────────
const formatDateToSpanish = (isoDate: string): string => {
  if (!isoDate) return '';
  const m = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const [y, mo, d] = isoDate.split('-');
  return `${parseInt(d)} de ${m[parseInt(mo)-1]} de ${y}`;
};
const formatDateToISO = (spanishDate: string): string => {
  const m: Record<string,string> = {'enero':'01','febrero':'02','marzo':'03','abril':'04','mayo':'05','junio':'06','julio':'07','agosto':'08','septiembre':'09','octubre':'10','noviembre':'11','diciembre':'12'};
  const p = spanishDate.toLowerCase().replace(/\s+/g,' ').split(' de ');
  if (p.length !== 3) return '';
  return `${p[2]}-${m[p[1]]||'01'}-${p[0].padStart(2,'0')}`;
};

// ─── Gradients palette (no green) ───────────────────────────────────────────
const G = {
  violet:  'linear-gradient(270deg,#6366f1,#8b5cf6,#d946ef,#ec4899,#6366f1)',
  indigo:  'linear-gradient(270deg,#4f46e5,#6366f1,#8b5cf6,#7c3aed,#4f46e5)',
  rose:    'linear-gradient(270deg,#f43f5e,#ec4899,#d946ef,#8b5cf6,#f43f5e)',
  fuchsia: 'linear-gradient(270deg,#d946ef,#a855f7,#6366f1,#ec4899,#d946ef)',
  amber:   'linear-gradient(270deg,#f59e0b,#ef4444,#ec4899,#f59e0b,#f59e0b)',
};

export const RankingPage: React.FC = () => {
  const { user } = useAuthStore();
  const accessRole = resolveAccessRole(user);
  const isAdmin = accessRole === 'ADMIN';

  const [grupos, setGrupos]           = useState<any[]>([]);
  const [tablaRanking, setTablaRanking] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);
  const [loading, setLoading]         = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen]   = useState(false);
  const [isDateConfigOpen, setIsDateConfigOpen]     = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen]     = useState(false);
  const [hideScores, setHideScores]                 = useState(false);
  const [revealedIds, setRevealedIds]               = useState<Record<number, boolean>>({});

  const [isDarkTheme, setIsDarkTheme]               = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkTheme(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const [fechaPublicacion, setFechaPublicacion] = useState('15 de junio de 2026');
  const [tempFechaPublicacion, setTempFechaPublicacion] = useState('2026-06-15');
  const [progressLoading, setProgressLoading] = useState(false);

  const [grupoProgreso, setGrupoProgreso] = useState<any>({
    grupoInfo: { name:'', totalPoints:0, variation:0, posicionActual:'-' },
    desgloseAreas: [],
    historialReciente: []
  });

  const [notification, setNotification] = useState({ isOpen:false, message:'' });
  const triggerToast = (message: string) => {
    setNotification({ isOpen:true, message });
    setTimeout(() => setNotification({ isOpen:false, message:'' }), 3500);
  };

  const formatearFechaActual = useCallback(() => {
    const d = new Date();
    const m = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    setLastUpdated(`${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
  }, []);

  const cargarRankingGlobal = useCallback(async () => {
    try {
      setLoading(true);
      const res = await rankingService.getGeneral();
      const fetchedRanking = res.data.ranking || [];
      const fetchedGrupos  = res.data.grupos  || [];
      const visibleGroups  = isAdmin ? fetchedGrupos : fetchedGrupos.slice(0,1);
      const fallback       = visibleGroups[0]?.id || 0;
      const effectiveId    = selectedGroupId!==0 && visibleGroups.some((g:any)=>g.id===selectedGroupId) ? selectedGroupId : fallback;
      setGrupos(visibleGroups);
      setSelectedGroupId(effectiveId);
      setTablaRanking(isAdmin ? fetchedRanking : fetchedRanking.filter((it:any)=>it.id===effectiveId));
      formatearFechaActual();
    } catch { triggerToast('Error al conectar con el servidor.'); }
    finally { setLoading(false); setInitialLoad(false); }
  }, [isAdmin, selectedGroupId, formatearFechaActual]);

  const cargarProgresoEspecifico = useCallback(async () => {
    if (!selectedGroupId) return;
    try {
      setProgressLoading(true);
      const res = await rankingService.getProgreso(selectedGroupId);
      if (res.data?.data) setGrupoProgreso(res.data.data);
    } catch { console.error('Error al recuperar progreso.'); }
    finally { setProgressLoading(false); }
  }, [selectedGroupId]);

  const cargarCalendario = useCallback(async () => {
    try {
      const res = await rankingService.getCalendar();
      if (res.data?.fechaPublicacion) {
        setFechaPublicacion(res.data.fechaPublicacion);
      }
    } catch (err) {
      console.error('Error al cargar calendario', err);
    }
  }, []);

  useEffect(() => { 
    cargarRankingGlobal(); 
    cargarCalendario();
  }, [cargarRankingGlobal, cargarCalendario]);
  useEffect(() => { cargarProgresoEspecifico(); }, [selectedGroupId, cargarProgresoEspecifico]);

  // ── PDF Ranking ─────────────────────────────────────────────────────────────
  const exportarRankingPDF = () => {
    if (!tablaRanking.length) { triggerToast('No existen registros para exportar.'); return; }
    const win = window.open('','_blank'); if (!win) return;
    const rows = tablaRanking.map(item => {
      const medal = item.posicion===1?'🥇':item.posicion===2?'🥈':item.posicion===3?'🥉':`#${item.posicion}`;
      const rowBg = item.posicion===1?'background:linear-gradient(90deg,#fef9c3,white);':item.posicion===2?'background:linear-gradient(90deg,#f1f5f9,white);':item.posicion===3?'background:linear-gradient(90deg,#fff7ed,white);':'';
      const ptC   = item.posicion===1?'#d97706':item.posicion===2?'#475569':item.posicion===3?'#b45309':'#4f46e5';
      return `<tr style="border-bottom:1px solid #f1f5f9;${rowBg}">
        <td style="padding:18px;text-align:center;font-size:22px;">${medal}</td>
        <td style="padding:18px 16px;">
          <div style="font-size:14px;font-weight:900;color:#0f172a;text-transform:uppercase;">${item.name}</div>
          <div style="font-size:10px;color:#94a3b8;font-weight:700;margin-top:2px;text-transform:uppercase;letter-spacing:1px;">Grupo Pequeño</div>
        </td>
        <td style="padding:18px 24px 18px 16px;text-align:right;">
          <div style="font-size:26px;font-weight:900;color:${ptC};font-family:'Courier New',monospace;line-height:1;">${item.totalPoints.toLocaleString()}</div>
          <div style="font-size:9px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">puntos acumulados</div>
        </td>
      </tr>`;
    }).join('');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ranking ALIVE</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>*{box-sizing:border-box;margin:0;padding:0;font-family:'Inter',Arial,sans-serif;}body{background:#f8fafc;color:#334155;}.page{max-width:780px;margin:0 auto;padding:48px 36px;}.rainbow{height:6px;background:linear-gradient(90deg,#6366f1,#8b5cf6,#d946ef,#ec4899,#f43f5e,#f59e0b);border-radius:3px;margin-bottom:36px;}.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #e2e8f0;}.badge{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;padding:4px 12px;border-radius:20px;margin-bottom:10px;}.title{font-size:30px;font-weight:900;color:#0f172a;line-height:1.05;}.sub{font-size:12px;color:#94a3b8;font-weight:600;margin-top:5px;}.meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px;}.mc{background:white;border:2px solid #e2e8f0;border-radius:14px;padding:14px 18px;}.ml{font-size:9px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;}.mv{font-size:15px;font-weight:800;color:#0f172a;margin-top:4px;text-transform:capitalize;}.tw{background:white;border-radius:18px;border:2px solid #e2e8f0;overflow:hidden;}.th{background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:18px 20px;display:flex;align-items:center;gap:10px;}.tt{font-size:13px;font-weight:900;color:white;text-transform:uppercase;letter-spacing:1px;}table{width:100%;border-collapse:collapse;}thead th{background:#f8fafc;padding:12px 16px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;border-bottom:2px solid #f1f5f9;}thead th:last-child{text-align:right;padding-right:24px;}.ft{margin-top:28px;display:flex;justify-content:space-between;align-items:center;padding-top:20px;border-top:1px solid #f1f5f9;font-size:10px;color:#cbd5e1;font-weight:600;}@media print{body{background:white;}.page{padding:24px;}}</style></head><body>
    <div class="page"><div class="rainbow"></div>
    <div class="hdr"><div><div class="badge">🏆 Clasificación Oficial</div><div class="title">Ranking General<br>de Grupos Pequeños</div><div class="sub">ALIVE — Maranata Adoración</div></div>
    <div style="text-align:right;"><div style="font-size:36px;font-weight:900;color:#0f172a;line-height:1;">${tablaRanking.length}</div><div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Equipos<br>clasificados</div></div></div>
    <div class="meta"><div class="mc"><div class="ml">📅 Última actualización</div><div class="mv">${lastUpdated}</div></div><div class="mc"><div class="ml">📆 Próxima publicación</div><div class="mv">${fechaPublicacion}</div></div></div>
    <div class="tw"><div class="th"><span style="font-size:18px;">🏅</span><span class="tt">Tabla de Clasificación</span></div>
    <table><thead><tr><th style="text-align:center;width:70px;">Medalla</th><th style="text-align:left;">Grupo Pequeño</th><th style="text-align:right;padding-right:24px;">Puntos Totales</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
    <div class="ft"><span>Generado: ${lastUpdated}</span><span style="font-weight:900;color:#6366f1;">ALIVE · Sistema Oficial de Clasificación</span></div>
    </div><script>window.onload=function(){window.print();window.close();}</script></body></html>`);
    win.document.close();
    setIsExportModalOpen(false);
    triggerToast('Reporte de ranking generado correctamente.');
  };

  // ── PDF Historial ────────────────────────────────────────────────────────────
  const exportarHistorialPDF = () => {
    const historial = grupoProgreso.historialReciente;
    const grupoNombre = grupos.find((g:any)=>g.id===selectedGroupId)?.name || 'Grupo';
    if (!historial.length) { triggerToast('No hay historial disponible para este grupo.'); return; }
    const totalG = historial.filter((h:any)=>h.puntos>=0).reduce((a:number,h:any)=>a+h.puntos,0);
    const totalP = historial.filter((h:any)=>h.puntos<0).reduce((a:number,h:any)=>a+h.puntos,0);
    const rows = historial.map((h:any,i:number) => {
      const neg=h.puntos<0;
      return `<tr style="border-bottom:1px solid #f8fafc;">
        <td style="padding:14px 16px;text-align:center;color:#94a3b8;font-weight:700;font-size:12px;">${i+1}</td>
        <td style="padding:14px 16px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${neg?'#f43f5e':'#8b5cf6'};flex-shrink:0;display:inline-block;"></span>
            <div><div style="font-size:13px;font-weight:800;color:#0f172a;">${h.actividad}</div>
            <div style="font-size:9px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">${h.area} · ${h.fecha}</div></div>
          </div>
        </td>
        <td style="padding:14px 20px 14px 16px;text-align:right;">
          <span style="background:${neg?'#fff1f2':'#f5f3ff'};color:${neg?'#e11d48':'#7c3aed'};border:1.5px solid ${neg?'#fecdd3':'#ddd6fe'};padding:5px 12px;border-radius:10px;font-weight:900;font-size:13px;font-family:'Courier New',monospace;">
            ${h.puntos>=0?'+':''}${h.puntos} pts
          </span>
        </td>
      </tr>`;
    }).join('');
    const win = window.open('','_blank'); if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Historial ${grupoNombre}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>*{box-sizing:border-box;margin:0;padding:0;font-family:'Inter',Arial,sans-serif;}body{background:#f8fafc;color:#334155;}.page{max-width:720px;margin:0 auto;padding:48px 36px;}.rainbow{height:6px;background:linear-gradient(90deg,#6366f1,#8b5cf6,#d946ef,#ec4899,#f43f5e);border-radius:3px;margin-bottom:36px;}.hdr{margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #e2e8f0;}.badge{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:white;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;padding:4px 12px;border-radius:20px;margin-bottom:10px;}.title{font-size:28px;font-weight:900;color:#0f172a;}.gname{font-size:18px;font-weight:900;color:#6366f1;text-transform:uppercase;letter-spacing:1px;margin-top:4px;}.sub{font-size:12px;color:#94a3b8;font-weight:600;margin-top:5px;}.sum{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:28px;}.sc{border-radius:14px;padding:16px 18px;text-align:center;}.sl{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;}.sv{font-size:22px;font-weight:900;margin-top:4px;font-family:'Courier New',monospace;}.tw{background:white;border-radius:18px;border:2px solid #e2e8f0;overflow:hidden;}.th{background:linear-gradient(135deg,#7c3aed,#a855f7);padding:18px 20px;display:flex;align-items:center;gap:10px;}.tt{font-size:13px;font-weight:900;color:white;text-transform:uppercase;letter-spacing:1px;}table{width:100%;border-collapse:collapse;}thead th{background:#f8fafc;padding:12px 16px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;border-bottom:2px solid #f1f5f9;}.ft{margin-top:28px;display:flex;justify-content:space-between;align-items:center;padding-top:20px;border-top:1px solid #f1f5f9;font-size:10px;color:#cbd5e1;font-weight:600;}@media print{body{background:white;}.page{padding:24px;}}</style></head><body>
    <div class="page"><div class="rainbow"></div>
    <div class="hdr"><div class="badge">📋 Historial de Puntuaciones</div><div class="title">Historial de Puntos</div><div class="gname">${grupoNombre.toUpperCase()}</div><div class="sub">ALIVE — Maranata Adoración · Generado: ${lastUpdated}</div></div>
    <div class="sum">
      <div class="sc" style="background:#f5f3ff;border:2px solid #ddd6fe;"><div class="sl" style="color:#7c3aed;">Total puntos</div><div class="sv" style="color:#6d28d9;">${(grupoProgreso.grupoInfo?.totalPoints??0).toLocaleString()}</div></div>
      <div class="sc" style="background:#fdf4ff;border:2px solid #f5d0fe;"><div class="sl" style="color:#a21caf;">Ganancias</div><div class="sv" style="color:#a21caf;">+${totalG.toLocaleString()}</div></div>
      <div class="sc" style="background:#fff1f2;border:2px solid #fecdd3;"><div class="sl" style="color:#e11d48;">Penalizaciones</div><div class="sv" style="color:#e11d48;">${totalP.toLocaleString()}</div></div>
    </div>
    <div class="tw"><div class="th"><span style="font-size:18px;">📜</span><span class="tt">Registro de Actividades</span></div>
    <table><thead><tr><th style="text-align:center;width:50px;">#</th><th style="text-align:left;">Actividad</th><th style="text-align:right;padding-right:20px;">Puntos</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
    <div class="ft"><span>Total: ${historial.length} registros</span><span style="font-weight:900;color:#7c3aed;">ALIVE · Historial Oficial de Puntuaciones</span></div>
    </div><script>window.onload=function(){window.print();window.close();}</script></body></html>`);
    win.document.close();
    setIsExportModalOpen(false);
    triggerToast('Reporte de historial generado correctamente.');
  };

  const openDateConfigModal = () => { 
    setTempFechaPublicacion(formatDateToISO(fechaPublicacion) || '2026-06-15'); 
    setIsDateConfigOpen(true); 
  };
  const guardarConfiguracionFechas = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    const formatted = formatDateToSpanish(tempFechaPublicacion);
    try {
      await rankingService.saveCalendar(formatted);
      setFechaPublicacion(formatted);
      setIsDateConfigOpen(false); 
      triggerToast('Calendario actualizado con éxito.'); 
    } catch {
      triggerToast('Error al guardar la fecha en el servidor.');
    }
  };

  const getPodiumBadge = (pos: number) => {
    if (pos===1) return 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-lg shadow-amber-400/50 ring-2 ring-amber-300';
    if (pos===2) return 'bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-md ring-2 ring-slate-300';
    if (pos===3) return 'bg-gradient-to-br from-amber-700 to-orange-800 text-white shadow-md ring-2 ring-amber-600/50';
    return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold';
  };
  const getPodiumRow = (pos: number) => {
    if (pos===1) return 'bg-gradient-to-r from-amber-50 via-yellow-50/60 to-transparent dark:from-amber-950/30 dark:via-amber-900/10 dark:to-transparent';
    if (pos===2) return 'bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/40 dark:to-transparent';
    if (pos===3) return 'bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-950/30 dark:to-transparent';
    return '';
  };

  const areaColors = [
    { dot:'bg-indigo-500',   bar:'from-indigo-500 via-violet-500 to-purple-600', bg:'bg-indigo-50 dark:bg-indigo-950/60',   text:'text-indigo-700 dark:text-indigo-300',   border:'border-indigo-200 dark:border-indigo-800/60' },
    { dot:'bg-fuchsia-500',  bar:'from-fuchsia-500 via-pink-500 to-rose-600',    bg:'bg-fuchsia-50 dark:bg-fuchsia-950/60',  text:'text-fuchsia-700 dark:text-fuchsia-300',  border:'border-fuchsia-200 dark:border-fuchsia-800/60' },
    { dot:'bg-violet-500',   bar:'from-violet-500 via-purple-500 to-indigo-600', bg:'bg-violet-50 dark:bg-violet-950/60',   text:'text-violet-700 dark:text-violet-300',   border:'border-violet-200 dark:border-violet-800/60' },
    { dot:'bg-rose-500',     bar:'from-rose-500 via-pink-500 to-fuchsia-600',    bg:'bg-rose-50 dark:bg-rose-950/60',     text:'text-rose-700 dark:text-rose-300',     border:'border-rose-200 dark:border-rose-800/60' },
    { dot:'bg-amber-500',    bar:'from-amber-500 via-orange-500 to-amber-600',   bg:'bg-amber-50 dark:bg-amber-950/60',    text:'text-amber-700 dark:text-amber-300',    border:'border-amber-200 dark:border-amber-800/60' },
  ];

  const totalGanancias = grupoProgreso.historialReciente.filter((h:any)=>h.puntos>=0).reduce((a:number,h:any)=>a+h.puntos,0);
  const totalPenalizaciones = grupoProgreso.historialReciente.filter((h:any)=>h.puntos<0).reduce((a:number,h:any)=>a+h.puntos,0);

  return (
    <div className="w-full space-y-5 min-h-screen text-slate-800 dark:text-slate-100 p-2 sm:p-4 lg:p-6 antialiased select-none relative transition-colors duration-300">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', system-ui, sans-serif; }
        @keyframes shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes borderFlow { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
        @keyframes pulseRing { 0%,100% { box-shadow:0 0 0 0 rgba(139,92,246,0.5); } 50% { box-shadow:0 0 0 8px rgba(139,92,246,0); } }
        @keyframes loadingBar {
          0%, 100% { opacity: 0.25; transform: scaleX(0.85); background-color: #818cf8; }
          50% { opacity: 1; transform: scaleX(1.15); background-color: #7c3aed; }
        }
        @keyframes glowPulse {
          0% { transform: scale(0.97); filter: drop-shadow(0 0 2px rgba(124,58,237,0.15)); }
          100% { transform: scale(1.03); filter: drop-shadow(0 0 12px rgba(124,58,237,0.5)); }
        }
        .anim-up   { animation: fadeInUp 0.4s ease both; }
        .anim-up-2 { animation: fadeInUp 0.4s ease 0.1s both; }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <FlowBorder gradient={G.violet} className="anim-up shadow-xl">
        <div className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background:'linear-gradient(90deg,#6366f1,#8b5cf6,#d946ef,#f43f5e,#f59e0b)', backgroundSize:'300% 100%', animation:'shimmer 4s linear infinite' }} />
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-5 pt-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-3.5 rounded-2xl shadow-xl shadow-amber-500/30">
                  <Trophy size={28} className="text-white fill-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-violet-400 rounded-full border-2 border-white dark:border-slate-900" style={{ animation:'pulseRing 2s ease infinite' }} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 dark:from-indigo-400 dark:via-violet-400 dark:to-fuchsia-400">Ranking</h1>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-widest mt-0.5">Sistema Oficial · Clasificación de Grupos Pequeños</p>
              </div>
            </div>
            <div 
              onClick={isAdmin ? openDateConfigModal : undefined}
              className={`flex items-center gap-3.5 border p-3 px-4 rounded-2xl transition-all duration-300 ${
                isAdmin 
                  ? 'cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-violet-300 dark:hover:border-violet-600 border-violet-100 dark:border-violet-900/60 bg-gradient-to-br from-violet-50/50 to-indigo-50/50 dark:from-violet-950/40 dark:to-indigo-950/40' 
                  : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 shadow-xs'
              }`}
              title={isAdmin ? "Haga clic para configurar la próxima fecha de emisión" : undefined}
            >
              <div className="relative shrink-0">
                <div className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white p-3 rounded-xl shadow-lg shadow-indigo-500/20">
                  <Calendar size={18} className="fill-current animate-[pulseRing_3s_ease_infinite]" />
                </div>
                {isAdmin && (
                  <div className="absolute -top-1 -right-1 bg-violet-600 text-white p-0.5 rounded-full border border-white dark:border-slate-900" title="Configurar calendario">
                    <Settings2 size={9} className="animate-[spin_4s_linear_infinite]" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-indigo-700 dark:text-indigo-300 font-black uppercase tracking-wider">Próxima publicación</p>
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-none capitalize mt-1 flex items-center gap-1.5">
                  {fechaPublicacion}
                  {isAdmin && <span className="text-[9px] text-violet-500 dark:text-violet-400 font-extrabold animate-pulse">(Editar)</span>}
                </h4>
              </div>
            </div>
          </div>
        </div>
      </FlowBorder>

      {/* loading bar */}
      {loading && (
        <div className="h-1 rounded-full overflow-hidden bg-slate-200">
          <div className="h-full rounded-full" style={{ width:'100%', background:'linear-gradient(90deg,#6366f1,#8b5cf6,#d946ef)', backgroundSize:'200% 100%', animation:'shimmer 1.2s linear infinite' }} />
        </div>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      {initialLoad ? (
        <div className="anim-up bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 p-12 shadow-sm flex items-center justify-center min-h-[55vh] transition-colors duration-300">
          <CustomLoader />
        </div>
      ) : isAdmin ? (
        /* ─── ADMIN LAYOUT: 5+7 ─────────────────────────── */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

          {/* Mi Progreso (admin) */}
          <div className="xl:col-span-5 anim-up">
            <FlowBorder gradient={G.fuchsia} className="shadow-lg h-full">
              <div className="h-full flex flex-col">
                <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-700 p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm"><Shield size={17} className="text-white fill-white" /></div>
                    <div>
                      <h2 className="font-black text-sm text-white uppercase tracking-wider">Mi Progreso</h2>
                      <p className="text-[9px] text-white/60 font-semibold uppercase tracking-widest">Estadísticas del grupo</p>
                    </div>
                  </div>
                  {grupos.length > 0 && (
                    <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                      className="text-[11px] bg-white/10 hover:bg-white/20 border border-white/25 text-white font-black rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer tracking-wider uppercase backdrop-blur-sm transition-all duration-200 active:scale-95">
                      {grupos.map((g:any) => <option key={g.id} value={g.id} className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100 font-bold">GP: {g.name.toUpperCase()}</option>)}
                    </select>
                  )}
                </div>
                <div className="p-5 space-y-5 flex-1">
                  {/* Stats 2-col */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-5 rounded-2xl text-white text-center shadow-xl shadow-indigo-500/30">
                      <div className="absolute -right-4 -bottom-4 opacity-10"><Trophy size={80} className="fill-current" /></div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-75 mb-2">Puntos Totales</p>
                      <p className="text-4xl font-black leading-none">{(grupoProgreso.grupoInfo?.totalPoints??0).toLocaleString()}</p>
                      <p className="text-[10px] font-semibold opacity-60 mt-1.5">acumulados</p>
                      <div className="mt-3">
                        {(grupoProgreso.grupoInfo?.variation??0)>=0 ? (
                          <span className="inline-flex items-center gap-1.5 bg-white/20 border border-white/25 px-3 py-1 rounded-full text-[10px] font-black">
                            <ArrowUp size={11} /> +{grupoProgreso.grupoInfo?.variation} este mes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-rose-500/30 border border-white/20 px-3 py-1 rounded-full text-[10px] font-black">
                            <ArrowDown size={11} /> {grupoProgreso.grupoInfo?.variation} este mes
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative overflow-hidden bg-gradient-to-br from-fuchsia-600 via-pink-600 to-rose-600 p-5 rounded-2xl text-white text-center shadow-xl shadow-fuchsia-500/30 flex flex-col items-center justify-center">
                      <div className="absolute -right-4 -top-4 opacity-10"><Star size={80} className="fill-current" /></div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-75 mb-3">Posición</p>
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl ring-4 ring-white/20 shadow-lg ${Number(grupoProgreso.grupoInfo?.posicionActual)===1?'bg-amber-400 text-slate-900':Number(grupoProgreso.grupoInfo?.posicionActual)===2?'bg-slate-300 text-slate-700':Number(grupoProgreso.grupoInfo?.posicionActual)===3?'bg-amber-800 text-white':'bg-white/20 text-white'}`}>
                        {grupoProgreso.grupoInfo?.posicionActual}
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-2.5">Puesto General</p>
                    </div>
                  </div>
                  {/* Desglose */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2"><TrendingUp size={13} className="text-violet-500 dark:text-violet-400" /><h4 className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Desglose por Área</h4></div>
                    {grupoProgreso.desgloseAreas.length === 0 ? (
                      <p className="text-xs text-slate-400 font-semibold text-center py-4">Sin datos disponibles.</p>
                    ) : grupoProgreso.desgloseAreas.map((area:any,i:number) => {
                      const pct = Math.min(100,(area.puntos/(area.max||600))*100);
                      const c = areaColors[i%areaColors.length];
                      return (
                        <div key={area.id} className="space-y-1.5 group">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${c.dot} shrink-0`} /><span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{area.name}</span></div>
                            <span className={`text-[11px] font-black font-mono ${c.text} ${c.bg} border ${c.border} px-2.5 py-0.5 rounded-lg`}>{area.puntos.toLocaleString()} PTS</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                            <div className={`h-full bg-gradient-to-r ${c.bar} rounded-full transition-all duration-700 ease-out`} style={{ width:`${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Historial reciente */}
                  <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2"><Clock size={13} className="text-slate-400" /><h4 className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Historial Reciente</h4></div>
                      <button 
                        onClick={() => setIsHistoryModalOpen(true)} 
                        className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition duration-200 cursor-pointer px-3.5 py-2 rounded-xl border border-indigo-200/60 dark:border-indigo-800/60 shadow-sm active:scale-95"
                      >
                        Ver todo
                      </button>
                    </div>
                    {grupoProgreso.historialReciente.length === 0 ? (
                      <div className="text-center py-6"><Clock size={32} className="mx-auto mb-2 text-slate-200 dark:text-slate-700" /><p className="text-xs font-semibold text-slate-400">Sin historial disponible</p></div>
                    ) : (
                      <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/60">
                        {grupoProgreso.historialReciente.slice(0,4).map((h:any) => (
                          <div key={h.id} className="px-4 py-3 flex justify-between items-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition group cursor-default">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${h.puntos<0?'bg-rose-500 animate-pulse':'bg-violet-500'}`} />
                              <div className="truncate">
                                <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{h.actividad}</p>
                                <p className="text-[9px] text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{h.area} · {h.fecha}</p>
                              </div>
                            </div>
                            <span className={`font-mono font-black text-xs shrink-0 ml-3 px-2.5 py-1.5 rounded-xl border-2 ${h.puntos<0?'text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/60':'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 border-violet-200 dark:border-violet-800/60'}`}>
                              {h.puntos>=0?`+${h.puntos}`:h.puntos} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </FlowBorder>
          </div>

          {/* Ranking Completo (admin) */}
          <div className="xl:col-span-7 anim-up-2">
            <FlowBorder gradient={G.violet} className="shadow-lg h-full">
              <div className="h-full flex flex-col">
                <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm"><Trophy size={17} className="text-white fill-white" /></div>
                    <div>
                      <h2 className="font-black text-sm text-white uppercase tracking-wider">Ranking Completo</h2>
                      <p className="text-[9px] text-white/60 font-semibold uppercase tracking-widest">Vista del Organizador</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <button
                      onClick={() => setIsFullscreenOpen(true)}
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-black rounded-xl transition-all duration-200 active:scale-95 shadow-sm cursor-pointer tracking-wider uppercase backdrop-blur-sm"
                      title="Visualizar el ranking en pantalla completa"
                    >
                      <Maximize2 size={13} className="shrink-0" />
                      <span>Pantalla Completa</span>
                    </button>
                    <button
                      onClick={() => setIsExportModalOpen(true)}
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-black rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-850 dark:hover:text-indigo-200 border border-transparent dark:border-slate-700 transition-all duration-200 active:scale-95 shadow-sm cursor-pointer tracking-wider uppercase"
                    >
                      <Download size={13} className="shrink-0" />
                      <span>Exportar</span>
                    </button>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-lg text-slate-900 dark:text-slate-100 tracking-tight">Ranking General de GP</h3>
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-2.5 py-1 rounded-xl uppercase tracking-wide">{tablaRanking.length} equipos</span>
                  </div>
                  <div className="flex-1 overflow-x-auto rounded-2xl border-2 border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b-2 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-400 font-black uppercase tracking-widest text-[9px]">
                          <th className="p-4 text-center w-16">Pos.</th>
                          <th className="p-4">Grupo Pequeño</th>
                          <th className="p-4 text-right pr-6">Puntos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                        {tablaRanking.length===0 ? (
                          <tr><td colSpan={3} className="text-center py-14 text-slate-300 dark:text-slate-600"><Trophy size={40} className="mx-auto mb-3" /><p className="text-sm font-semibold text-slate-400">Sin datos disponibles</p></td></tr>
                        ) : tablaRanking.map(item => (
                          <tr key={item.id} className={`transition-all hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 ${getPodiumRow(item.posicion)}`}>
                            <td className="p-4 text-center"><span className={`w-9 h-9 rounded-full inline-flex items-center justify-center font-black text-sm ${getPodiumBadge(item.posicion)}`}>{item.posicion===1?'🥇':item.posicion===2?'🥈':item.posicion===3?'🥉':item.posicion}</span></td>
                            <td className="p-4">
                              <div className="flex items-center gap-2.5">
                                <Shield size={16} className={`fill-current shrink-0 ${item.shieldColor||'text-slate-400'}`} />
                                <div><p className="font-black text-slate-900 dark:text-slate-100 text-[13px] uppercase tracking-wide">{item.name}</p><p className="text-[9px] text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider">Grupo Pequeño</p></div>
                              </div>
                            </td>
                            <td className="p-4 text-right pr-6"><span className="font-mono font-black text-slate-900 dark:text-slate-100 text-base">{item.totalPoints.toLocaleString()}</span><span className="text-slate-400 dark:text-slate-400 text-[11px] font-semibold ml-1">pts</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" /><span>En vivo</span></div>
                    <div className="flex items-center gap-2 font-mono"><span>Act: {lastUpdated}</span>
                      <button onClick={() => { cargarRankingGlobal(); triggerToast('Clasificaciones sincronizadas.'); }} className="p-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-xl border border-indigo-100/60 dark:border-indigo-800/60 transition-all cursor-pointer active:scale-95" title="Sincronizar">
                        <RefreshCw size={13} className={loading?'animate-spin':''} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </FlowBorder>
          </div>
        </div>
      ) : (
        /* ─── USER LAYOUT: full width, 2 columns ────────── */
        <div className="anim-up">
          <FlowBorder gradient={G.fuchsia} className="shadow-xl">
            <div>
              {/* Card header */}
              <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm"><Sparkles size={18} className="text-white" /></div>
                  <div>
                    <h2 className="font-black text-base text-white uppercase tracking-wider">Mi Progreso</h2>
                    <p className="text-[9px] text-white/60 font-semibold uppercase tracking-widest">Estadísticas de tu grupo pequeño</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsHistoryModalOpen(true)} 
                  className="flex items-center gap-2.5 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-black rounded-xl transition duration-200 active:scale-95 cursor-pointer backdrop-blur-sm shadow-sm"
                >
                  <Clock size={13} /> VER HISTORIAL
                </button>
              </div>

              {progressLoading ? (
                <div className="p-12 flex items-center justify-center min-h-[50vh] w-full">
                  <CustomLoader />
                </div>
              ) : (
                /* Content: 2 cols on desktop */
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* LEFT: Stats + Desglose */}
                  <div className="space-y-5">
                    {/* Hero puntos */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-700 p-12 pb-14 pt-14 rounded-3xl text-white text-center shadow-2xl shadow-indigo-500/30 flex flex-col justify-center min-h-[420px]">
                      <div className="relative space-y-6">
                        <p className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-violet-200">Puntos Acumulados</p>
                        
                        <p className="text-6xl sm:text-7xl font-black leading-none tracking-tighter font-mono">
                          {(grupoProgreso.grupoInfo?.totalPoints??0).toLocaleString()}
                        </p>
                        
                        <p className="text-sm sm:text-base font-bold opacity-80 uppercase tracking-widest">puntos totales del grupo</p>
                        
                        <div className="flex justify-center gap-5 pt-3">
                          <div className="bg-white/10 backdrop-blur-xs border border-white/20 hover:border-white/40 hover:bg-white/15 transition-all duration-300 rounded-2xl px-5 py-3 text-center min-w-[115px]">
                            <p className="text-[10px] font-black uppercase tracking-wider opacity-60">Ganancias</p>
                            <p className="text-lg sm:text-xl font-black font-mono text-yellow-300 mt-1">+{totalGanancias.toLocaleString()}</p>
                          </div>
                          <div className="bg-white/10 backdrop-blur-xs border border-white/20 hover:border-white/40 hover:bg-white/15 transition-all duration-300 rounded-2xl px-5 py-3 text-center min-w-[115px]">
                            <p className="text-[10px] font-black uppercase tracking-wider opacity-60">Penalizaciones</p>
                            <p className="text-lg sm:text-xl font-black font-mono text-rose-300 mt-1">{totalPenalizaciones.toLocaleString()}</p>
                          </div>
                        </div>

                        {(grupoProgreso.grupoInfo?.variation??0)>=0 ? (
                          <p className="text-sm sm:text-base font-black tracking-widest text-yellow-300 uppercase pt-2 animate-pulse">
                            +{grupoProgreso.grupoInfo?.variation} este mes
                          </p>
                        ) : (
                          <p className="text-sm sm:text-base font-black tracking-widest text-rose-350 uppercase pt-2 animate-pulse">
                            {grupoProgreso.grupoInfo?.variation} este mes
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Desglose */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-2 border-slate-100 dark:border-slate-800 p-5 space-y-4">
                      <div className="flex items-center gap-2 mb-1"><TrendingUp size={14} className="text-violet-500 dark:text-violet-400" /><h4 className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Desglose por Área</h4></div>
                      {grupoProgreso.desgloseAreas.length===0 ? (
                        <p className="text-xs text-slate-400 font-semibold text-center py-4">Sin datos disponibles.</p>
                      ) : grupoProgreso.desgloseAreas.map((area:any,i:number) => {
                        const pct = Math.min(100,(area.puntos/(area.max||600))*100);
                        const c = areaColors[i%areaColors.length];
                        return (
                          <div key={area.id} className="space-y-2 group">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${c.dot} shrink-0`} /><span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{area.name}</span></div>
                              <span className={`text-[11px] font-black font-mono ${c.text} ${c.bg} border ${c.border} px-2.5 py-0.5 rounded-lg`}>{area.puntos.toLocaleString()} PTS</span>
                            </div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                              <div className={`h-full bg-gradient-to-r ${c.bar} rounded-full transition-all duration-700 ease-out`} style={{ width:`${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RIGHT: Historial reciente completo */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2"><Clock size={14} className="text-violet-500 dark:text-violet-400" /><h4 className="text-[12px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Historial Reciente</h4></div>
                      <span className="text-[10px] font-black text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/60 px-2.5 py-1 rounded-lg uppercase tracking-wide">{grupoProgreso.historialReciente.length} registros</span>
                    </div>

                    {grupoProgreso.historialReciente.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-300 dark:text-slate-600">
                        <Clock size={48} className="mb-3" />
                        <p className="text-sm font-semibold text-slate-400">Sin historial disponible</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {grupoProgreso.historialReciente.map((h:any) => (
                          <div key={h.id} className="px-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center hover:shadow-md hover:border-violet-200 dark:hover:border-violet-700 transition-all group cursor-default">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${h.puntos<0?'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400':'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'}`}>
                                {h.puntos<0?<ArrowDown size={15} />:<ArrowUp size={15} />}
                              </div>
                              <div className="truncate">
                                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{h.actividad}</p>
                                <p className="text-[9px] text-slate-400 dark:text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">{h.area} · {h.fecha}</p>
                              </div>
                            </div>
                            <span className={`font-mono font-black text-sm shrink-0 ml-3 px-3 py-1.5 rounded-xl border-2 ${h.puntos<0?'text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/60':'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 border-violet-200 dark:border-violet-800/60'}`}>
                              {h.puntos>=0?`+${h.puntos}`:h.puntos} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </FlowBorder>
        </div>
      )}

      {/* ── TOAST ─────────────────────────────────────────── */}
      {notification.isOpen && (
        <div className="fixed bottom-5 right-5 z-[99999] max-w-sm w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-violet-100 dark:border-violet-900/60 p-4 flex items-center justify-between gap-3.5 overflow-hidden" style={{ animation:'fadeInUp 0.3s ease both' }}>
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background:'linear-gradient(90deg,#6366f1,#8b5cf6,#d946ef)' }} />
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md"><Zap size={16} /></div>
            <p className="text-xs font-black text-slate-800 dark:text-slate-100">{notification.message}</p>
          </div>
          <button onClick={() => setNotification({ isOpen:false, message:'' })} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"><X size={14} /></button>
        </div>
      )}

      {/* ── EXPORT MODAL ──────────────────────────────────── */}
      {isExportModalOpen && (
        <ModalWrap gradient={G.violet}>
          <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-5 text-white flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl"><Download size={20} /></div>
              <div><h3 className="font-black text-base uppercase tracking-wider">Exportar Reporte</h3><p className="text-[10px] text-white/60 font-semibold uppercase tracking-widest mt-0.5">Selecciona el tipo de documento</p></div>
            </div>
            <button onClick={() => setIsExportModalOpen(false)} className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-xl transition duration-200 active:scale-95"><X size={18} /></button>
          </div>
          <div className="p-6 space-y-3">
            <button onClick={exportarRankingPDF} className="w-full group flex items-center gap-4 p-5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:border-indigo-400 dark:hover:border-indigo-700 transition-all duration-200 cursor-pointer active:scale-[0.98] text-left">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform"><BarChart3 size={22} className="text-white" /></div>
              <div><p className="font-black text-sm text-indigo-900 dark:text-indigo-200 uppercase tracking-wide">Ranking General</p><p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">Tabla completa de clasificación · PDF a color</p></div>
              <Download size={16} className="text-indigo-400 ml-auto shrink-0 transition-transform group-hover:translate-y-0.5" />
            </button>
            <button onClick={exportarHistorialPDF} className="w-full group flex items-center gap-4 p-5 rounded-2xl border-2 border-fuchsia-200 dark:border-fuchsia-900/50 bg-fuchsia-50 dark:bg-fuchsia-950/40 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/50 hover:border-fuchsia-400 dark:hover:border-fuchsia-700 transition-all duration-200 cursor-pointer active:scale-[0.98] text-left">
              <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-violet-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-fuchsia-500/30 group-hover:scale-105 transition-transform"><FileText size={22} className="text-white" /></div>
              <div className="flex-1 min-w-0"><p className="font-black text-sm text-fuchsia-900 dark:text-fuchsia-200 uppercase tracking-wide">Historial del Grupo</p><p className="text-[11px] text-fuchsia-700 dark:text-fuchsia-400 font-semibold mt-0.5 truncate">{grupos.find((g:any)=>g.id===selectedGroupId)?.name?.toUpperCase()||'Grupo seleccionado'} · Puntos y penalizaciones</p></div>
              <Download size={16} className="text-fuchsia-400 ml-2 shrink-0 transition-transform group-hover:translate-y-0.5" />
            </button>
            <button onClick={() => setIsExportModalOpen(false)} className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black uppercase text-xs rounded-2xl cursor-pointer transition-all duration-200 active:scale-95 shadow-sm">Cancelar</button>
          </div>
        </ModalWrap>
      )}

      {/* ── DATE CONFIG MODAL ─────────────────────────────── */}
      {isDateConfigOpen && (
        <ModalWrap gradient={G.violet} maxW="max-w-sm">
          <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm"><Calendar size={20} /></div>
              <div>
                <h3 className="font-black text-base uppercase tracking-wider">Configurar Emisión</h3>
                <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-0.5">Próxima fecha oficial</p>
              </div>
            </div>
            <button onClick={() => setIsDateConfigOpen(false)} className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-xl transition duration-200 active:scale-95"><X size={18} /></button>
          </div>
          <form onSubmit={guardarConfiguracionFechas} className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-widest">📅 Próxima Emisión General</label>
              <div className="relative">
                <input 
                  type="date" 
                  required 
                  value={tempFechaPublicacion} 
                  onChange={(e) => setTempFechaPublicacion(e.target.value)} 
                  className="w-full border-2 border-slate-200 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/20 rounded-2xl px-4 py-3.5 font-bold text-sm text-slate-800 dark:text-slate-100 focus:outline-none bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer" 
                />
              </div>
              {tempFechaPublicacion && (
                <p className="text-[11px] text-violet-600 dark:text-violet-400 font-black capitalize px-1 flex items-center gap-1.5 animate-pulse mt-2">
                  <span>→</span> {formatDateToSpanish(tempFechaPublicacion)}
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setIsDateConfigOpen(false)} 
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-xs cursor-pointer transition-all duration-200 active:scale-95 border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="flex-1 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl font-black uppercase text-xs shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
              >
                Aplicar
              </button>
            </div>
          </form>
        </ModalWrap>
      )}

      {/* ── HISTORY MODAL ─────────────────────────────────── */}
      {isHistoryModalOpen && (
        <ModalWrap gradient={G.fuchsia} maxW="max-w-xl">
          <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner"><Clock size={22} className="animate-pulse" /></div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-wider">Historial de Actividades</h3>
                <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest mt-0.5">{grupoProgreso.historialReciente.length} {grupoProgreso.historialReciente.length===1?'registro cargado':'registros cargados'}</p>
              </div>
            </div>
            <button onClick={() => setIsHistoryModalOpen(false)} className="text-white/70 hover:text-white p-2.5 hover:bg-white/10 rounded-xl transition duration-200 active:scale-95 cursor-pointer"><X size={20} /></button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-900 border-b-2 border-slate-100 dark:border-slate-800 shrink-0">
            <div className="p-3 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 dark:from-indigo-950/40 dark:to-violet-950/40 border-2 border-indigo-150/70 dark:border-indigo-900/50 rounded-2xl text-center shadow-xs">
              <p className="text-[10px] text-indigo-700 dark:text-indigo-300 font-extrabold uppercase tracking-wider">Puntos Total</p>
              <p className="text-base font-black text-slate-900 dark:text-slate-100 font-mono mt-1.5">{(grupoProgreso.grupoInfo?.totalPoints??0).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-emerald-50/60 to-teal-50/60 dark:from-emerald-950/40 dark:to-teal-950/40 border-2 border-emerald-150/60 dark:border-emerald-900/50 rounded-2xl text-center shadow-xs">
              <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-extrabold uppercase tracking-wider">Ganancias</p>
              <p className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1.5">+{totalGanancias.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-rose-50/60 to-orange-50/60 dark:from-rose-950/40 dark:to-orange-950/40 border-2 border-rose-150/60 dark:border-rose-900/50 rounded-2xl text-center shadow-xs">
              <p className="text-[10px] text-rose-700 dark:text-rose-300 font-extrabold uppercase tracking-wider">Penalizaciones</p>
              <p className="text-base font-black text-rose-600 dark:text-rose-400 font-mono mt-1.5">{totalPenalizaciones.toLocaleString()}</p>
            </div>
          </div>

          <div className="overflow-y-auto p-5 space-y-3 max-h-[50vh] bg-slate-50/30 dark:bg-slate-900/50">
            {grupoProgreso.historialReciente.length===0 ? (
              <div className="text-center py-16 text-slate-350 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Clock size={44} className="mx-auto mb-3 text-slate-300 dark:text-slate-600 animate-pulse" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-wider">Sin historial disponible</p>
              </div>
            ) : grupoProgreso.historialReciente.map((h:any) => {
              const isNeg = h.puntos < 0;
              return (
                <div 
                  key={h.id} 
                  className={`px-5 py-4 bg-white dark:bg-slate-800/80 border-2 rounded-2xl flex justify-between items-center transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-default group ${
                    isNeg 
                      ? 'border-rose-100 dark:border-rose-900/50 hover:border-rose-350 dark:hover:border-rose-700 hover:bg-rose-50/10 dark:hover:bg-rose-950/30' 
                      : 'border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-350 dark:hover:border-indigo-700 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/30'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      isNeg 
                        ? 'bg-gradient-to-br from-rose-400 to-red-500 text-white' 
                        : 'bg-gradient-to-br from-violet-400 to-indigo-500 text-white'
                    }`}>
                      {isNeg ? <ArrowDown size={17} /> : <ArrowUp size={17} />}
                    </div>
                    <div className="truncate">
                      <p className="text-[14px] font-extrabold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-wide leading-snug">{h.actividad}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded-md ${isNeg ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300' : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300'}`}>{h.area}</span>
                        <span>·</span>
                        <span>{h.fecha}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`font-mono font-black text-xs shrink-0 ml-4 px-3.5 py-2 rounded-xl border shadow-xs transition-colors ${
                    isNeg 
                      ? 'text-rose-600 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/60 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/60' 
                      : 'text-violet-700 dark:text-violet-300 bg-violet-50/70 dark:bg-violet-950/60 border-violet-200 dark:border-violet-800/60 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/60'
                  }`}>
                    {h.puntos>=0?`+${h.puntos}`:h.puntos} pts
                  </span>
                </div>
              );
            })}
          </div>

          <div className="p-5 border-t-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-3.5">
            <button 
              onClick={() => setIsHistoryModalOpen(false)} 
              className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black uppercase text-xs tracking-wider rounded-2xl cursor-pointer transition-all duration-200 active:scale-95 border border-slate-200/85 dark:border-slate-700 shadow-2xs"
            >
              Cerrar
            </button>
            <button 
              onClick={exportarHistorialPDF} 
              className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black uppercase text-xs tracking-wider rounded-2xl cursor-pointer transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Download size={14} />
              <span>Descargar Reporte</span>
            </button>
          </div>
        </ModalWrap>
      )}


      {/* ── FULLSCREEN RANKING PRESENTATION ────────────────── */}
      {isFullscreenOpen && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex flex-col overflow-hidden select-none animate-[fadeInUp_0.25s_ease_both]" 
          style={{ 
            background: isDarkTheme 
              ? 'linear-gradient(135deg,#0a0b10 0%,#090514 50%,#020205 100%)' 
              : 'linear-gradient(135deg,#ffffff 0%,#f8fafc 100%)',
            color: isDarkTheme ? '#ffffff' : '#0f172a'
          }}
        >
          {/* Ambient Glowing Background Blobs */}
          {isDarkTheme ? (
            <>
              <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-indigo-500/10 rounded-full filter blur-[150px] pointer-events-none animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-[800px] h-[800px] bg-fuchsia-500/10 rounded-full filter blur-[160px] pointer-events-none animate-pulse" />
            </>
          ) : (
            <>
              <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-indigo-500/[0.04] rounded-full filter blur-[150px] pointer-events-none" />
              <div className="absolute bottom-1/4 right-1/4 w-[800px] h-[800px] bg-fuchsia-500/[0.04] rounded-full filter blur-[160px] pointer-events-none" />
            </>
          )}

          {/* Animated top bar */}
          <div className="h-[5px] w-full shrink-0" style={{ background:'linear-gradient(90deg,#6366f1,#8b5cf6,#d946ef,#ec4899,#f43f5e,#f59e0b,#6366f1)', backgroundSize:'300% 100%', animation:'shimmer 3s linear infinite' }} />

          {/* Fullscreen Header */}
          <div className={`relative flex items-center justify-between px-10 py-6 border-b shrink-0 z-10 ${
            isDarkTheme ? 'border-white/10' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-5">
              <div className="p-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-xl shadow-amber-500/30">
                <Trophy size={30} className="text-white fill-white" />
              </div>
              <div>
                <h1 className={`text-3xl sm:text-4xl font-black tracking-tight ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Ranking General</h1>
                <p className={`text-xs sm:text-sm font-bold uppercase tracking-widest mt-0.5 ${isDarkTheme ? 'text-white/40' : 'text-slate-400'}`}>Clasificación Oficial · Grupos Pequeños · ALIVE</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Hide/Show scores toggle */}
              <button
                onClick={() => {
                  setHideScores(v => {
                    const next = !v;
                    setRevealedIds({});
                    return next;
                  });
                }}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all duration-300 active:scale-95 cursor-pointer border shadow-md hover:shadow-lg ${
                  hideScores
                    ? 'bg-amber-500 border-amber-600 text-slate-950 hover:bg-amber-400 shadow-amber-500/30'
                    : isDarkTheme
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/15 hover:border-white/40'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-250 hover:text-slate-900'
                }`}
              >
                {hideScores ? <Eye size={16} className="fill-current" /> : <EyeOff size={16} />}
                {hideScores ? 'Revelar Todos' : 'Ocultar Puntajes'}
              </button>
              <button
                onClick={() => { setIsFullscreenOpen(false); setHideScores(false); setRevealedIds({}); }}
                className={`flex items-center gap-2 px-6 py-3.5 border text-xs sm:text-sm font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer rounded-2xl ${
                  isDarkTheme
                    ? 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20 hover:text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                }`}
              >
                <Minimize2 size={16} /> Salir
              </button>
            </div>
          </div>

          {/* Ranking Table Content */}
          <div className="flex-1 overflow-auto p-10 relative z-10">
            <div className="max-w-5xl mx-auto">
              {/* Stats strip */}
              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className={`border rounded-3xl p-6 text-center transition-all duration-300 ${
                  isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <p className={`text-xs font-black uppercase tracking-widest mb-1.5 ${
                    isDarkTheme ? 'text-white/40' : 'text-slate-400'
                  }`}>Equipos Clasificados</p>
                  <p className={`text-4xl sm:text-5xl font-black ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>{tablaRanking.length}</p>
                </div>
                <div className={`border rounded-3xl p-6 text-center transition-all duration-300 ${
                  isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <p className={`text-xs font-black uppercase tracking-widest mb-1.5 ${
                    isDarkTheme ? 'text-white/40' : 'text-slate-400'
                  }`}>Actualización</p>
                  <p className={`text-xl sm:text-2xl font-black ${isDarkTheme ? 'text-white/80' : 'text-slate-700'} mt-1`}>{lastUpdated}</p>
                </div>
              </div>

              {/* Table */}
              <div className="space-y-4">
                {tablaRanking.length === 0 ? (
                  <div className="text-center py-20 text-white/30">
                    <Trophy size={64} className="mx-auto mb-4" />
                    <p className="text-lg font-semibold">Sin datos de ranking disponibles</p>
                  </div>
                ) : [...tablaRanking].sort((a, b) => a.posicion - b.posicion).map((item, idx) => {
                  const isPodium1 = item.posicion === 1;
                  const isPodium2 = item.posicion === 2;
                  const isPodium3 = item.posicion === 3;
                  
                  // Row background style
                  let rowBg = '';
                  if (isPodium1) {
                    rowBg = isDarkTheme 
                      ? 'bg-gradient-to-r from-amber-500/25 to-amber-500/5 border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-gradient-to-r from-amber-50 to-amber-50/20 border-amber-200 hover:bg-amber-100/50 shadow-sm';
                  } else if (isPodium2) {
                    rowBg = isDarkTheme
                      ? 'bg-gradient-to-r from-slate-400/20 to-slate-400/5 border-slate-400/35 hover:bg-slate-400/25'
                      : 'bg-gradient-to-r from-slate-50 to-slate-50/20 border-slate-200 hover:bg-slate-100/50 shadow-sm';
                  } else if (isPodium3) {
                    rowBg = isDarkTheme
                      ? 'bg-gradient-to-r from-amber-700/25 to-amber-700/5 border-amber-700/35 hover:bg-amber-700/30'
                      : 'bg-gradient-to-r from-orange-50 to-orange-50/20 border-orange-200 hover:bg-orange-100/50 shadow-sm';
                  } else {
                    rowBg = isDarkTheme
                      ? 'bg-white/5 border-white/10 hover:bg-white/10'
                      : 'bg-white border-slate-200 hover:bg-slate-50/60 shadow-xs hover:shadow-md';
                  }
                  
                  const medalEl = isPodium1 ? '🥇' : isPodium2 ? '🥈' : isPodium3 ? '🥉' : null;
                  const posColor = isPodium1 ? 'text-amber-300' : isPodium2 ? 'text-slate-450' : isPodium3 ? 'text-orange-500' : isDarkTheme ? 'text-white/50' : 'text-slate-450';
                  const delay = `${idx * 0.08}s`;
                  const isScoreVisible = !hideScores || !!revealedIds[item.id];

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (hideScores) {
                          setRevealedIds(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                        }
                      }}
                      className={`flex items-center gap-6 px-8 py-6 rounded-3xl border ${rowBg} backdrop-blur-md transition-all duration-300 select-none ${
                        hideScores ? 'hover:scale-[1.01] hover:shadow-md cursor-pointer' : 'cursor-default'
                      }`}
                      style={{ animation:`fadeInUp 0.4s ease ${delay} both` }}
                      title={hideScores ? (isScoreVisible ? "Haga clic para ocultar puntaje" : "Haga clic para revelar puntaje") : undefined}
                    >
                      {/* Position */}
                      <div className="w-16 text-center shrink-0">
                        {medalEl ? (
                          <span className="text-4xl leading-none">{medalEl}</span>
                        ) : (
                          <span className={`text-2xl font-black ${posColor}`}>#{item.posicion}</span>
                        )}
                      </div>
                      {/* Name */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isPodium1 ? 'bg-amber-400/20 border-amber-400/40' :
                          isPodium2 ? 'bg-slate-400/20 border border-slate-400/30' :
                          isPodium3 ? 'bg-orange-500/20 border border-orange-500/30' :
                          isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <Shield size={24} className={`fill-current ${
                            isPodium1 ? 'text-amber-400' : isPodium2 ? 'text-slate-550 dark:text-slate-350' : isPodium3 ? 'text-orange-500' : isDarkTheme ? 'text-white/40' : 'text-slate-400'
                          }`} />
                        </div>
                        <div className="truncate">
                          <p className={`font-black text-xl sm:text-2xl uppercase tracking-wide truncate ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>{item.name}</p>
                          <p className={`text-xs sm:text-sm font-bold uppercase tracking-widest mt-0.5 ${isDarkTheme ? 'text-white/40' : 'text-slate-400'}`}>Grupo Pequeño</p>
                        </div>
                      </div>
                      {/* Points */}
                      <div className="shrink-0 text-right min-w-[150px]">
                        {isScoreVisible ? (
                          <div className="flex items-center gap-2.5 justify-end animate-[fadeInUp_0.2s_ease_both]">
                            <span className={`font-mono font-black text-3xl sm:text-4xl tracking-tight ${
                              isPodium1 ? 'text-amber-500 dark:text-amber-300' : isPodium2 ? 'text-slate-600 dark:text-slate-350' : isPodium3 ? 'text-orange-600 dark:text-orange-400' : isDarkTheme ? 'text-white' : 'text-slate-800'
                            }`}>{item.totalPoints.toLocaleString()}</span>
                            <span className={`text-base font-bold ml-0.5 ${isDarkTheme ? 'text-white/40' : 'text-slate-400'}`}>pts</span>
                            {hideScores && (
                              <span className="text-amber-500 dark:text-amber-400 ml-1.5 animate-pulse" title="Revelado individualmente">
                                <Eye size={16} className="fill-current" />
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <span className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs sm:text-sm font-black uppercase tracking-widest transition duration-200 active:scale-95 shadow-2xs ${
                              isDarkTheme 
                                ? 'bg-white/10 hover:bg-white/20 border-white/15 text-white/60 hover:text-white' 
                                : 'bg-slate-100 hover:bg-slate-200 border-slate-250 text-slate-600 hover:text-slate-800'
                            }`}>
                              <EyeOff size={14} />
                              Revelar
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`px-10 py-5 border-t flex justify-between items-center shrink-0 relative z-10 ${
            isDarkTheme ? 'border-white/10' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isDarkTheme ? 'bg-violet-400' : 'bg-indigo-600'}`} />
              <span className={`text-xs font-semibold uppercase tracking-widest ${isDarkTheme ? 'text-white/45' : 'text-slate-400'}`}>En vivo</span>
            </div>
            <span className={`text-xs font-semibold uppercase tracking-widest ${isDarkTheme ? 'text-white/30' : 'text-slate-450'}`}>
              ALIVE · Sistema Oficial de Clasificación · {lastUpdated}
            </span>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};