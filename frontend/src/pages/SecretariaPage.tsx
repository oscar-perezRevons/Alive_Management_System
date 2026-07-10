import React, { useEffect, useState, useCallback, useRef } from 'react';
import { secretariaService } from '../services/api';
import { 
  Users, UserPlus, Calendar, Crown, Star, FileText, UserCheck,
  Flag, Music, Info, Trash2, Edit3, Plus,
  AlertTriangle, RefreshCw, Layers, X, Sliders, CheckCircle2, UserIcon, Mail, Pencil
} from 'lucide-react';
import { Loader } from '../components/Loader';

export const SecretariaPage: React.FC = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  
  const [members, setMembers] = useState<any[]>([]);
  const [identity, setIdentity] = useState<any>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gpDropdownOpen, setGpDropdownOpen] = useState(false);
  const isInitialLoad = useRef(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isCreateMemberModalOpen, setIsCreateMemberModalOpen] = useState(false);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');

  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, memberId: null as number | null, memberName: '' });
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'success' as 'success' | 'error', title: '', message: '' });

  const [formData, setFormData] = useState({ name: '', description: '', motto: '', bibleVerse: '', anthemUrl: '' });
  const [linkData, setLinkData] = useState({ userId: '', groupRole: 'Integrante' });
  const [newMemberForm, setNewMemberForm] = useState({ name: '', email: '', birthDate: '', groupRole: 'Integrante' });
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editMemberRole, setEditMemberRole] = useState('Integrante');

  const showAlert = (type: 'success' | 'error', title: string, message: string) => {
    setAlertConfig({ isOpen: true, type, title, message });
  };

  const loadGroupsList = useCallback(async (targetGroupId: number | null = null) => {
    try {
      setLoading(true);
      const res = await secretariaService.getAllGroups();
      const groupsData = res.data || [];
      setGroups(groupsData);
      
      const nextGroupId = targetGroupId || (groupsData.length > 0 ? groupsData[0].id : null);
      if (nextGroupId !== null) {
        setActiveGroupId(nextGroupId);
        const panelRes = await secretariaService.getGroupPanel(nextGroupId);
        setMembers(panelRes.data.members || []);
        setIdentity(panelRes.data.identity || null);
      }
    } catch (err) {
      showAlert('error', 'Fallo de Sincronización', 'Error al sincronizar el ecosistema de Grupos Pequeños.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPanelDetails = useCallback(async (id: number) => {
    try {
      setRefreshing(true);
      const res = await secretariaService.getGroupPanel(id);
      setMembers(res.data.members || []);
      setIdentity(res.data.identity || null);
    } catch (err) {
      showAlert('error', 'Error de Red', 'Fallo de red al descargar las actas del grupo.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { 
    loadGroupsList(); 
  }, [loadGroupsList]);

  useEffect(() => {
    if (activeGroupId !== null && !loading) { 
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
      } else {
        loadPanelDetails(activeGroupId);
      }
    }
  }, [activeGroupId, loading, loadPanelDetails]);

  const openLinkModal = async () => {
    try {
      const res = await secretariaService.getAvailableUsers();
      const rawUsers = res.data || [];
      
      const filteredUsers = rawUsers.filter(
        (authUser: any) => 
          !authUser.groupId && 
          !authUser.groupSmallId && 
          !authUser.smallGroupId &&
          !members.some((m: any) => m.id === authUser.id)
      );

      setAvailableUsers(filteredUsers);
      setLinkData({ userId: filteredUsers[0]?.id || '', groupRole: 'Integrante' });
      setIsLinkModalOpen(true);
    } catch (err) {
      showAlert('error', 'Error de Conexión', 'No se pudo obtener la lista de feligreses.');
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkData.userId || !activeGroupId) return;
    try {
      setRefreshing(true);
      await secretariaService.addMemberToGroup(activeGroupId, {
        userId: parseInt(linkData.userId),
        groupRole: linkData.groupRole
      });
      setIsLinkModalOpen(false);
      showAlert('success', '¡ACTUALIZACIÓN EXITOSA!', 'El nuevo integrante ha sido indexado correctamente.');
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
      setRefreshing(true);
      await secretariaService.createAndLinkMember(activeGroupId, newMemberForm);
      setIsCreateMemberModalOpen(false);
      showAlert('success', '¡REGISTRO EXITOSO!', 'Se ha registrado al usuario y asignado su cargo en el grupo.');
      loadPanelDetails(activeGroupId);
    } catch (err: any) {
      showAlert('error', 'Error de Registro', err.response?.data?.error || 'Fallo al procesar el alta transaccional.');
    }
  };

  const openEditMemberModal = (member: any) => {
    setEditingMember(member);
    setEditMemberRole(member.roleInGP || 'Integrante');
    setIsEditMemberModalOpen(true);
  };

  const handleEditMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !activeGroupId) return;
    try {
      setRefreshing(true);
      await secretariaService.addMemberToGroup(activeGroupId, {
        userId: editingMember.id,
        groupRole: editMemberRole
      });
      setIsEditMemberModalOpen(false);
      showAlert('success', 'MODIFICACIÓN COMPLETADA', 'La responsabilidad del miembro ha sido actualizada con éxito.');
      loadPanelDetails(activeGroupId);
    } catch (err) {
      showAlert('error', 'Error de Edición', 'No se pudo actualizar el cargo del integrante.');
    }
  };

  const initiateRemoveMember = (id: number, name: string) => {
    setDeleteConfirm({ isOpen: true, memberId: id, memberName: name });
  };

  const executeRemoveMember = async () => {
    if (!deleteConfirm.memberId || !activeGroupId) return;
    try {
      setRefreshing(true);
      await secretariaService.deleteMemberFromGroup(activeGroupId, deleteConfirm.memberId);
      setDeleteConfirm({ isOpen: false, memberId: null, memberName: '' });
      showAlert('success', 'Baja Registrada', 'El feligrés ha sido removido de las actas del grupo.');
      loadPanelDetails(activeGroupId);
    } catch (err) {
      showAlert('error', 'Error', 'No se pudo completar la remoción.');
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
      setRefreshing(true);
      if (modalMode === 'CREATE') {
        const res = await secretariaService.createGroup(formData);
        setIsModalOpen(false);
        showAlert('success', '¡Registro Exitoso!', `El grupo "${formData.name.toUpperCase()}" ha sido incorporado.`);
        loadGroupsList(res.data.id);
      } else {
        await secretariaService.updateGroup(activeGroupId!, formData);
        setIsModalOpen(false);
        showAlert('success', '¡Actualización Exitosa!', 'Los datos del grupo han sido modificados.');
        loadPanelDetails(activeGroupId!);
        loadGroupsList(activeGroupId!);
      }
    } catch (err: any) {
      showAlert('error', 'Error Operativo', 'No se pudo procesar la solicitud.');
    }
  };

  const appendGmailSuffix = () => {
    if (!newMemberForm.email.includes('@')) {
      setNewMemberForm({ ...newMemberForm, email: `${newMemberForm.email.trim()}@gmail.com` });
    }
  };

  const drawRoleBadge = (role: string) => {
    const norm = role?.toUpperCase();
    if (norm === 'LÍDER' || norm === 'LIDER') return <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-black text-blue-700 bg-blue-100/70 border border-blue-200 rounded-full w-32 justify-center"><Crown size={12} className="fill-blue-200" /> Líder</span>;
    if (norm === 'SUB_LIDER' || norm === 'SUBLÍDER' || norm === 'SUB LÍDER') return <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-black text-purple-700 bg-purple-100/70 border border-purple-200 rounded-full w-32 justify-center"><Star size={12} className="fill-purple-200" /> Sub Líder</span>;
    if (norm === 'SECRETARIO' || norm === 'SECRETARIA') return <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-black text-amber-700 bg-amber-100/70 border border-amber-200 rounded-full w-32 justify-center"><FileText size={12} /> Secretario</span>;
    if (norm === 'TESORERA' || norm === 'TESORERO') return <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-black text-emerald-700 bg-emerald-100/70 border border-emerald-200 rounded-full w-32 justify-center"><Layers size={12} /> Tesorera</span>;
    return <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-black text-slate-600 bg-slate-100 border border-slate-200 rounded-full w-32 justify-center"><UserCheck size={12} /> Integrante</span>;
  };

  const roleCardsOptions = [
    { value: 'Integrante', label: 'Integrante', desc: 'Miembro regular del concilio', icon: <UserCheck size={15} />, style: 'hover:border-slate-350 hover:bg-slate-50', active: 'border-slate-600 bg-slate-100 text-slate-900 ring-2 ring-slate-200 scale-[1.01]' },
    { value: 'Líder', label: 'Líder', desc: 'Director espiritual del GP', icon: <Crown size={15} />, style: 'hover:border-blue-300 hover:bg-blue-50/40', active: 'border-[#4f46e5] bg-blue-50 text-blue-700 ring-2 ring-blue-200 scale-[1.015]' },
    { value: 'Sub Líder', label: 'Sub Líder', desc: 'Asistente de directiva', icon: <Star size={15} />, style: 'hover:border-purple-300 hover:bg-purple-50/40', active: 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-200 scale-[1.015]' },
    { value: 'Secretario', label: 'Secretario', desc: 'Encargado de actas', icon: <FileText size={15} />, style: 'hover:border-amber-300 hover:bg-amber-50/40', active: 'border-amber-600 bg-amber-50 text-amber-700 ring-2 ring-amber-200 scale-[1.015]' },
    { value: 'Tesorera', label: 'Tesorera', desc: 'Control de finanzas', icon: <Layers size={15} />, style: 'hover:border-emerald-300 hover:bg-emerald-50/40', active: 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200 scale-[1.015]' }
  ];

  if (loading) {
    return <Loader text="Cargando Información..." />;
  }

  return (
    <div className="space-y-5 font-sans text-slate-800 animate-fadeIn bg-[#f4f6fc] w-full px-2 sm:px-4 select-none pb-8">
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="bg-[#4f46e5] p-2.5 text-white rounded-2xl"><Users size={24} className="stroke-[2.5]" /></div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-[#1e3a8a] tracking-tight">Secretaría</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sistema de Gestión de Grupos Pequeños (GP)</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end relative">
          <button onClick={openCreateModal} className="p-2.5 bg-slate-50 text-slate-500 hover:text-emerald-600 rounded-xl border border-slate-200 hover:border-emerald-200 transition-all duration-200 cursor-pointer hover:scale-105" title="Crear Nuevo Grupo"><Plus size={16} /></button>
          
          {groups.length > 0 && (
            <div className="relative">
              <button 
                onClick={() => setGpDropdownOpen(!gpDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-[#4f46e5] rounded-xl text-xs font-black text-[#4f46e5] focus:outline-none cursor-pointer uppercase tracking-wider transition-colors hover:bg-blue-50/40"
              >
                <span>GP: {groups.find(g => g.id === activeGroupId)?.name.toUpperCase() || 'SELECCIONAR'}</span>
                <Sliders size={13} className={`transition-transform duration-200 ${gpDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {gpDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl overflow-hidden z-30 animate-fadeIn">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider">Cambiar de Grupo</div>
                  <div className="max-h-60 overflow-y-auto">
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => {
                          setActiveGroupId(g.id);
                          setGpDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-black transition-colors flex items-center justify-between cursor-pointer ${
                          activeGroupId === g.id ? 'bg-blue-50 text-[#4f46e5]' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>GP {g.name.toUpperCase()}</span>
                        {activeGroupId === g.id && <CheckCircle2 size={13} className="text-[#4f46e5]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {refreshing || loading ? (
        <Loader text="Cargando Información..." />
      ) : identity ? (
        <div className="space-y-5 animate-fadeIn">
          
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="p-5 flex justify-between items-center bg-white border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-[#4f46e5] rounded-xl"><UserCheck size={18} /></div>
                <div>
                  <h2 className="text-base font-black text-[#1e3a8a] uppercase tracking-wide">Lista de Integrantes</h2>
                  <p className="text-xs text-slate-400 font-bold">Feligresía registrada oficialmente en el grupo</p>
                </div>
              </div>
              <button onClick={openLinkModal} className="flex items-center gap-1.5 px-5 py-2.5 bg-[#4f46e5] hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer">
                <UserPlus size={14} /> Agregar Integrante
              </button>
            </div>

            <div className="overflow-x-auto overflow-y-hidden border-transparent select-text scrollbar-none [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#1e40af] text-white font-black uppercase tracking-wider text-[11px] h-12">
                    <th className="p-4 text-center w-14">#</th>
                    <th className="p-4 text-base">Nombre Completo</th>
                    <th className="p-4 text-base">Fecha de Nacimiento</th>
                    <th className="p-4 text-center text-base">Seguro de Vida</th>
                    <th className="p-4 text-center text-base">Responsabilidad</th>
                    <th className="p-4 text-center w-28 text-base">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-700 bg-white">
                  {members.map((m, i) => (
                    <tr key={m.id} className="hover:bg-blue-50/20 transform hover:scale-[1.001] transition-all duration-150 group">
                      <td className="p-4 text-center text-slate-400 font-mono font-black text-sm">{i + 1}</td>
                      <td className="p-4 font-black text-slate-900 text-base">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-300/40 rounded-full flex items-center justify-center font-black text-slate-500 text-xs uppercase shrink-0 group-hover:border-blue-400 transition-colors">
                            {m.name.charAt(0)}
                          </div>
                          <span className="capitalize tracking-tight">{m.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-500 font-bold"><span className="inline-flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100 text-xs"><Calendar size={13} className="text-slate-400" /> {m.birthDate || 'No registrada'}</span></td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-lg font-black text-xs tracking-wide uppercase border border-slate-200 ${m.hasLifeInsurance ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                          {m.hasLifeInsurance ? 'Vigente' : 'Falta'}
                        </span>
                      </td>
                      <td className="p-4 text-center"><div className="flex justify-center">{drawRoleBadge(m.roleInGP)}</div></td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2.5">
                          <button onClick={() => openEditMemberModal(m)} className="p-2 text-blue-600 hover:bg-blue-50 border border-slate-100 rounded-xl transition-all duration-150 cursor-pointer hover:scale-110 active:scale-90"><Pencil size={14} /></button>
                          <button onClick={() => initiateRemoveMember(m.id, m.name)} className="p-2 text-rose-600 hover:bg-rose-50 border border-slate-100 rounded-xl transition-all duration-150 cursor-pointer hover:scale-110 active:scale-90"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="p-5 flex items-center justify-between bg-white border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-[#4f46e5] rounded-xl"><Info size={18} /></div>
                <div>
                  <h2 className="text-lg font-black text-[#1e3a8a] uppercase tracking-wide">Ficha de Identidad del GP</h2>
                  <p className="text-xs text-slate-400 font-bold">Datos heráldicos, ideales colectivos y versículo de fe</p>
                </div>
              </div>
              <button onClick={openEditModal} className="p-2.5 text-blue-600 hover:bg-blue-50 border border-blue-100 rounded-xl transition duration-200 hover:-translate-y-0.5 cursor-pointer" title="Editar Ficha"><Edit3 size={15} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-white">
              
              <div className="p-6 space-y-4 bg-gradient-to-br from-slate-50/50 to-white">
                <div>
                  <span className="text-xs font-black text-slate-400 uppercase block tracking-wider">Nombre Oficial del Concilio</span>
                  <span className="text-2xl font-black text-[#4f46e5] uppercase tracking-tight block mt-1">GP {identity.name}</span>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-black text-slate-600 flex items-center gap-1.5 uppercase tracking-wide"><Flag size={14} className="text-[#4f46e5]" /> Estandarte Heráldico</span>
                  <div className="w-full h-36 bg-gradient-to-br from-blue-700 via-[#4f46e5] to-indigo-900 rounded-2xl flex items-center justify-center text-white font-black text-base uppercase relative border border-white/10 overflow-hidden group">
                    <div className="border-2 border-white/20 rounded-xl p-4 text-center bg-white/10 backdrop-blur-xs tracking-widest font-black transition transform group-hover:scale-105">
                       GP {identity.name.toUpperCase()} 
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4 bg-gradient-to-br from-blue-50/30 to-white">
                <div>
                  <span className="text-xs font-black text-slate-400 uppercase block tracking-wider">Lema Institucional</span>
                  <p className="text-base font-extrabold text-slate-800 italic mt-1 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/70">
                    "{identity.motto || 'Sin lema asignado.'}"
                  </p>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-black text-slate-600 flex items-center gap-1.5 uppercase tracking-wide"><Music size={14} className="text-[#4f46e5]" /> Himno Corporativo Registrado</span>
                  <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100 flex items-center gap-3.5">
                    <div className="p-2.5 bg-white rounded-xl text-[#4f46e5] border border-blue-200/60"><Music size={18} /></div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-black text-blue-900 truncate uppercase tracking-tight">{identity.anthemUrl || 'Sin Himno Registrado'}</h4>
                      <p className="text-[10px] text-slate-400 font-black mt-0.5 uppercase tracking-wider">Archivo Oficial Conectado</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4 bg-gradient-to-br from-indigo-50/20 to-white">
                <div>
                  <span className="text-xs font-black text-slate-400 uppercase block tracking-wider">Versículo Clave Llavero</span>
                  <p className="text-base font-bold text-slate-700 leading-relaxed mt-1 bg-white p-3 rounded-xl border border-slate-200/70">
                    "{identity.verse || 'No redactado.'}"
                  </p>
                  <span className="text-xs font-black text-[#4f46e5] bg-blue-50 border border-blue-100 px-3 py-1 rounded-md inline-block mt-2 uppercase tracking-wide">Romanos 8:37</span>
                </div>
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 font-black uppercase tracking-wider space-y-1">
                  <span className="block text-[10px] text-slate-400 tracking-wide">Fecha de Fundación</span>
                  <span className="text-slate-900 font-black block text-base tracking-tight">{identity.createdAtDate || '01 de Julio de 2026'}</span>
                </div>
              </div>

            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 font-black uppercase tracking-wider px-6">
              Administrador encargado de actas: <span className="text-slate-800 font-black capitalize tracking-normal">{identity.administratorName}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center text-sm font-black text-slate-400 bg-white rounded-3xl border border-slate-200 uppercase tracking-wider italic">Crea tu primer grupo pequeño desde el botón superior de configuración.</div>
      )}

      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-[#4f46e5]/10 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm p-6 rounded-3xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
              <Trash2 size={26} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">¿Confirmar desvinculación?</h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed px-1">
                ¿Estás seguro que deseas remover a <span className="text-slate-900 font-black font-mono">"{deleteConfirm.memberName}"</span> de las actas de este GP?
              </p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button type="button" disabled={refreshing} onClick={() => setDeleteConfirm({ isOpen: false, memberId: null, memberName: '' })} className="flex-1 py-2.5 bg-slate-100 text-slate-500 font-black uppercase tracking-wider text-xs rounded-xl cursor-pointer hover:bg-slate-200 transition">Cancelar</button>
              <button type="button" disabled={refreshing} onClick={executeRemoveMember} className="flex-1 py-2.5 bg-[#4f46e5] hover:bg-blue-700 text-white font-black uppercase tracking-wider text-xs rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5">
                {refreshing ? <RefreshCw size={12} className="animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditMemberModalOpen && editingMember && (
        <div className="fixed inset-0 bg-[#4f46e5]/10 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl border border-slate-200 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-[#4f46e5]" />
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Editar Responsabilidad</h3>
              </div>
              <button type="button" onClick={() => setIsEditMemberModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg transition cursor-pointer"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleEditMemberSubmit} className="space-y-4 text-xs font-bold text-slate-600">
              <div className="space-y-1 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <span className="text-[10px] font-black text-[#4f46e5] uppercase tracking-wider block">Integrante Seleccionado</span>
                <span className="text-base font-black text-slate-900 block mt-0.5 capitalize">{editingMember.name}</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">Selecciona el Cargo Corporativo</label>
                <div className="grid grid-cols-1 gap-2">
                  {roleCardsOptions.map((roleOpt) => {
                    const isSelected = editMemberRole === roleOpt.value;
                    return (
                      <button
                        key={roleOpt.value}
                        type="button"
                        onClick={() => setEditMemberRole(roleOpt.value)}
                        className={`w-full text-left p-3.5 rounded-xl border-2 transition-all duration-200 flex items-center justify-between cursor-pointer transform hover:scale-[1.015] ${
                          isSelected ? roleOpt.active : `border-slate-200 bg-white text-slate-700 ${roleOpt.style}`
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/40' : 'bg-slate-50 text-slate-400'}`}>
                            {roleOpt.icon}
                          </div>
                          <div>
                            <span className="text-sm font-black block uppercase tracking-tight">{roleOpt.label}</span>
                            <span className={`text-[11px] block font-medium ${isSelected ? 'opacity-90 font-bold' : 'text-slate-400'}`}>{roleOpt.desc}</span>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={16} className="shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsEditMemberModalOpen(false)} className="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-xs cursor-pointer">Cancelar</button>
                <button type="submit" disabled={refreshing} className="px-5 py-2.5 bg-[#4f46e5] hover:bg-blue-700 text-white rounded-xl font-black uppercase text-xs cursor-pointer transition flex items-center justify-center gap-1.5 shadow-3xs">
                  {refreshing ? <RefreshCw size={12} className="animate-spin" /> : 'Sincronizar Cargo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#4f46e5]/10 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg p-6 rounded-3xl border border-slate-200 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-[#4f46e5]" />
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">{modalMode === 'CREATE' ? 'Agregar Nuevo Grupo' : `Modificar Información`}</h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg transition cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-bold text-slate-600">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nombre del Grupo *</label><input type="text" required placeholder="Ej: Siloé" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#4f46e5] focus:bg-white transition" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lema o Slogan</label><input type="text" placeholder="Ej: Firmes en la fe" value={formData.motto} onChange={(e) => setFormData({...formData, motto: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#4f46e5] focus:bg-white transition" /></div>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Título del Himno Oficial</label><input type="text" placeholder="Ej: Cuán Grande es Él" value={formData.anthemUrl} onChange={(e) => setFormData({...formData, anthemUrl: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#4f46e5] focus:bg-white transition" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Versículo Bíblico Corporativo</label><textarea placeholder="Texto bíblico..." rows={3} value={formData.bibleVerse} onChange={(e) => setFormData({...formData, bibleVerse: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#4f46e5] focus:bg-white resize-none transition" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Descripción</label><input type="text" placeholder="Breve reseña..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#4f46e5] focus:bg-white transition" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100"><button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-xs cursor-pointer">Cancelar</button><button type="submit" disabled={refreshing} className="px-5 py-2.5 bg-[#4f46e5] text-white rounded-xl font-black uppercase text-xs cursor-pointer transition flex items-center justify-center gap-1.5">{refreshing && <RefreshCw size={12} className="animate-spin" />} Guardar Registro</button></div>
            </form>
          </div>
        </div>
      )}

      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-[#4f46e5]/10 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-[#4f46e5]" />
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Vincular Integrante</h3>
              </div>
              <button type="button" onClick={() => setIsLinkModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg transition cursor-pointer"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleLinkSubmit} className="space-y-4 text-xs font-bold text-slate-600">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Seleccionar Feligrés Disponible</label>
                
                {availableUsers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 border border-slate-100 p-1 rounded-2xl bg-slate-50/50">
                    {availableUsers.map((user) => {
                      const isUserSelected = linkData.userId === String(user.id);
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => setLinkData({ ...linkData, userId: String(user.id) })}
                          className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all duration-150 transform hover:scale-[1.01] cursor-pointer ${
                            isUserSelected ? 'border-[#4f46e5] bg-blue-50 text-[#4f46e5] ring-2 ring-blue-100 font-black' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${isUserSelected ? 'bg-[#4f46e5] text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <span className="text-sm font-black block truncate">{user.name}</span>
                              <span className={`text-[11px] block font-mono ${isUserSelected ? 'text-blue-500 font-bold' : 'text-slate-400'}`}>{user.email}</span>
                            </div>
                          </div>
                          {isUserSelected && <CheckCircle2 size={16} />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs font-black text-slate-400 py-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/30">No existen feligreses sin vinculación en la central.</p>
                )}
                <button type="button" onClick={switchToCreateMemberModal} className="text-[11px] font-black text-blue-600 hover:underline mt-1 block cursor-pointer uppercase tracking-wide">¿No encuentras al usuario? Regístralo aquí</button>
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Cargo Asignado en Grupo</label>
                <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
                  {roleCardsOptions.map((roleOpt) => {
                    const isSelected = linkData.groupRole === roleOpt.value;
                    return (
                      <button
                        key={`link-${roleOpt.value}`}
                        type="button"
                        onClick={() => setLinkData({ ...linkData, groupRole: roleOpt.value })}
                        className={`w-full text-left p-2.5 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                          isSelected ? roleOpt.active : `border-slate-200 bg-white text-slate-700 ${roleOpt.style}`
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/40' : 'bg-slate-50 text-slate-400'}`}>
                            {roleOpt.icon}
                          </div>
                          <span className="text-xs font-black uppercase tracking-tight">{roleOpt.label}</span>
                        </div>
                        {isSelected && <CheckCircle2 size={14} className="text-current" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100"><button type="button" onClick={() => setIsLinkModalOpen(false)} className="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-xs cursor-pointer">Cancelar</button><button type="submit" disabled={availableUsers.length === 0 || refreshing} className="px-5 py-2.5 bg-[#4f46e5] hover:bg-blue-700 text-white rounded-xl font-black uppercase text-xs cursor-pointer transition flex items-center justify-center gap-1.5">{refreshing && <RefreshCw size={12} className="animate-spin" />} Asignar e Integrar</button></div>
            </form>
          </div>
        </div>
      )}

      {isCreateMemberModalOpen && (
        <div className="fixed inset-0 bg-[#4f46e5]/10 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-emerald-600" />
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Registrar Nuevo Miembro</h3>
              </div>
              <button type="button" onClick={() => setIsCreateMemberModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg transition cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateAndLinkSubmit} className="space-y-4 text-xs font-bold text-slate-600">
              <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Nombre Completo *</label><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><UserIcon size={14} /></span><input type="text" required placeholder="Ej: Gabriel Espinoza" value={newMemberForm.name} onChange={(e) => setNewMemberForm({...newMemberForm, name: e.target.value})} className="w-full pl-10 p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#4f46e5] focus:bg-white transition" /></div></div>
              
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Correo Electrónico *</label>
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"><Mail size={14} /></span>
                    <input type="text" required placeholder="ejemplo" value={newMemberForm.email} onChange={(e) => setNewMemberForm({...newMemberForm, email: e.target.value})} className="w-full pl-10 p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#4f46e5] focus:bg-white transition" />
                  </div>
                  {!newMemberForm.email.includes('@') && newMemberForm.email.trim().length > 0 && (
                    <button 
                      type="button" 
                      onClick={appendGmailSuffix}
                      className="px-3.5 bg-blue-50 border-2 border-blue-200 text-[#4f46e5] rounded-xl font-black text-xs transition-colors hover:bg-blue-100 cursor-pointer"
                    >
                      + @gmail.com
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="space-y-1"><label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Fecha de Nacimiento</label><input type="date" value={newMemberForm.birthDate} onChange={(e) => setNewMemberForm({...newMemberForm, birthDate: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#4f46e5] bg-white transition" /></div>
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Cargo Asignado</label>
                  <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {roleCardsOptions.map((roleOpt) => {
                      const isSelected = newMemberForm.groupRole === roleOpt.value;
                      return (
                        <button
                          key={`create-${roleOpt.value}`}
                          type="button"
                          onClick={() => setNewMemberForm({ ...newMemberForm, groupRole: roleOpt.value })}
                          className={`w-full text-left p-2.5 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                            isSelected ? roleOpt.active : `border-slate-200 bg-white text-slate-700 ${roleOpt.style}`
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/40' : 'bg-slate-50 text-slate-400'}`}>
                              {roleOpt.icon}
                            </div>
                            <span className="text-xs font-black uppercase tracking-tight">{roleOpt.label}</span>
                          </div>
                          {isSelected && <CheckCircle2 size={14} className="text-current" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsCreateMemberModalOpen(false)} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-xs cursor-pointer">Volver</button>
                <button type="submit" disabled={refreshing} className="px-5 py-2.5 bg-[#4f46e5] hover:bg-blue-700 text-white rounded-xl font-black uppercase text-xs cursor-pointer transition flex items-center justify-center gap-1.5">
                  {refreshing && <RefreshCw size={12} className="animate-spin" />} Registrar e Integrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {alertConfig.isOpen && (
        <div className="fixed inset-0 bg-[#4f46e5]/10 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm p-6 rounded-3xl border border-slate-200 text-center space-y-4">
            <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center bg-blue-50 text-[#4f46e5] border border-blue-100`}>
              {alertConfig.type === 'success' ? <CheckCircle2 size={28} /> : <AlertTriangle size={28} />}
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{alertConfig.title}</h4>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">{alertConfig.message}</p>
            </div>
            <button 
              onClick={() => setAlertConfig({ ...alertConfig, isOpen: false })} 
              className="w-full py-3 text-white font-black text-xs rounded-xl uppercase tracking-wider cursor-pointer bg-[#4f46e5] hover:bg-blue-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
};