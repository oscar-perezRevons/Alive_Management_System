import React, { useEffect, useState } from 'react';
import { groupsService } from '../services/api';
import { GroupDetailsResponse } from '../types';
import { Shield, Music, BookOpen, Users, Star, RefreshCw, AlertCircle, Flag, Award, Calendar, Radio } from 'lucide-react';

export const SecretariaPage: React.FC = () => {
  const [availableGroups, setAvailableGroups] = useState<{ id: number; name: string }[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [groupDetails, setGroupDetails] = useState<GroupDetailsResponse | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSecretariaDetails = async (id: number) => {
      try {
        setDetailsLoading(true);
        setError('');
        console.log(`📡 Consultando ficha de secretaría del grupo: ${id}`);
        const response = await groupsService.getById(id); 
        setGroupDetails(response.data);
      } catch (err: any) {
        console.error(err);
        setError('Error al compilar la nómina y los registros del grupo seleccionado.');
      } finally {
        setDetailsLoading(false);
      }
    };

    const loadInitialGroups = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('📡 Consultando listado de grupos para la secretaría...');
        const response = await groupsService.getAll();
        setAvailableGroups(response.data);
        
        if (response.data.length > 0) {
          setSelectedGroupId(response.data[0].id);
          await loadSecretariaDetails(response.data[0].id);
        }
      } catch (err: any) {
        console.error(err);
        setError('Error al traccionar los equipos desde la base de datos.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialGroups();
  }, []);

  const handleGroupChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedGroupId(id);
    try {
      setDetailsLoading(true);
      setError('');
      const response = await groupsService.getById(id); 
      setGroupDetails(response.data);
    } catch (err: any) {
      setError('Error al compilar la nómina del grupo seleccionado.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    if (!selectedGroupId) return;
    try {
      setDetailsLoading(true);
      setError('');
      const response = await groupsService.getById(selectedGroupId); 
      setGroupDetails(response.data);
    } catch (err: any) {
      setError('Error al actualizar registros.');
    } finally {
      setDetailsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="text-xs text-gray-400 mt-4 font-bold uppercase tracking-wider">Cargando Libros de Secretaría...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 animate-fadeIn">
      
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-600 rounded-xl text-white shadow-lg">
            <BookOpen size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Secretaría del GP</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Ficha Oficial, Identidad Colectiva y Nómina del Equipo</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedGroupId || ''}
            onChange={handleGroupChange}
            className="flex-1 sm:w-64 px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          >
            {availableGroups.map((g) => (
              <option key={g.id} value={g.id}>GP: {g.name}</option>
            ))}
          </select>
          <button 
            onClick={handleManualRefresh}
            disabled={detailsLoading || !selectedGroupId}
            className="p-2 bg-white hover:bg-slate-50 border border-gray-200 text-gray-500 rounded-xl transition disabled:opacity-50"
            title="Sincronizar Ficha"
          >
            <RefreshCw size={16} className={detailsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {groupDetails && !detailsLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full translate-x-10 -translate-y-10"></div>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-tr from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-md">
                  <Flag size={28} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">{groupDetails.name}</h2>
                  <p className="text-xs text-teal-600 font-bold italic mt-0.5">"{groupDetails.motto || 'Sin lema oficial asignado'}"</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Líder del GP</span>
                  <span className="font-bold text-slate-700 block mt-0.5 truncate">{groupDetails.leaderName || 'No asignado'}</span>
                </div>
                <div className="border-l border-slate-200 pl-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Sublíder</span>
                  <span className="font-bold text-slate-700 block mt-0.5 truncate">{groupDetails.subLeaderName || 'No asignado'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Radio size={12} className="text-teal-600" /> Versículo Clave de Identidad
                </span>
                <div className="p-4 bg-teal-50/40 border border-teal-100 rounded-xl">
                  <p className="text-xs text-slate-700 font-medium leading-relaxed italic text-center">
                    {groupDetails.bibleVerse}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Music size={12} className="text-teal-600" /> Marcha o Himno Oficial del GP
                </span>
                <div className="bg-slate-900 p-3 rounded-xl flex flex-col gap-2 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] text-teal-400 font-mono px-1">
                    <span>himno_oficial.mp3</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  </div>
                  <audio src={groupDetails.anthemUrl} controls className="w-full h-8 rounded-lg outline-none opacity-90 filter invert" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Puntos Brutos</span>
                  <p className="text-xl font-black text-slate-800 mt-0.5">{groupDetails.totalPoints}</p>
                </div>
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600"><Award size={20} /></div>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Impacto Neto</span>
                  <p className="text-xl font-black text-teal-600 mt-0.5">{groupDetails.netPoints} pts</p>
                </div>
                <div className="p-2.5 bg-teal-50 rounded-xl text-teal-600"><Star size={20} className="fill-teal-100" /></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                <span className="text-xs font-black text-white tracking-wide uppercase flex items-center gap-1.5">
                  <Users size={14} className="text-teal-400" /> Nómina de Integrantes Registrados
                </span>
                <span className="px-2.5 py-0.5 bg-white/10 text-white font-mono text-[10px] font-bold rounded-full border border-white/10">
                  Total: {groupDetails.members.length} miembros
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-gray-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-3.5">Id / Nombre</th>
                      <th className="px-4 py-3.5 text-center">Rol Interno</th>
                      <th className="px-4 py-3.5 text-center">Cumpleaños</th>
                      <th className="px-6 py-3.5 text-right">Aporte Real</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-slate-700 font-semibold">
                    {groupDetails.members.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/30 transition duration-150">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-sm tracking-tight">{member.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal mt-0.5">{member.email}</span>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            member.groupRole === 'LIDER' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            member.groupRole === 'SUBLIDER' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            member.groupRole === 'ANFITRION' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            <Shield size={10} />
                            {member.groupRole}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-center font-medium text-slate-500">
                          <div className="inline-flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" />
                            {member.birthDate}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right font-mono font-black text-slate-900 text-sm">
                          {member.contributedPoints > 0 ? (
                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                              +{member.contributedPoints} pts
                            </span>
                          ) : (
                            <span className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">
                              0 pts
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {detailsLoading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="text-xs text-gray-400 mt-4 font-bold uppercase tracking-wider">Compilando Archivos de Secretaría...</p>
        </div>
      )}

    </div>
  );
};