import React, { useEffect, useState, useCallback } from 'react';
import { rankingService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { resolveAccessRole } from '../utils/access';
import { 
  Trophy, Shield, Star, RefreshCw, Layers, Lock, Users,
  ArrowUp, ArrowDown, Calendar, Download, Settings2, X, Info
} from 'lucide-react';

export const RankingPage: React.FC = () => {
  const { user } = useAuthStore();
  const accessRole = resolveAccessRole(user);
  const isAdmin = accessRole === 'ADMIN';

  const [grupos, setGrupos] = useState<any[]>([]);
  const [tablaRanking, setTablaRanking] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  
  const [lastUpdated, setLastUpdated] = useState<string>('03 Octubre 2026 - 11:15');

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isControlModalOpen, setIsControlModalOpen] = useState(false);
  const [isDateConfigOpen, setIsDateConfigOpen] = useState(false);

  const [fechaPublicacion, setFechaPublicacion] = useState<string>('15 de Junio de 2026');
  const [fechaCierre, setFechaCierre] = useState<string>('31 de Mayo de 2026');

  const [tempFechaPublicacion, setTempFechaPublicacion] = useState<string>('15 de Junio de 2026');
  const [tempFechaCierre, setTempFechaCierre] = useState<string>('31 de Mayo de 2026');

  const [grupoProgreso, setGrupoProgreso] = useState<any>({
    grupoInfo: { name: 'Cargando...', totalPoints: 0, variation: 0, nivel: 1, etiquetaNivel: 'Sincronizando...', posicionActual: '-' },
    desgloseAreas: [],
    historialReciente: []
  });

  const [notification, setNotification] = useState({ isOpen: false, message: '' });

  const triggerToast = (message: string) => {
    setNotification({ isOpen: true, message });
    setTimeout(() => setNotification({ isOpen: false, message: '' }), 3500);
  };

  const formatearFechaActual = useCallback(() => {
    const ahora = new Date();
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dia = ahora.getDate();
    const mes = meses[ahora.getMonth()];
    const anio = ahora.getFullYear();
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    setLastUpdated(`${dia} ${mes} ${anio} - ${horas}:${minutos}`);
  }, []);

  const cargarRankingGlobal = useCallback(async () => {
    try {
      setLoading(true);
      const res = await rankingService.getGeneral();
      const fetchedRanking = res.data.ranking || [];
      const fetchedGrupos = res.data.grupos || [];

      const visibleGroups = isAdmin ? fetchedGrupos : fetchedGrupos.slice(0, 1);
      const fallbackGroupId = visibleGroups[0]?.id || 0;
      const effectiveGroupId =
        selectedGroupId !== 0 && visibleGroups.some((g: any) => g.id === selectedGroupId)
          ? selectedGroupId
          : fallbackGroupId;

      setGrupos(visibleGroups);
      setSelectedGroupId(effectiveGroupId);
      setTablaRanking(
        isAdmin
          ? fetchedRanking
          : fetchedRanking.filter((item: any) => item.id === effectiveGroupId)
      );

      formatearFechaActual();
    } catch (err) {
      triggerToast('Error al conectar con el servidor de clasificaciones.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, selectedGroupId, formatearFechaActual]);

  const cargarProgresoEspecifico = useCallback(async () => {
    if (selectedGroupId === 0) return;
    try {
      const res = await rankingService.getProgreso(selectedGroupId);
      if (res.data?.data) {
        setGrupoProgreso(res.data.data);
      }
    } catch (err) {
      console.error('Error al recuperar progreso analítico.');
    }
  }, [selectedGroupId]);

  useEffect(() => { cargarRankingGlobal(); }, [cargarRankingGlobal]);
  useEffect(() => { cargarProgresoEspecifico(); }, [selectedGroupId, cargarProgresoEspecifico]);

  const ejecutarExportacionPDF = () => {
    if (tablaRanking.length === 0) {
      triggerToast('No existen registros para exportar.');
      return;
    }

    const ventanaImpresion = window.open('', '_blank');
    if (!ventanaImpresion) return;

    const filasHtml = tablaRanking.map(item => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 14px;">
        <td style="padding: 14px; text-align: center; font-weight: bold;">${item.posicion}</td>
        <td style="padding: 14px; font-weight: 800; color: #1e3a8a; text-transform: uppercase;">${item.name}</td>
        <td style="padding: 14px; text-align: right; font-family: monospace; font-weight: bold; font-size: 15px;">${item.totalPoints.toLocaleString()} pts</td>
        <td style="padding: 14px; text-align: center; font-weight: bold; color: ${item.variation >= 0 ? '#10b981' : '#f43f5e'};">
          ${item.variation >= 0 ? `+${item.variation}` : item.variation}
        </td>
        <td style="padding: 14px; text-align: center; font-weight: bold;">Nivel ${item.nivel}</td>
      </tr>
    `).join('');

    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>Reporte Oficial de Ranking - ALIVE</title>
          <style>
            body { font-family: Arial, sans-serif; color: #334155; padding: 40px; }
            .header { border-bottom: 3px solid #0033cc; padding-bottom: 15px; margin-bottom: 30px; }
            .title { font-size: 26px; font-weight: 900; color: #1e3a8a; margin: 0; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background-color: #0033cc; color: white; padding: 14px; font-size: 13px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">ALIVE - Maranata Adoración</h1>
            <p style="font-weight: bold; color: #64748b;">Reporte Oficial de Ranking General de Grupos Pequeños</p>
          </div>
          <p style="font-size: 13px;"><strong>Actualizado el:</strong> ${lastUpdated}</p>
          <p style="font-size: 13px;"><strong>Cierre de Periodo:</strong> ${fechaCierre}</p>
          <table>
            <thead>
              <tr>
                <th>POS.</th>
                <th style="text-align: left;">GRUPO PEQUEÑO</th>
                <th style="text-align: right;">PUNTOS TOTALES</th>
                <th>VARIACIÓN</th>
                <th>NIVEL</th>
              </tr>
            </thead>
            <tbody>
              ${filasHtml}
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    ventanaImpresion.document.close();
  };

  const openDateConfigModal = () => {
    setTempFechaPublicacion(fechaPublicacion);
    setTempFechaCierre(fechaCierre);
    setIsDateConfigOpen(true);
  };

  const guardarConfiguracionFechas = (e: React.FormEvent) => {
    e.preventDefault();
    setFechaPublicacion(tempFechaPublicacion);
    setFechaCierre(tempFechaCierre);
    setIsDateConfigOpen(false);
    triggerToast('Calendario de publicaciones actualizado con éxito.');
  };

  const getPodiumBadgeClass = (pos: number) => {
    if (pos === 1) return 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300 font-black';
    if (pos === 2) return 'bg-slate-300 text-slate-800 font-black';
    if (pos === 3) return 'bg-amber-700 text-white font-black';
    return 'bg-slate-100 text-slate-500 font-bold';
  };

  return (
    <div className="space-y-6 bg-[#f8fafc] min-h-screen text-slate-800 p-4 sm:p-6 font-sans antialiased select-none relative">
      
      <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-200/60 shadow-premium">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-600 to-purple-700 p-3 text-white rounded-2xl shadow-md"><Trophy size={24} /></div>
          <div>
            <h1 className="text-2xl font-extrabold text-indigo-950 tracking-tight">Ranking</h1>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sistema Oficial de Clasificación de Grupos Pequeños (GP)</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="w-full bg-indigo-600 h-1.5 animate-pulse rounded-full shadow-xs"></div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-9 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-premium space-y-4">
          <h3 className="text-xs font-bold text-indigo-650 uppercase tracking-wider px-1">¿Cómo funciona el Ranking?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-semibold text-slate-600 leading-relaxed">
            <div className="flex items-start gap-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100/50"><Users size={18} /></div>
              <p className="text-xs font-semibold text-slate-500 mt-1">Cada GP solo puede ver sus propios puntos y progreso.</p>
            </div>
            <div className="flex items-start gap-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100"><Lock size={18} /></div>
              <p className="text-xs font-semibold text-slate-500 mt-1">El ranking completo de todos los GP solo lo puede ver el organizador.</p>
            </div>
            <div className="flex items-start gap-3 bg-slate-50/60 p-4 rounded-2xl border border-purple-100/60">
              <div className="w-10 h-10 bg-purple-50 text-purple-650 rounded-xl flex items-center justify-center shrink-0 border border-purple-100/50"><Calendar size={18} className="text-purple-650" /></div>
              <p className="text-xs font-semibold text-slate-500 mt-1">El ranking general se mostrará en fechas determinadas (mensual, trimestral o especial).</p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-premium flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 text-amber-500/10 pointer-events-none transform scale-125 transition-transform duration-300">
            <Trophy size={120} className="fill-current" />
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-amber-500 text-white p-3 rounded-2xl shadow-md"><Trophy size={22} className="fill-current" /></div>
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <p className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider truncate">Próxima publicación del Ranking</p>
                {isAdmin && (
                  <button onClick={openDateConfigModal} className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5" title="Configurar Fechas">
                    <Settings2 size={13} />
                  </button>
                )}
              </div>
              <h4 className="text-xl font-extrabold text-slate-900 tracking-tight">{fechaPublicacion}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide truncate">Cierre de periodo: {fechaCierre}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        <div className="xl:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-premium space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl flex items-center justify-center"><Shield size={16} className="fill-current" /></div>
              <h2 className="font-extrabold text-sm text-[#1e3a8a] uppercase tracking-wider">Mi Progreso (Sólo para tu GP)</h2>
            </div>
            
            {grupos.length > 0 && isAdmin && (
              <select 
                value={selectedGroupId} 
                onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                className="text-xs bg-white border border-slate-200 text-slate-800 font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm tracking-wider uppercase"
              >
                {grupos.map((g: any) => <option key={g.id} value={g.id}>GP: {g.name.toUpperCase()}</option>)}
              </select>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center space-y-1 shadow-sm">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mis Puntos Acumulados</p>
              <p className="text-3xl font-extrabold text-emerald-600 leading-none pt-1">{grupoProgreso.grupoInfo?.totalPoints} <span className="text-xs font-semibold text-slate-400">pts</span></p>
              
              {grupoProgreso.grupoInfo?.variation >= 0 ? (
                <span className="inline-flex text-[10px] font-bold text-emerald-600 bg-emerald-50/70 px-2.5 py-1 rounded-md border border-emerald-100 mt-2.5 items-center gap-0.5">
                  <ArrowUp size={12} /> +{grupoProgreso.grupoInfo?.variation} mes
                </span>
              ) : (
                <span className="inline-flex text-[10px] font-bold text-rose-600 bg-rose-50/70 px-2.5 py-1 rounded-md border border-rose-100 mt-2.5 items-center gap-0.5">
                  <ArrowDown size={12} /> -{Math.abs(grupoProgreso.grupoInfo?.variation)} mes
                </span>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center flex flex-col justify-between items-center space-y-1 shadow-sm">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Posición Actual</p>
              <div className={`w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-sm shadow-md ring-4 ring-slate-100 ${getPodiumBadgeClass(Number(grupoProgreso.grupoInfo?.posicionActual))}`}>
                {grupoProgreso.grupoInfo?.posicionActual}
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Puesto General</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center space-y-1 shadow-sm">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nivel Actual</p>
              <div className="w-8 h-8 mx-auto bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md border-2 border-emerald-250">
                <Star size={14} className="fill-current" />
              </div>
              <p className="text-xs font-bold text-emerald-700 leading-none mt-2.5">Nivel {grupoProgreso.grupoInfo?.nivel}</p>
              <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wide">{grupoProgreso.grupoInfo?.etiquetaNivel}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider px-0.5">Desglose de Puntos por Área</h4>
            <div className="space-y-3.5">
              {grupoProgreso.desgloseAreas.map((area: any) => {
                const pct = Math.min(100, (area.puntos / (area.max || 600)) * 100);
                return (
                  <div key={area.id} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                      <span className="text-slate-650">{area.name}</span>
                      <span className="text-slate-900 font-mono font-bold">{area.puntos} PTS</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/20 shadow-inner">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-500 shadow-sm" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-0.5">Historial Reciente</h4>
              <button onClick={() => setIsHistoryModalOpen(true)} className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:underline cursor-pointer">Ver todo</button>
            </div>
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30 divide-y divide-slate-100 shadow-sm">
              {grupoProgreso.historialReciente.slice(0, 5).map((h: any) => (
                <div key={h.id} className="p-4 flex justify-between items-center text-xs font-semibold bg-white/40 hover:bg-white transition duration-155">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0 bg-indigo-600 shadow-sm animate-pulse"></div>
                    <div className="truncate">
                      <p className="text-slate-800 font-bold text-sm truncate">{h.actividad}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{h.area} - {h.fecha}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 text-sm shrink-0">+{h.puntos} pts</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-2xl p-4 flex items-start gap-2.5 shadow-sm">
            <Info size={15} className="text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              Sigue participando en todas las actividades institucionales y acumulando puntos en el marcador para liderar el podio general de tu aula.
            </p>
          </div>
        </div>

        <div className="xl:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-premium space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-50 border border-indigo-100/50 text-indigo-600 rounded-xl flex items-center justify-center"><Layers size={15} /></div>
                <h2 className="font-bold text-xs text-indigo-950 uppercase tracking-wider">Vista del Organizador (Ranking Completo)</h2>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {isAdmin && (
                  <button onClick={ejecutarExportacionPDF} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-3.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition shadow-sm cursor-pointer">
                    <Download size={14} /> Exportar PDF
                  </button>
                )}
                {isAdmin && (
                  <button onClick={() => setIsControlModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-3.5 bg-indigo-50 border border-indigo-200 text-indigo-650 text-xs font-bold rounded-xl hover:bg-indigo-100/60 transition shadow-sm cursor-pointer">
                    <Settings2 size={14} /> Panel de Control
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-0.5">
              <h3 className="font-extrabold text-base text-slate-800 tracking-tight">
                {isAdmin ? 'Ranking General de GP' : 'Ranking de Mi GP'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {isAdmin ? 'Cierre de periodo: 31 de Mayo de 2026' : 'Vista restringida a tu grupo pequeño'}
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200/60 shadow-premium">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                    <th className="p-3.5 text-center w-14">POS.</th>
                    <th className="p-3.5">GP</th>
                    <th className="p-3.5 text-right">PUNTOS TOTALES</th>
                    <th className="p-3.5 text-center">VARIACIÓN</th>
                    <th className="p-3.5 text-center w-28">NIVEL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 bg-white">
                  {tablaRanking.map((item) => (
                    <tr key={item.id} className={`hover:bg-slate-50/50 transition duration-150 ${selectedGroupId === item.id ? 'bg-indigo-50/30' : ''}`}>
                      <td className="p-3.5 text-center">
                        <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-extrabold text-xs ${getPodiumBadgeClass(item.posicion)}`}>
                          {item.posicion}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                           <Shield size={15} className={`fill-current ${item.shieldColor || 'text-slate-400'}`} />
                          <span className="font-bold text-slate-900 text-xs uppercase">{item.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900 text-sm">{item.totalPoints.toLocaleString()} pts</td>
                      <td className="p-3.5 text-center font-mono">
                        {item.variation >= 0 ? (
                          <span className="text-emerald-600 inline-flex items-center gap-1 font-bold text-xs"><ArrowUp size={12} /> {item.variation}</span>
                        ) : (
                          <span className="text-rose-500 inline-flex items-center gap-1 font-bold text-xs"><ArrowDown size={12} /> {Math.abs(item.variation)}</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-200/60 shadow-sm">
                          Nivel {item.nivel} <Star size={12} className="fill-amber-400 text-amber-500" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs text-slate-400 font-bold uppercase tracking-wider">
            <p>Total de GP: <span className="text-slate-800 font-mono font-extrabold">{tablaRanking.length}</span></p>
            <div className="flex items-center gap-2 font-mono font-bold text-slate-400 text-[10px]">
              <span>ÚLTIMA ACTUALIZACIÓN: {lastUpdated}</span>
              <button 
                onClick={() => { cargarRankingGlobal(); triggerToast('Clasificaciones sincronizadas en tiempo real.'); }} 
                className="p-1 hover:bg-slate-50 text-indigo-600 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-2">
        <div className="xl:col-span-2 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-premium space-y-4">
          <div className="flex items-center gap-2 px-1 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <Calendar size={16} className="text-indigo-650" /> Fechas de Publicación del Ranking General
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold border-t border-slate-50 pt-3.5">
            <div className="space-y-1 border-r border-slate-100 pr-2">
              <h4 className="text-indigo-650 font-bold uppercase tracking-wide">Mensual</h4>
              <p className="text-slate-555 font-semibold leading-tight mt-0.5">Último sábado de cada mes</p>
            </div>
            <div className="space-y-1 border-r border-slate-100 px-1">
              <h4 className="text-indigo-650 font-bold uppercase tracking-wide">Trimestral</h4>
              <p className="text-slate-555 font-semibold leading-tight mt-0.5">Cada 3 meses en programa especial</p>
            </div>
            <div className="space-y-1 pl-1">
              <h4 className="text-indigo-650 font-bold uppercase tracking-wide">Anual</h4>
              <p className="text-slate-555 font-semibold leading-tight mt-0.5">Gran final del año Alive Maranata</p>
            </div>
          </div>
        </div>

        <div className="bg-[#fffbeb] border border-amber-200/80 p-5 rounded-3xl shadow-sm flex items-start gap-4">
          <div className="bg-amber-500 text-white p-3 rounded-2xl shadow-md shrink-0"><Trophy size={22} className="fill-current" /></div>
          <div className="space-y-1">
            <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wider">Objetivo del Ranking</h4>
            <p className="text-xs text-amber-800 font-semibold leading-relaxed mt-0.5">
              Motivar, integrar y reconocer el esfuerzo de cada GP en las diferentes áreas del proyecto Alive.
            </p>
          </div>
        </div>
      </div>

      {notification.isOpen && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white rounded-2xl shadow-premium border border-slate-100 p-4 flex items-center justify-between gap-3.5 animate-slideUp">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><Trophy size={18} /></div>
            <p className="text-xs font-semibold text-slate-700">{notification.message}</p>
          </div>
          <button onClick={() => setNotification({ isOpen: false, message: '' })} className="text-slate-400 hover:text-slate-650"><X size={14} /></button>
        </div>
      )}

      {isDateConfigOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-premium overflow-hidden border border-slate-200/60">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-5 text-white flex justify-between items-center">
              <h3 className="font-bold text-xs uppercase tracking-wider">Configurar Calendario</h3>
              <button onClick={() => setIsDateConfigOpen(false)} className="text-white/80 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={guardarConfiguracionFechas} className="p-6 space-y-4 text-xs font-bold text-slate-600">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Próxima Emisión General</label>
                <input type="text" required value={tempFechaPublicacion} onChange={(e) => setTempFechaPublicacion(e.target.value)} className="w-full border border-slate-200 px-3 py-2.5 rounded-xl font-bold focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Cierre de Periodo Actual</label>
                <input type="text" required value={tempFechaCierre} onChange={(e) => setTempFechaCierre(e.target.value)} className="w-full border border-slate-200 px-3 py-2.5 rounded-xl font-bold focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsDateConfigOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-bold uppercase cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase shadow-md cursor-pointer transition-all active:scale-98">Aplicar Fechas</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isControlModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-premium overflow-hidden border border-slate-200/60">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Settings2 size={16} />
                <h3 className="font-bold text-xs uppercase tracking-wider">Panel de Control Administrativo</h3>
              </div>
              <button onClick={() => setIsControlModalOpen(false)} className="text-white/80 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4 text-xs font-semibold text-slate-650">
              <p className="leading-relaxed">Herramienta de auditoría del sistema para recalcular variaciones algorítmicas mensuales e inyectar bonificaciones.</p>
              <button type="button" onClick={() => { setIsControlModalOpen(false); cargarRankingGlobal(); }} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase shadow-md cursor-pointer transition-all active:scale-98">Forzar Sincronización Inmediata</button>
            </div>
          </div>
        </div>
      )}

      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-premium p-5 border border-slate-200/60 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-indigo-950 uppercase flex items-center gap-2"><Layers size={16}/> Historial Completo</h3>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto my-4 space-y-2 pr-1 flex-1 custom-scrollbar">
              {grupoProgreso.historialReciente.map((h: any) => (
                <div key={h.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs font-semibold">
                  <div>
                    <p className="text-slate-900 font-bold text-sm">{h.actividad}</p>
                    <p className="text-[9px] text-slate-450 mt-0.5 uppercase font-bold">{h.area} • {h.fecha}</p>
                  </div>
                  <span className="text-emerald-605 font-mono font-bold text-sm text-emerald-600">+{h.puntos} pts</span>
                </div>
              ))}
            </div>
            <button onClick={() => setIsHistoryModalOpen(false)} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold uppercase text-xs rounded-xl cursor-pointer">Cerrar Historial</button>
          </div>
        </div>
      )}

    </div>
  );
};