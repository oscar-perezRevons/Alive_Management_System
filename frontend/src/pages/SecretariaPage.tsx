import React, { useState } from 'react';
import { 
  Users, UserPlus, Calendar, ShieldCheck, ShieldAlert, 
  Crown, Star, FileText, Bookmark, Play, Pause, 
  Flag, Music, Info, Pencil, Trash2 
} from 'lucide-react';

// DATOS SEMILLA REALES DE ACUERDO AL MOCKUP IMAGE_362820.PNG
const INITIAL_MEMBERS: any[] = [
  { id: 1, name: 'Mario Pérez García', birthDate: '12/05/2002', hasLifeInsurance: true, roleInGP: 'Líder' },
  { id: 2, name: 'Ana Flores Martínez', birthDate: '08/11/2005', hasLifeInsurance: false, roleInGP: 'Sub Líder' },
  { id: 3, name: 'Luis Ramos Torres', birthDate: '15/03/2010', hasLifeInsurance: true, roleInGP: 'Secretario' },
  { id: 4, name: 'Sofía Hernández Díaz', birthDate: '22/07/2008', hasLifeInsurance: true, roleInGP: 'Tesorera' },
  { id: 5, name: 'David Molina López', birthDate: '30/01/2012', hasLifeInsurance: false, roleInGP: 'Integrante' }
];

const GP_IDENTITY = {
  name: 'GP VICTORIA',
  motto: '"Más que vencedores por medio de Cristo."',
  verse: '"Antes, en todas estas cosas somos más que vencedores por medio de aquel que nos amó."',
  verseReference: 'Romanos 8:37',
  flagUrl: '/assets/flag-victoria.png', // Fallback estático de diseño
  anthemTitle: 'Mi Mejor Amigo',
  anthemArtist: 'Marcela Gándara',
  anthemDuration: '4:35',
  createdAtDate: '15 de enero de 2024',
  timeElapsed: '1 año, 5 meses'
};

export const SecretariaPage: React.FC = () => {
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [isPlaying, setIsPlaying] = useState(false);

  // Renderizador dinámico de los badges de Responsabilidad según el Mockup
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'Líder':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full">
            <Crown size={12} className="fill-indigo-200" /> Líder
          </span>
        );
      case 'Sub Líder':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-100 rounded-full">
            <Star size={12} className="fill-purple-200" /> Sub Líder
          </span>
        );
      case 'Secretario':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-full">
            <FileText size={12} /> Secretario
          </span>
        );
      case 'Tesorera':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-full">
            <Users size={12} /> Tesorera
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-600 bg-slate-100 rounded-full">
            <Users size={12} /> Integrante
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 animate-fadeIn">
      
      {/* SECCIÓN TITULAR TITULO/SUBTITULO */}
      <div className="space-y-0.5 px-1">
        <h1 className="text-2xl font-black text-[#002ec4] tracking-tight flex items-center gap-2">
          <span className="text-3xl font-light text-slate-300">|</span> Secretaría
        </h1>
        <p className="text-xs text-slate-500 font-medium">Sistema de Gestión de Grupos Pequeños (GP)</p>
      </div>

      {/* BLOQUE DE INTEGRANTES (TABLA REAL DEL MOCKUP) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/40 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-[#002ec4] rounded-2xl">
              <Users size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 tracking-tight">Integrantes</h2>
              <p className="text-[11px] text-slate-400 font-semibold">Lista oficial de integrantes del GP</p>
            </div>
          </div>
          
          <button className="flex items-center gap-1.5 px-4 py-2 bg-[#002ec4] hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-md shadow-blue-600/10 transition active:scale-95">
            <UserPlus size={14} /> Agregar Integrante
          </button>
        </div>

        {/* TABLA DE INTEGRANTES CON DISEÑO DE ALTA FIDELIDAD */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#002ec4] text-white text-xs font-bold tracking-wider">
                <th className="p-4 text-center w-12">#</th>
                <th className="p-4">Nombre Completo</th>
                <th className="p-4">Fecha de Nacimiento</th>
                <th className="p-4 text-center">Seguro de Vida</th>
                <th className="p-4">Responsabilidad</th>
                <th className="p-4 text-center w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {members.map((member, idx) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                  <td className="p-4 flex items-center gap-3 font-bold text-slate-800">
                    <div className="w-7 h-7 bg-slate-200 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-black text-slate-400 text-[10px]">
                      {member.name.charAt(0)}
                    </div>
                    {member.name}
                  </td>
                  <td className="p-4 text-slate-500">
                    <span className="inline-flex items-center gap-1.5"><Calendar size={13} className="text-slate-300" /> {member.birthDate}</span>
                  </td>
                  <td className="p-4 text-center">
                    {member.hasLifeInsurance ? (
                      <span className="px-3 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100 text-[11px] font-bold">Sí</span>
                    ) : (
                      <span className="px-3 py-0.5 bg-rose-50 text-rose-600 rounded-md border border-rose-100 text-[11px] font-bold">No</span>
                    )}
                  </td>
                  <td className="p-4">{renderRoleBadge(member.roleInGP)}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 border border-slate-100 rounded-lg transition" title="Editar"><Pencil size={12} /></button>
                      <button className="p-1.5 text-rose-600 hover:bg-rose-50 border border-slate-100 rounded-lg transition" title="Eliminar"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BLOQUE INFERIOR: INFORMACIÓN DEL GP (TRIPLE COLUMNA EN RECUADROS INTEGRADOS) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 flex items-center gap-3 bg-slate-50/40 border-b border-slate-100">
          <div className="p-2.5 bg-blue-50 text-[#002ec4] rounded-2xl">
            <Info size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 tracking-tight">Información del GP</h2>
            <p className="text-[11px] text-slate-400 font-semibold">Datos e identidad oficial del grupo</p>
          </div>
        </div>

        {/* CONTENEDOR DE CAMPOS LITÚRGICOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          {/* COLUMNA 1: NOMBRE DEL GP Y BANDERA */}
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600 shrink-0"><Users size={16} /></div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nombre del GP</span>
                <span className="text-base font-black text-slate-800 uppercase tracking-tight">{GP_IDENTITY.name}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <Flag size={14} className="text-blue-600" /> Bandera
              </div>
              {/* Contenedor emulador de bandera del mockup */}
              <div className="w-full h-32 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 border border-slate-200/60 p-4 flex flex-col justify-end text-white shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
                <div className="border-2 border-white/20 rounded-xl p-2 text-center space-y-1 relative z-10 bg-white/5 backdrop-blur-xs">
                  <div className="w-5 h-5 mx-auto border border-white/40 rounded-full flex items-center justify-center text-[8px] font-black">★</div>
                  <span className="text-xs font-black tracking-widest block uppercase">{GP_IDENTITY.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA 2: LEMA E HIMNO CON REPRODUCTOR INTERACTIVO */}
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600 shrink-0"><Bookmark size={16} /></div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lema</span>
                <p className="text-xs font-bold text-slate-700 italic mt-0.5 leading-relaxed">{GP_IDENTITY.motto}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <Music size={14} className="text-blue-600" /> Himno o Canción
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center space-y-2">
                <div>
                  <h4 className="text-xs font-black text-slate-800 leading-none">{GP_IDENTITY.anthemTitle}</h4>
                  <span className="text-[10px] text-slate-400 font-semibold">{GP_IDENTITY.anthemArtist}</span>
                </div>
                {/* Controles de reproducción exactos del mockup */}
                <div className="flex items-center gap-3 pt-1">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md shadow-blue-600/10 active:scale-95 transition"
                  >
                    {isPlaying ? <Pause size={12} fill="white" /> : <Play size={12} fill="white" className="translate-x-0.5" />}
                  </button>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold text-slate-400">0:00</span>
                    <div className="flex-1 h-1 bg-slate-200 rounded-full relative">
                      <div className="absolute top-0 left-0 w-0 h-full bg-blue-600 rounded-full"></div>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-400">{GP_IDENTITY.anthemDuration}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA 3: VERSÍCULO DE MEMORIA Y FECHA DE CREACIÓN */}
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600 shrink-0"><Bookmark size={16} /></div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Versículo</span>
                <p className="text-xs font-semibold text-slate-600 leading-relaxed mt-0.5">{GP_IDENTITY.verse}</p>
                <span className="text-[10px] font-black text-blue-600 block mt-1">{GP_IDENTITY.verseReference}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100/80 flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600 shrink-0"><Calendar size={16} /></div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fecha de Creación</span>
                <span className="text-xs font-black text-slate-800 block mt-0.5">{GP_IDENTITY.createdAtDate}</span>
                <span className="text-[10px] text-slate-400 font-semibold block">({GP_IDENTITY.timeElapsed})</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};