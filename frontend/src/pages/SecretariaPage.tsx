import React, { useEffect, useState } from 'react';
import { secretariaService } from '../services/api';
import { 
  Users, UserPlus, Calendar, Crown, Star, FileText, UserCheck,
  Play, Pause, Flag, Music, Info, Trash2, Edit3, Plus,
  AlertTriangle, RefreshCw, Layers, X, Sliders, CheckCircle2, UserIcon, Mail, Pencil
} from 'lucide-react';

export const SecretariaPage: React.FC = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  
  const [members, setMembers] = useState<any[]>([]);
  const [identity, setIdentity] = useState<any>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  // Modales Visuales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isCreateMemberModalOpen, setIsCreateMemberModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');

  // Notificaciones Modales Premium
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'success' as 'success' | 'error', title: '', message: '' });

  // Formularios
  const [formData, setFormData] = useState({ name: '', description: '', motto: '', bibleVerse: '', anthemUrl: '' });
  const [linkData, setLinkData] = useState({ userId: '', groupRole: 'Integrante' });
  const [newMemberForm, setNewMemberForm] = useState({ name: '', email: '', birthDate: '', groupRole: 'Integrante' });

  const showAlert = (type: 'success' | 'error', title: string, message: string) => {
    setAlertConfig({ isOpen: true, type, title, message });
  };

  const loadGroupsList = async (targetGroupId: number | null = null) => {
    try {
      setLoading(true);
      const res = await secretariaService.getAllGroups();
      setGroups(res.data);
      if (res.data.length > 0) {
        setActiveGroupId(targetGroupId || res.data[0].id);
      }
    } catch (err) {
      setError('Error al sincronizar el ecosistema de Grupos Pequeños.');
    } finally {
      setLoading(false);
    }
  };

  const loadPanelDetails = async (id: number) => {
    try {
      setRefreshing(true);
      setError('');
      const res = await secretariaService.getGroupPanel(id);
      setMembers(res.data.members);
      setIdentity(res.data.identity);
    } catch (err) {
      setError('Fallo de red al descargar las actas del grupo.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { loadGroupsList(); }, []);

  useEffect(() => {
    if (activeGroupId !== null) { loadPanelDetails(activeGroupId); }
  }, [activeGroupId]);

  const openLinkModal = async () => {
    try {
      const res = await secretariaService.getAvailableUsers();
      setAvailableUsers(res.data);
      setLinkData({ userId: res.data[0]?.id || '', groupRole: 'Integrante' });
      setIsLinkModalOpen(true);
    } catch (err) {
      showAlert('error', 'Error de Conexión', 'No se pudo obtener la lista de feligreses.');
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkData.userId || !activeGroupId) return;
    try {
      await secretariaService.addMemberToGroup(activeGroupId, {
        userId: parseInt(linkData.userId),
        groupRole: linkData.groupRole
      });
      setIsLinkModalOpen(false);
      showAlert('success', '¡Vinculación Exitosa!', 'El nuevo integrante ha sido indexado correctamente.');
      loadPanelDetails(activeGroupId);
    } catch (err) {
      showAlert('error', 'Error Operativo', 'Fallo al enlazar el usuario al Grupo Pequeño.');
    }
  };

  const switchToCreateMemberModal = () => {
    setIsLinkModalOpen(false);
    setNewMemberForm({ name: '', email: '', birthDate: '', groupRole: 'Integrante' });
    setIsCreateMemberModalOpen(true);
  };

  const handleCreateAndLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupId) return;
    try {
      await secretariaService.createAndLinkMember(activeGroupId, newMemberForm);
      setIsCreateMemberModalOpen(false);
      showAlert('success', '¡Integrante Creado!', 'Se ha registrado al usuario y asignado su cargo en el grupo.');
      loadPanelDetails(activeGroupId);
    } catch (err: any) {
      showAlert('error', 'Error de Registro', err.response?.data?.error || 'Fallo al procesar el alta transaccional.');
    }
  };

  const openCreateModal = () => {
    setModalMode('CREATE');
    setFormData({ name: '', description: '', motto: '', bibleVerse: '', anthemUrl: '' });
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    if (!identity) return;
    setModalMode('EDIT');
    setFormData({ name: identity.name, description: identity.description || '', motto: identity.motto, bibleVerse: identity.verse, anthemUrl: identity.anthemUrl });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    try {
      if (modalMode === 'CREATE') {
        const res = await secretariaService.createGroup(formData);
        setIsModalOpen(false);
        showAlert('success', '¡Registro Exitoso!', `El grupo "${formData.name.toUpperCase()}" ha sido incorporado.`);
        loadGroupsList(res.data.id);
      } else {
        await secretariaService.updateGroup(activeGroupId!, formData);
        setIsModalOpen(false);
        showAlert('success', '¡Actualización Exitosa!', 'Los datos han sido modificados.');
        loadPanelDetails(activeGroupId!);
        loadGroupsList(activeGroupId!);
      }
    } catch (err: any) {
      showAlert('error', 'Error Operativo', 'No se pudo procesar la solicitud.');
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (window.confirm('¿Deseas desvincular a este miembro del grupo actual?')) {
      try {
        await secretariaService.deleteMemberFromGroup(activeGroupId!, userId);
        showAlert('success', 'Baja Registrada', 'El feligrés ha sido removido de las actas.');
        loadPanelDetails(activeGroupId!);
      } catch (err) {
        showAlert('error', 'Error', 'No se pudo completar la remoción.');
      }
    }
  };

  const drawRoleBadge = (role: string) => {
    const norm = role?.toUpperCase();
    if (norm === 'LÍDER' || norm === 'LIDER') return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-[#1e40af] bg-indigo-50 border border-indigo-100 rounded-full w-28 justify-center"><Crown size={12} className="fill-indigo-200" /> Líder</span>;
    if (norm === 'SUB_LIDER' || norm === 'SUBLÍDER' || norm === 'SUB LÍDER') return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-100 rounded-full w-28 justify-center"><Star size={12} className="fill-purple-200" /> Sub Líder</span>;
    if (norm === 'SECRETARIO') return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-full w-28 justify-center"><FileText size={12} /> Secretario</span>;
    if (norm === 'TESORERA' || norm === 'TESORERO') return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-full w-28 justify-center"><Users size={12} /> Tesorera</span>;
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-600 bg-slate-100 rounded-full w-28 justify-center"><Users size={12} /> Integrante</span>;
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-white rounded-3xl border border-slate-100">
        <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-blue-600" /> Sincronizando Módulos...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 animate-fadeIn bg-[#f4f6fc]">
      
      {/* 1. SECTOR ENCABEZADO IDÉNTICO AL MOCKUP 2.JPG */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-1">
        <div className="flex items-center gap-3">
          <div className="text-[#002ec4]"><Users size={28} className="stroke-[2.5]" /></div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-[#1e3a8a] tracking-tight">Secretaría</h1>
            <p className="text-xs text-slate-500 font-bold">Sistema de Gestión de Grupos Pequeños (GP)</p>
          </div>
        </div>

        {/* SELECTORES Y CONTROLES ADICIONALES */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button onClick={openCreateModal} className="p-2 bg-white text-slate-500 hover:text-emerald-600 rounded-xl shadow-sm border border-slate-200/60 transition" title="Crear Nuevo Grupo"><Plus size={16} /></button>
          {groups.length > 0 && (
            <select value={activeGroupId || ''} onChange={(e) => setActiveGroupId(Number(e.target.value))} className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-[#002ec4] shadow-sm focus:outline-none cursor-pointer">
              {groups.map((g) => (<option key={g.id} value={g.id}>GP {g.name.toUpperCase()}</option>))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2"><AlertTriangle size={16} /> <span>{error}</span></div>
      )}

      {/* 2. ENTORNO DE COMPONENTES OPERATIVOS REALES */}
      {refreshing ? (
        <div className="text-center py-16 text-xs font-black text-slate-400 uppercase tracking-widest"><RefreshCw size={16} className="animate-spin mx-auto mb-2 text-[#002ec4]" /> Sincronizando interfaces del grupo...</div>
      ) : identity ? (
        <div className="space-y-6">
          
          {/* BLOQUE DE INTEGRANTES (ESTILO FIEL DE LA TABLA DEL MOCKUP) */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-[#002ec4] rounded-xl"><Users size={18} /></div>
                <div>
                  <h2 className="text-sm font-black text-[#1e3a8a]">Integrantes</h2>
                  <p className="text-[11px] text-slate-400 font-bold">Lista oficial de integrantes del GP</p>
                </div>
              </div>
              <button onClick={openLinkModal} className="flex items-center gap-1.5 px-4 py-2 bg-[#002ec4] hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95">
                <UserPlus size={13} /> Agregar Integrante
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1e40af] text-white text-xs font-bold tracking-wider">
                    <th className="p-4 text-center w-12">#</th>
                    <th className="p-4">Nombre Completo</th>
                    <th className="p-4">Fecha de Nacimiento</th>
                    <th className="p-4 text-center">Seguro de Vida</th>
                    <th className="p-4 text-center">Responsabilidad</th>
                    <th className="p-4 text-center w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700 bg-white">
                  {members.map((m, i) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 text-center text-slate-400 font-mono font-bold">{i + 1}</td>
                      <td className="p-4 font-bold text-slate-800 flex items-center gap-3">
                        <div className="w-7 h-7 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center font-black text-slate-400 text-[10px] shrink-0">
                          {m.name.charAt(0)}
                        </div>
                        {m.name}
                      </td>
                      <td className="p-4 text-slate-500"><span className="inline-flex items-center gap-1.5"><Calendar size={13} className="text-slate-300" /> {m.birthDate}</span></td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-0.5 rounded-md font-bold text-[11px] ${m.hasLifeInsurance ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                          {m.hasLifeInsurance ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td className="p-4 text-center flex justify-center">{drawRoleBadge(m.roleInGP)}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button className="p-1.5 text-blue-600 hover:bg-blue-50 border border-slate-100 rounded-lg transition"><Pencil size={12} /></button>
                          <button onClick={() => handleRemoveMember(m.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 border border-slate-100 rounded-lg transition"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12 text-xs font-bold text-slate-400 uppercase tracking-wider bg-white">Sin feligresía vinculada a este GP.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. BLOQUE DE INFORMACIÓN DEL GP (TRIPLE COLUMNA SECCIÓN BAJA DEL MOCKUP) */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 flex items-center justify-between bg-white border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-[#002ec4] rounded-xl"><Info size={16} /></div>
                <div>
                  <h2 className="text-sm font-black text-[#1e3a8a]">Información del GP</h2>
                  <p className="text-[11px] text-slate-400 font-bold">Datos e identidad oficial del grupo</p>
                </div>
              </div>
              <button onClick={openEditModal} className="p-2 text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-xl transition"><Edit3 size={14} /></button>
            </div>

            {/* REJILLA DE TRIPLE COLUMNA IDÉNTICA A 2.JPG */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-white">
              
              {/* Columna 1: Nombre y Bandera */}
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block tracking-wider">Nombre del GP</span>
                  <span className="text-base font-black text-[#1e3a8a] uppercase tracking-tight">GP {identity.name}</span>
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500 block">Bandera</span>
                  <div className="w-full h-32 bg-gradient-to-br from-blue-700 via-[#002ec4] to-indigo-900 rounded-xl flex items-center justify-center text-white font-black text-sm uppercase shadow-md relative border border-white/10">
                    <div className="border-2 border-white/10 rounded-xl p-3 text-center bg-white/5 backdrop-blur-xs">
                      ★ GP {identity.name} ★
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna 2: Lema e Himno */}
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block tracking-wider">Lema</span>
                  <p className="text-xs font-bold text-slate-700 italic mt-1 leading-relaxed">"{identity.motto}"</p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500 block">Himno o Canción</span>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 truncate max-w-[150px]">{identity.anthemUrl}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">Marcela Gándara</p>
                    </div>
                    <button onClick={() => setIsPlaying(!isPlaying)} className="w-8 h-8 bg-[#002ec4] text-white rounded-full flex items-center justify-center shadow-md shadow-blue-500/10">
                      {isPlaying ? <Pause size={12} fill="white" /> : <Play size={12} fill="white" className="translate-x-0.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Columna 3: Versículo y Fecha */}
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block tracking-wider">Versículo</span>
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed mt-1">"{identity.verse}"</p>
                  <span className="text-[10px] font-black text-[#002ec4] block mt-1">Romanos 8:37</span>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-bold space-y-0.5">
                  <span className="block">Fecha de Creación</span>
                  <span className="text-slate-800 font-black block text-xs">{identity.createdAtDate}</span>
                  <span className="text-slate-400 block font-semibold">({identity.timeElapsed})</span>
                </div>
              </div>

            </div>
            
            {/* FOOTER METADATOS DEL FIN DE PÁGINA */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 font-bold px-6">
              Administrador a cargo: <span className="text-slate-700 font-black">{identity.administratorName}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center text-xs font-black text-slate-400 bg-white rounded-3xl border border-slate-100 uppercase tracking-wider">Crea tu primer grupo pequeño desde el botón de configuración.</div>
      )}

      {/* MODAL CONFIGURACIÓN GRUPO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg p-6 rounded-3xl border border-slate-100 shadow-2xl space-y-5 mx-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3"><div className="flex items-center gap-2"><Sliders size={16} className="text-[#0033cc]" /><h3 className="text-base font-black text-slate-800">{modalMode === 'CREATE' ? 'Agregar Nuevo Grupo' : `Modificar Información`}</h3></div><button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg transition"><X size={16} /></button></div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase">Nombre del Grupo *</label><input type="text" required placeholder="Ej: Siloé" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0033cc]" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase">Lema o Slogan</label><input type="text" placeholder="Ej: Firmes en la fe" value={formData.motto} onChange={(e) => setFormData({...formData, motto: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0033cc]" /></div>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase">Título del Himno Oficial</label><input type="text" placeholder="Ej: Cuán Grande es Él" value={formData.anthemUrl} onChange={(e) => setFormData({...formData, anthemUrl: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0033cc]" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase">Versículo Bíblico Corporativo</label><textarea placeholder="Texto bíblico..." rows={3} value={formData.bibleVerse} onChange={(e) => setFormData({...formData, bibleVerse: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0033cc] resize-none" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase">Descripción</label><input type="text" placeholder="Breve reseña..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0033cc]" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl">Cancelar</button><button type="submit" className="px-4 py-2 bg-[#0033cc] text-white font-black text-xs rounded-xl shadow-md">Guardar</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VINCULACIÓN */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl border border-slate-100 shadow-2xl space-y-5 mx-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3"><div className="flex items-center gap-2"><UserCheck size={18} className="text-[#0033cc]" /><h3 className="text-base font-black text-slate-800">Vincular Integrante</h3></div><button onClick={() => setIsLinkModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg transition"><X size={16} /></button></div>
            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase block">Seleccionar Feligrés Disponible</label>
                {availableUsers.length > 0 ? (
                  <select value={linkData.userId} onChange={(e) => setLinkData({...linkData, userId: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0033cc]">
                    {availableUsers.map((user) => (<option key={user.id} value={user.id}>{user.name} ({user.email})</option>))}
                  </select>
                ) : (
                  <p className="text-xs font-semibold text-slate-400 py-1">No hay usuarios libres registrados.</p>
                )}
                <button type="button" onClick={switchToCreateMemberModal} className="text-[11px] font-bold text-blue-600 hover:underline mt-1 block">¿No encuentras al usuario? Regístralo aquí</button>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase block">Responsabilidad / Cargo</label>
                <select value={linkData.groupRole} onChange={(e) => setLinkData({...linkData, groupRole: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:border-[#0033cc]">
                  <option value="Integrante">Integrante</option>
                  <option value="Líder">Líder</option>
                  <option value="Sub Líder">Sub Líder</option>
                  <option value="Secretario">Secretario</option>
                  <option value="Tesorera">Tesorera</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100"><button type="button" onClick={() => setIsLinkModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl">Cancelar</button><button type="submit" disabled={availableUsers.length === 0} className="px-4 py-2 bg-[#0033cc] text-white font-black text-xs rounded-xl shadow-md">Asignar e Integrar</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR MIEMBRO DESDE CERO */}
      {isCreateMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl border border-slate-100 shadow-2xl space-y-5 mx-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3"><div className="flex items-center gap-2"><UserPlus size={18} className="text-emerald-600" /><h3 className="text-base font-black text-slate-800">Registrar Nuevo Miembro</h3></div><button onClick={() => setIsCreateMemberModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg transition"><X size={16} /></button></div>
            <form onSubmit={handleCreateAndLinkSubmit} className="space-y-4">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase block">Nombre Completo *</label><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><UserIcon size={14} /></span><input type="text" required placeholder="Ej: Gabriel Espinoza" value={newMemberForm.name} onChange={(e) => setNewMemberForm({...newMemberForm, name: e.target.value})} className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500" /></div></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase block">Correo Electrónico *</label><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Mail size={14} /></span><input type="email" required placeholder="ejemplo@alive.com" value={newMemberForm.email} onChange={(e) => setNewMemberForm({...newMemberForm, email: e.target.value})} className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500" /></div></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase block">Fecha de Nacimiento</label><input type="date" value={newMemberForm.birthDate} onChange={(e) => setNewMemberForm({...newMemberForm, birthDate: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase block">Cargo Asignado</label><select value={newMemberForm.groupRole} onChange={(e) => setNewMemberForm({...newMemberForm, groupRole: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:border-emerald-500"><option value="Integrante">Integrante</option><option value="Líder">Líder</option><option value="Sub Líder">Sub Líder</option><option value="Secretario">Secretario</option><option value="Tesorera">Tesorera</option></select></div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100"><button type="button" onClick={() => { setIsCreateMemberModalOpen(false); setIsLinkModalOpen(true); }} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl">Volver</button><button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-black text-xs rounded-xl shadow-md">Registrar e Integrar</button></div>
            </form>
          </div>
        </div>
      )}

      {/* FEEDBACK */}
      {alertConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-sm p-6 rounded-3xl border border-slate-100 shadow-2xl text-center space-y-4 mx-4">
            <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${alertConfig.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{alertConfig.type === 'success' ? <CheckCircle2 size={28} /> : <AlertTriangle size={28} />}</div>
            <div className="space-y-1"><h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{alertConfig.title}</h4><p className="text-xs text-slate-500 font-semibold leading-relaxed">{alertConfig.message}</p></div>
            <button onClick={() => setAlertConfig({ ...alertConfig, isOpen: false })} className={`w-full py-2.5 text-white font-black text-xs rounded-xl shadow-md ${alertConfig.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>Entendido</button>
          </div>
        </div>
      )}

    </div>
  );
};