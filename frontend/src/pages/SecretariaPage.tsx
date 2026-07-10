import React, { useEffect, useState, useCallback, useRef } from 'react';
import { secretariaService } from '../services/api';
import { 
  Users, UserPlus, Calendar, Crown, Star, FileText, UserCheck,
  Flag, Music, Info, Trash2, Edit3, Plus,
  AlertTriangle, RefreshCw, Layers, X, Sliders, CheckCircle2, UserIcon, Mail, Pencil
} from 'lucide-react';
import { Loader } from '../components/Loader';
import logoImage from '../assets/logo.png';

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
    if (norm === 'LÍDER' || norm === 'LIDER') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-955/35 border border-amber-400 dark:border-amber-600/80 rounded-full w-28 justify-center shadow-3xs">
          <Crown size={11} className="fill-amber-200 dark:fill-amber-900/40 shrink-0" /> Líder
        </span>
      );
    }
    if (norm === 'SUB_LIDER' || norm === 'SUBLÍDER' || norm === 'SUB LÍDER') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-500/10 dark:bg-fuchsia-955/35 border border-fuchsia-400 dark:border-fuchsia-600/80 rounded-full w-28 justify-center shadow-3xs">
          <Star size={11} className="fill-fuchsia-200 dark:fill-fuchsia-900/40 shrink-0" /> Sub Líder
        </span>
      );
    }
    if (norm === 'SECRETARIO' || norm === 'SECRETARIA') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black text-cyan-700 dark:text-cyan-305 bg-cyan-500/10 dark:bg-cyan-955/35 border border-cyan-400/80 dark:border-cyan-600/80 rounded-full w-28 justify-center shadow-3xs">
          <FileText size={11} className="shrink-0" /> Secretario
        </span>
      );
    }
    if (norm === 'TESORERA' || norm === 'TESORERO') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black text-emerald-700 dark:text-emerald-305 bg-emerald-500/10 dark:bg-emerald-955/35 border border-emerald-400/80 dark:border-emerald-600/80 rounded-full w-28 justify-center shadow-3xs">
          <Layers size={11} className="shrink-0" /> Tesorera
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black text-indigo-700 dark:text-indigo-305 bg-indigo-500/10 dark:bg-indigo-950/30 border border-indigo-400 dark:border-indigo-650/80 rounded-full w-28 justify-center shadow-3xs">
        <UserCheck size={11} className="shrink-0" /> Integrante
      </span>
    );
  };

  const getAvatarGradient = (role: string) => {
    const norm = role?.toUpperCase();
    if (norm === 'LÍDER' || norm === 'LIDER') {
      return 'from-amber-400 via-orange-500 to-rose-500 border-amber-300 dark:border-amber-450';
    }
    if (norm === 'SUB_LIDER' || norm === 'SUBLÍDER' || norm === 'SUB LÍDER') {
      return 'from-fuchsia-500 via-purple-600 to-indigo-700 border-fuchsia-350 dark:border-fuchsia-450';
    }
    if (norm === 'SECRETARIO' || norm === 'SECRETARIA') {
      return 'from-cyan-400 via-blue-500 to-indigo-650 border-cyan-305 dark:border-cyan-450';
    }
    if (norm === 'TESORERA' || norm === 'TESORERO') {
      return 'from-emerald-400 via-teal-500 to-cyan-500 border-emerald-305 dark:border-emerald-450';
    }
    return 'from-indigo-400 to-purple-600 border-indigo-305 dark:border-indigo-450';
  };

  const getRoleHoverStyles = (role: string) => {
    const norm = role?.toUpperCase();
    if (norm === 'LÍDER' || norm === 'LIDER') {
      return 'group-hover:border-l-amber-500';
    }
    if (norm === 'SUB_LIDER' || norm === 'SUBLÍDER' || norm === 'SUB LÍDER') {
      return 'group-hover:border-l-fuchsia-500';
    }
    if (norm === 'SECRETARIO' || norm === 'SECRETARIA') {
      return 'group-hover:border-l-cyan-500';
    }
    if (norm === 'TESORERA' || norm === 'TESORERO') {
      return 'group-hover:border-l-emerald-500';
    }
    return 'group-hover:border-l-indigo-500';
  };

  const roleCardsOptions = [
    { 
      value: 'Integrante', 
      label: 'Integrante', 
      desc: 'Miembro regular del concilio', 
      icon: <UserCheck size={14} />,
      defaultClass: 'border-slate-200 dark:border-slate-808 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-305 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-indigo-50/20 dark:hover:bg-indigo-955/10',
      activeClass: 'border-indigo-500 dark:border-indigo-500 bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-indigo-500/15 dark:from-indigo-950/40 dark:to-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-150 dark:ring-indigo-900/40 shadow-md scale-[1.015]',
      iconClass: 'bg-slate-105 dark:bg-slate-850 text-slate-400 dark:text-slate-500',
      activeIconClass: 'bg-indigo-550 dark:bg-indigo-600 text-white animate-pulse'
    },
    { 
      value: 'Líder', 
      label: 'Líder', 
      desc: 'Director espiritual del GP', 
      icon: <Crown size={14} />,
      defaultClass: 'border-slate-200 dark:border-slate-808 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-305 hover:border-amber-300 dark:hover:border-amber-800 hover:bg-amber-50/20 dark:hover:bg-amber-955/10',
      activeClass: 'border-amber-500 dark:border-amber-500 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-rose-500/15 dark:from-amber-955/40 dark:to-rose-955/40 text-amber-900 dark:text-amber-300 ring-2 ring-amber-150 dark:ring-amber-900/40 shadow-md scale-[1.015]',
      iconClass: 'bg-slate-105 dark:bg-slate-850 text-slate-400 dark:text-slate-550',
      activeIconClass: 'bg-amber-550 dark:bg-amber-600 text-white animate-pulse'
    },
    { 
      value: 'Sub Líder', 
      label: 'Sub Líder', 
      desc: 'Asistente de directiva', 
      icon: <Star size={14} />,
      defaultClass: 'border-slate-200 dark:border-slate-808 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-305 hover:border-fuchsia-300 dark:hover:border-fuchsia-800 hover:bg-fuchsia-50/20 dark:hover:bg-fuchsia-955/10',
      activeClass: 'border-fuchsia-500 dark:border-fuchsia-500 bg-gradient-to-r from-fuchsia-500/15 via-purple-500/10 to-indigo-500/15 dark:from-fuchsia-950/40 dark:to-indigo-950/40 text-fuchsia-900 dark:text-fuchsia-300 ring-2 ring-fuchsia-150 dark:ring-fuchsia-900/40 shadow-md scale-[1.015]',
      iconClass: 'bg-slate-105 dark:bg-slate-850 text-slate-400 dark:text-slate-555',
      activeIconClass: 'bg-fuchsia-550 dark:bg-fuchsia-600 text-white animate-pulse'
    },
    { 
      value: 'Secretario', 
      label: 'Secretario', 
      desc: 'Encargado de actas', 
      icon: <FileText size={14} />,
      defaultClass: 'border-slate-200 dark:border-slate-808 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-305 hover:border-cyan-300 dark:hover:border-cyan-800 hover:bg-cyan-50/20 dark:hover:bg-cyan-955/10',
      activeClass: 'border-cyan-500 dark:border-cyan-500 bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-indigo-500/15 dark:from-cyan-950/40 dark:to-indigo-950/40 text-cyan-900 dark:text-cyan-300 ring-2 ring-cyan-150 dark:ring-cyan-900/40 shadow-md scale-[1.015]',
      iconClass: 'bg-slate-105 dark:bg-slate-850 text-slate-400 dark:text-slate-555',
      activeIconClass: 'bg-cyan-550 dark:bg-cyan-600 text-white animate-pulse'
    },
    { 
      value: 'Tesorera', 
      label: 'Tesorera', 
      desc: 'Control de finanzas', 
      icon: <Layers size={14} />,
      defaultClass: 'border-slate-200 dark:border-slate-808 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-305 hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-50/20 dark:hover:bg-emerald-955/10',
      activeClass: 'border-emerald-500 dark:border-emerald-500 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 dark:from-emerald-950/40 dark:to-cyan-950/40 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-150 dark:ring-emerald-900/40 shadow-md scale-[1.015]',
      iconClass: 'bg-slate-105 dark:bg-slate-850 text-slate-400 dark:text-slate-555',
      activeIconClass: 'bg-emerald-550 dark:bg-emerald-600 text-white animate-pulse'
    }
  ];

  const parseCreatedDate = (dateStr: string) => {
    if (!dateStr) return { day: '01', month: 'JUL' };
    const parts = dateStr.split(' de ');
    if (parts.length >= 2) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].substring(0, 3).toUpperCase();
      return { day, month };
    }
    return { day: '01', month: 'REG' };
  };

  if (loading) {
    return <Loader text="Cargando Información..." />;
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-100 animate-fadeIn bg-slate-50 dark:bg-[#090d1a] w-full px-2 sm:px-4 select-none pb-12 transition-colors duration-300">
      <style>{`
        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-flow {
          background-size: 200% 200%;
          animation: gradient-flow 6s ease infinite;
        }
        @keyframes float-logo {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(3deg) scale(1.02); }
        }
        .animate-float-logo {
          animation: float-logo 3.5s ease-in-out infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 15px rgba(129, 140, 248, 0.3); border-color: rgba(255,255,255,0.2); }
          50% { box-shadow: 0 0 30px rgba(129, 140, 248, 0.7), 0 0 15px rgba(236, 72, 153, 0.3); border-color: rgba(236, 72, 153, 0.5); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
      `}</style>
      
      {/* HEADER CARD */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-indigo-500/5 transition-all duration-300 relative z-20">
        <div className="flex items-center gap-3">
          <div className="bg-[#4f46e5] dark:bg-indigo-650 p-2.5 text-white rounded-2xl shadow-md shadow-indigo-500/10 transform transition duration-300 hover:rotate-3"><Users size={24} className="stroke-[2.5]" /></div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Secretaría</h1>
            <p className="text-xs text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider">Sistema de Gestión de Grupos Pequeños (GP)</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end relative">
          <button 
            onClick={openCreateModal} 
            className="p-2.5 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-emerald-255 dark:hover:border-emerald-500/30 transition-all duration-200 cursor-pointer hover:scale-105" 
            title="Crear Nuevo Grupo"
          >
            <Plus size={16} />
          </button>
          
          {groups.length > 0 && (
            <div className="relative inline-block text-left">
              <button 
                onClick={() => setGpDropdownOpen(!gpDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border-2 border-[#4f46e5] dark:border-indigo-550 rounded-xl text-xs font-black text-[#4f46e5] dark:text-indigo-400 focus:outline-none cursor-pointer uppercase tracking-wider transition-colors hover:bg-blue-50/40 dark:hover:bg-slate-800/30 shadow-xs"
              >
                <span>GP: {groups.find(g => g.id === activeGroupId)?.name.toUpperCase() || 'SELECCIONAR'}</span>
                <Sliders size={13} className={`transition-transform duration-200 ${gpDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {gpDropdownOpen && (
                <div className="absolute right-0 left-auto mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden z-30 animate-fadeIn shadow-lg origin-top-right">
                  <div className="bg-slate-50 dark:bg-slate-955 px-4 py-2 border-b border-slate-105 dark:border-slate-800 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cambiar de Grupo</div>
                  <div className="max-h-60 overflow-y-auto scrollbar-none">
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => {
                          setActiveGroupId(g.id);
                          setGpDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-black transition-colors flex items-center justify-between cursor-pointer ${
                          activeGroupId === g.id 
                            ? 'bg-blue-50 dark:bg-indigo-950/40 text-[#4f46e5] dark:text-indigo-400' 
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>GP {g.name.toUpperCase()}</span>
                        {activeGroupId === g.id && <CheckCircle2 size={13} className="text-[#4f46e5] dark:text-indigo-455" />}
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
        <div className="space-y-6 animate-fadeIn">
          
          {/* MEMBERS LIST */}
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-850 rounded-3xl overflow-hidden shadow-xs hover:shadow-indigo-500/5 transition-all duration-300">
            <div className="p-5 flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-indigo-950/40 text-[#4f46e5] dark:text-indigo-400 rounded-xl"><UserCheck size={18} /></div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">Lista de Integrantes</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">Feligresía registrada oficialmente en el grupo</p>
                </div>
              </div>
              <button 
                onClick={openLinkModal} 
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#4f46e5] dark:bg-indigo-600 hover:bg-blue-750 dark:hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all duration-350 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-sm shadow-indigo-500/15"
              >
                <UserPlus size={13} /> Agregar Integrante
              </button>
            </div>

            <div className="overflow-x-auto overflow-y-hidden border-transparent select-text scrollbar-none [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900 dark:bg-slate-955 text-white font-black uppercase tracking-wider text-[10px] h-12">
                    <th className="p-4 text-center w-14 border-b border-slate-800 dark:border-slate-900">#</th>
                    <th className="p-4 text-sm border-b border-slate-800 dark:border-slate-900">Nombre Completo</th>
                    <th className="p-4 text-sm border-b border-slate-800 dark:border-slate-900">Fecha de Nacimiento</th>
                    <th className="p-4 text-center text-sm border-b border-slate-800 dark:border-slate-900">Seguro de Vida</th>
                    <th className="p-4 text-center text-sm border-b border-slate-800 dark:border-slate-900">Responsabilidad</th>
                    <th className="p-4 text-center w-28 text-sm border-b border-slate-800 dark:border-slate-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-105 dark:divide-slate-800 text-slate-705 dark:text-slate-305 bg-white dark:bg-slate-900/20 font-bold">
                  {members.map((m, i) => (
                    <tr key={m.id} className="hover:bg-indigo-50/20 dark:hover:bg-slate-800/10 transform hover:scale-[1.002] transition-all duration-150 group border-b border-slate-100 dark:border-slate-850 last:border-b-0">
                      <td className={`p-4 text-center text-slate-405 dark:text-slate-500 font-mono font-black text-sm border-l-4 border-l-transparent transition-all ${getRoleHoverStyles(m.roleInGP)}`}>
                        {i + 1}
                      </td>
                      <td className="p-4 font-black text-slate-900 dark:text-white text-base">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs uppercase shrink-0 border-2 transition-all duration-300 group-hover:scale-110 shadow-xs bg-gradient-to-tr ${getAvatarGradient(m.roleInGP)}`}>
                            {m.name.charAt(0)}
                          </div>
                          <span className="capitalize tracking-tight text-sm font-black">{m.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-550 dark:text-slate-450 font-bold">
                        <span className="inline-flex items-center gap-2 bg-indigo-50/20 dark:bg-indigo-950/15 px-3 py-1 rounded-full border border-indigo-100/50 dark:border-indigo-900/40 text-xs font-semibold text-slate-700 dark:text-slate-305">
                          <Calendar size={12} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
                          {m.birthDate || 'No registrada'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-[10px] tracking-wide uppercase border shadow-3xs ${
                          m.hasLifeInsurance 
                            ? 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-650 dark:text-rose-450 border-rose-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${m.hasLifeInsurance ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {m.hasLifeInsurance ? 'Vigente' : 'Falta'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">{drawRoleBadge(m.roleInGP)}</div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2.5">
                          <button 
                            onClick={() => openEditMemberModal(m)} 
                            className="p-2.5 text-indigo-650 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-955/20 hover:bg-[#4f46e5] dark:hover:bg-indigo-650 hover:text-white dark:hover:text-white border border-indigo-100/30 dark:border-indigo-900/30 rounded-xl transition-all duration-300 hover:scale-110 active:scale-90 shadow-3xs cursor-pointer"
                          >
                            <Pencil size={13} />
                          </button>
                          <button 
                            onClick={() => initiateRemoveMember(m.id, m.name)} 
                            className="p-2.5 text-rose-655 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-955/20 hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white dark:hover:text-white border border-rose-100/30 dark:border-rose-900/30 rounded-xl transition-all duration-300 hover:scale-110 active:scale-90 shadow-3xs cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GP IDENTITY CARD */}
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-855 rounded-3xl overflow-hidden shadow-xs hover:shadow-indigo-500/5 transition-all duration-300">
            <div className="p-5 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-indigo-950/40 text-[#4f46e5] dark:text-indigo-400 rounded-xl"><Info size={18} /></div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">Ficha de Identidad del GP</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">Datos heráldicos, ideales colectivos y versículo de fe</p>
                </div>
              </div>
              <button 
                onClick={openEditModal} 
                className="p-2.5 text-blue-650 dark:text-blue-405 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-blue-105 dark:border-blue-900/40 rounded-xl transition duration-200 hover:-translate-y-0.5 cursor-pointer shadow-3xs hover:shadow-xs" 
                title="Editar Ficha"
              >
                <Edit3 size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-105 dark:divide-slate-800 bg-white dark:bg-slate-900/10">
              
              {/* COL 1: ESTANDARTE */}
              <div className="p-6 space-y-4 bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-955/30 dark:to-slate-900/50 hover:bg-indigo-50/5 transition duration-300">
                <div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase block tracking-widest">Nombre Oficial del Concilio</span>
                  <span className="text-xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent uppercase tracking-tight block mt-1">GP {identity.name}</span>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-655 dark:text-slate-350 flex items-center gap-1.5 uppercase tracking-wider"><Flag size={13} className="text-[#4f46e5] dark:text-indigo-400" /> Estandarte Heráldico</span>
                  <div className="w-full h-40 bg-gradient-to-br from-indigo-600 via-purple-650 to-pink-600 dark:from-[#0d0e1a] dark:via-[#1e1b4b] dark:to-[#3b0764] rounded-2xl flex flex-col items-center justify-center text-white relative border border-white/10 dark:border-slate-800 overflow-hidden shadow-lg group hover:shadow-indigo-500/35 transition-all duration-500 animate-gradient-flow">
                    {/* Background hover overlay */}
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Logo without border ring, larger size and sharp shadow */}
                    <div className="w-24 h-24 mb-1.5 relative transform group-hover:scale-110 group-hover:rotate-[360deg] transition-all duration-1000 ease-out flex items-center justify-center">
                      <img 
                        src={logoImage} 
                        alt="Logo" 
                        className="w-22 h-22 object-contain filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.25)] animate-float-logo" 
                      />
                    </div>
                    <span className="text-[9px] font-black tracking-widest text-indigo-200">ESTANDARTE</span>
                    <span className="text-base font-black tracking-tight text-white mt-0.5">GP {identity.name.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* COL 2: LEMA E HIMNO */}
              <div className="p-6 space-y-4 bg-gradient-to-br from-blue-50/20 to-white dark:from-indigo-955/10 dark:to-slate-900/50 hover:bg-indigo-50/5 transition duration-300">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Lema Institucional</span>
                  <div className="relative p-3.5 pl-5 bg-slate-55 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-3xs overflow-hidden group hover:border-indigo-500/30 transition duration-300 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-amber-400 before:to-pink-500">
                    <div className="absolute top-1 left-2 text-indigo-250 dark:text-indigo-900/40 text-4xl font-serif leading-none select-none">“</div>
                    <p className="pl-5 text-sm font-extrabold text-slate-800 dark:text-slate-200 italic leading-relaxed relative z-10">
                      {identity.motto || 'Sin lema asignado.'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-655 dark:text-slate-355 flex items-center gap-1.5 uppercase tracking-wider"><Music size={13} className="text-[#4f46e5] dark:text-indigo-400" /> Himno Corporativo Registrado</span>
                  <div className="p-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-indigo-955/15 dark:to-slate-900/50 rounded-2xl border border-blue-100/80 dark:border-indigo-900/30 flex items-center justify-between gap-3 shadow-3xs hover:border-indigo-500/20 transition duration-300">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl text-[#4f46e5] dark:text-indigo-400 border border-blue-200/50 dark:border-indigo-850 shadow-xs shrink-0">
                        <Music size={16} className="animate-pulse" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-blue-905 dark:text-indigo-200 truncate uppercase tracking-tight">{identity.anthemUrl || 'Sin Himno Registrado'}</h4>
                        <p className="text-[9px] text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">Archivo Oficial Conectado</p>
                      </div>
                    </div>
                    
                    {/* Multicolor Voice Waves */}
                    <div className="flex items-center gap-0.5 h-4 px-2 shrink-0">
                      <span className="w-0.5 h-2 bg-pink-500 dark:bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-0.5 h-3 bg-purple-550 dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                      <span className="w-0.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
                      <span className="w-0.5 h-3.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="w-0.5 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* COL 3: VERSICULO Y FUNDACION */}
              <div className="p-6 space-y-4 bg-gradient-to-br from-indigo-50/20 to-white dark:from-slate-955/20 dark:to-slate-900/50 hover:bg-indigo-50/5 transition duration-300">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Versículo Llavero</span>
                  <div className="relative p-4 pl-6 bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100/75 dark:border-indigo-900/40 rounded-2xl shadow-3xs hover:border-indigo-500/40 transition duration-300 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:bg-gradient-to-b before:from-indigo-500 before:to-blue-500">
                    <p className="text-[13px] font-black text-slate-900 dark:text-white leading-relaxed italic">
                      "{identity.verse}"
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Fecha de Fundación</span>
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {/* Binder Rings for Calendar leaf */}
                      <div className="absolute -top-1 left-2.5 w-1 h-2.5 bg-slate-300 dark:bg-slate-700 rounded-full z-10" />
                      <div className="absolute -top-1 right-2.5 w-1 h-2.5 bg-slate-300 dark:bg-slate-700 rounded-full z-10" />
                      
                      <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 overflow-hidden flex flex-col items-center justify-center shadow-3xs pt-1">
                        <div className="w-full bg-rose-600 dark:bg-rose-500 text-[8px] font-black text-white text-center py-0.5 uppercase tracking-wide">
                          {parseCreatedDate(identity.createdAtDate).month}
                        </div>
                        <div className="text-slate-855 dark:text-rose-400 text-xs font-black leading-none py-1">
                          {parseCreatedDate(identity.createdAtDate).day}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 dark:text-white block capitalize">{identity.createdAtDate || '01 de Julio de 2026'}</span>
                      <span className="text-[9px] text-slate-405 dark:text-slate-550 font-bold uppercase tracking-wider">Registro Oficial</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center text-sm font-black text-slate-400 dark:text-slate-555 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-3xl uppercase tracking-wider italic shadow-xs">Crea tu primer grupo pequeño desde el botón superior de configuración.</div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-slate-950/50 dark:bg-slate-950/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 text-center space-y-4 shadow-2xl shadow-indigo-955/20 dark:shadow-slate-950/50 transition-all duration-300">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 flex items-center justify-center shrink-0 shadow-xs">
              <Trash2 size={22} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">¿Confirmar desvinculación?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed px-1">
                ¿Estás seguro que deseas remover a <span className="text-slate-900 dark:text-white font-black font-mono">"{deleteConfirm.memberName}"</span> de las actas de este GP?
              </p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button 
                type="button" 
                disabled={refreshing} 
                onClick={() => setDeleteConfirm({ isOpen: false, memberId: null, memberName: '' })} 
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-355 rounded-xl font-black uppercase text-[10px] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 active:scale-95"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                disabled={refreshing} 
                onClick={executeRemoveMember} 
                className="flex-1 py-2 bg-[#4f46e5] dark:bg-indigo-650 hover:bg-blue-700 dark:hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-[10px] rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-500/10 hover:shadow-indigo-550/20"
              >
                {refreshing ? <RefreshCw size={11} className="animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MEMBER ROLE MODAL */}
      {isEditMemberModalOpen && editingMember && (
        <div className="fixed inset-0 bg-slate-955/50 dark:bg-slate-955/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 space-y-5 shadow-2xl shadow-indigo-955/20 dark:shadow-slate-950/50 transition-all duration-300">
            <div className="flex justify-between items-center border-b border-slate-105 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-[#4f46e5] dark:text-indigo-400 shrink-0" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Editar Cargo</h3>
              </div>
              <button type="button" onClick={() => setIsEditMemberModalOpen(false)} className="text-slate-400 dark:text-slate-505 hover:bg-slate-105 dark:hover:bg-slate-805 p-1 rounded-lg transition cursor-pointer"><X size={16} /></button>
            </div>
            
            <form onSubmit={handleEditMemberSubmit} className="space-y-4 text-xs font-bold text-slate-655 dark:text-slate-400">
              <div className="space-y-1 bg-blue-50/50 dark:bg-indigo-950/20 p-3 rounded-xl border border-blue-100 dark:border-indigo-900/30 shadow-3xs">
                <span className="text-[9px] font-black text-[#4f46e5] dark:text-indigo-400 uppercase tracking-widest block">Integrante Seleccionado</span>
                <span className="text-sm font-black text-slate-900 dark:text-white block mt-0.5 capitalize">{editingMember.name}</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block mb-1">Selecciona el Cargo</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {roleCardsOptions.map((roleOpt) => {
                    const isSelected = editMemberRole === roleOpt.value;
                    return (
                      <button
                        key={roleOpt.value}
                        type="button"
                        onClick={() => setEditMemberRole(roleOpt.value)}
                        className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between cursor-pointer transform hover:scale-[1.015] active:scale-[0.985] hover:shadow-xs ${
                          isSelected ? roleOpt.activeClass : roleOpt.defaultClass
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${isSelected ? roleOpt.activeIconClass : roleOpt.iconClass}`}>
                            {roleOpt.icon}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black block uppercase tracking-wide truncate">{roleOpt.label}</span>
                            <span className={`text-[10px] block font-medium truncate mt-0.5 ${isSelected ? 'opacity-90 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>{roleOpt.desc}</span>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={15} className="shrink-0 text-current ml-2 animate-fadeIn" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-105 dark:border-slate-800">
                <button type="button" onClick={() => setIsEditMemberModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-350 rounded-xl font-black uppercase text-[10px] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition duration-200 active:scale-95">Cancelar</button>
                <button type="submit" disabled={refreshing} className="px-4 py-2 bg-[#4f46e5] dark:bg-indigo-650 hover:bg-indigo-700 dark:hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-[10px] cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-500/10 hover:shadow-indigo-550/20">
                  {refreshing ? <RefreshCw size={11} className="animate-spin" /> : 'Sincronizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE OR EDIT GROUP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-955/50 dark:bg-slate-950/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 space-y-5 shadow-2xl shadow-indigo-955/20 dark:shadow-slate-950/50 transition-all duration-300">
            <div className="flex justify-between items-center border-b border-slate-105 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-[#4f46e5] dark:text-indigo-400 shrink-0" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{modalMode === 'CREATE' ? 'Nuevo Grupo' : `Modificar Grupo`}</h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 dark:text-slate-550 hover:bg-slate-105 dark:hover:bg-slate-800 p-1 rounded-lg transition cursor-pointer"><X size={16} /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-bold text-slate-655 dark:text-slate-400">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">Nombre del Grupo *</label>
                  <input type="text" required placeholder="Ej: Siloé" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 bg-slate-55 dark:bg-slate-955 border-2 border-slate-200 dark:border-slate-808 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#4f46e5] dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">Lema o Slogan</label>
                  <input type="text" placeholder="Ej: Firmes en la fe" value={formData.motto} onChange={(e) => setFormData({...formData, motto: e.target.value})} className="w-full p-2.5 bg-slate-55 dark:bg-slate-955 border-2 border-slate-200 dark:border-slate-808 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#4f46e5] dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">Título del Himno Oficial</label>
                <input type="text" placeholder="Ej: Cuán Grande es Él" value={formData.anthemUrl} onChange={(e) => setFormData({...formData, anthemUrl: e.target.value})} className="w-full p-2.5 bg-slate-55 dark:bg-slate-955 border-2 border-slate-200 dark:border-slate-808 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#4f46e5] dark:focus:border-indigo-550 focus:bg-white dark:focus:bg-slate-950 transition" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Versículo Bíblico Corporativo</label>
                <textarea placeholder="Texto bíblico..." rows={3} value={formData.bibleVerse} onChange={(e) => setFormData({...formData, bibleVerse: e.target.value})} className="w-full p-2.5 bg-slate-55 dark:bg-slate-955 border-2 border-slate-200 dark:border-slate-808 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#4f46e5] dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 resize-none transition" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Descripción</label>
                <input type="text" placeholder="Breve reseña..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-2.5 bg-slate-55 dark:bg-slate-955 border-2 border-slate-205 dark:border-slate-808 rounded-xl text-xs font-bold text-slate-805 dark:text-white focus:outline-none focus:border-[#4f46e5] dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-105 dark:border-slate-808">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-355 rounded-xl font-black uppercase text-[10px] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition duration-200 active:scale-95">Cancelar</button>
                <button type="submit" disabled={refreshing} className="px-4 py-2 bg-[#4f46e5] dark:bg-indigo-650 hover:bg-blue-700 dark:hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-[10px] cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-500/10 hover:shadow-indigo-500/20">
                  {refreshing && <RefreshCw size={11} className="animate-spin shrink-0" />} Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINK AVAILABLE MEMBER MODAL */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-slate-955/50 dark:bg-slate-950/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl p-6 rounded-3xl border border-slate-200/85 dark:border-slate-800/80 space-y-4 shadow-2xl shadow-indigo-955/20 dark:shadow-slate-950/50 transition-all duration-300">
            <div className="flex justify-between items-center border-b border-slate-105 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-[#4f46e5] dark:text-indigo-400 shrink-0" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Vincular Integrante</h3>
              </div>
              <button type="button" onClick={() => setIsLinkModalOpen(false)} className="text-slate-400 dark:text-slate-550 hover:bg-slate-105 dark:hover:bg-slate-800 p-1 rounded-lg transition cursor-pointer"><X size={16} /></button>
            </div>
            
            <form onSubmit={handleLinkSubmit} className="space-y-4 text-xs font-bold text-slate-655 dark:text-slate-400">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Seleccionar Feligrés Disponible</label>
                
                {availableUsers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 border border-slate-100 dark:border-slate-855 p-2 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 scrollbar-none">
                    {availableUsers.map((user) => {
                      const isUserSelected = linkData.userId === String(user.id);
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => setLinkData({ ...linkData, userId: String(user.id) })}
                          className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all duration-150 transform hover:scale-[1.01] cursor-pointer ${
                            isUserSelected 
                              ? 'border-[#4f46e5] dark:border-indigo-500 bg-blue-50 dark:bg-indigo-950/45 text-[#4f46e5] dark:text-indigo-300 ring-2 ring-indigo-500/25 font-black shadow-xs' 
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${isUserSelected ? 'bg-[#4f46e5] dark:bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-550'}`}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <span className="text-xs font-bold block truncate">{user.name}</span>
                              <span className={`text-[9px] block font-mono ${isUserSelected ? 'text-blue-500 dark:text-indigo-400 font-bold' : 'text-slate-400 dark:text-slate-550'}`}>{user.email}</span>
                            </div>
                          </div>
                          {isUserSelected && <CheckCircle2 size={14} className="shrink-0 text-current ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-550 py-4 text-center border-2 border-dashed border-slate-205 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-955/15">No existen feligreses sin vinculación en la central.</p>
                )}
                <button 
                  type="button" 
                  onClick={switchToCreateMemberModal} 
                  className="text-[9px] font-black text-blue-600 dark:text-indigo-400 hover:underline mt-1 block cursor-pointer uppercase tracking-widest"
                >
                  ¿No encuentras al usuario? Regístralo aquí
                </button>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-widest block">Cargo Asignado en Grupo</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {roleCardsOptions.map((roleOpt) => {
                    const isSelected = linkData.groupRole === roleOpt.value;
                    return (
                      <button
                        key={`link-${roleOpt.value}`}
                        type="button"
                        onClick={() => setLinkData({ ...linkData, groupRole: roleOpt.value })}
                        className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between cursor-pointer transform hover:scale-[1.015] active:scale-[0.985] hover:shadow-xs ${
                          isSelected ? roleOpt.activeClass : roleOpt.defaultClass
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${isSelected ? roleOpt.activeIconClass : roleOpt.iconClass}`}>
                            {roleOpt.icon}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black block uppercase tracking-wide truncate">{roleOpt.label}</span>
                            <span className={`text-[10px] block font-medium truncate mt-0.5 ${isSelected ? 'opacity-90 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>{roleOpt.desc}</span>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={15} className="shrink-0 text-current ml-2 animate-fadeIn" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-805">
                <button type="button" onClick={() => setIsLinkModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-850 text-slate-550 dark:text-slate-350 rounded-xl font-black uppercase text-[10px] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-750 transition duration-200 active:scale-95">Cancelar</button>
                <button type="submit" disabled={availableUsers.length === 0 || refreshing} className="px-4 py-2 bg-[#4f46e5] dark:bg-indigo-650 hover:bg-blue-750 dark:hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-[10px] cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5 shadow-xs">
                  {refreshing && <RefreshCw size={11} className="animate-spin shrink-0" />} Asignar e Integrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW MEMBER MODAL */}
      {isCreateMemberModalOpen && (
        <div className="fixed inset-0 bg-slate-955/50 dark:bg-slate-955/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl p-6 rounded-3xl border border-slate-205 dark:border-slate-808 space-y-4 shadow-2xl shadow-indigo-955/20 dark:shadow-slate-955/50 transition-all duration-300">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <UserPlus size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Registrar Miembro</h3>
              </div>
              <button type="button" onClick={() => setIsCreateMemberModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:bg-slate-105 dark:hover:bg-slate-800 p-1 rounded-lg transition cursor-pointer"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateAndLinkSubmit} className="space-y-4 text-xs font-bold text-slate-655 dark:text-slate-400">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-widest block">Nombre Completo *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-505"><UserIcon size={13} /></span>
                  <input type="text" required placeholder="Ej: Gabriel Espinoza" value={newMemberForm.name} onChange={(e) => setNewMemberForm({...newMemberForm, name: e.target.value})} className="w-full pl-8 p-2.5 bg-slate-50 dark:bg-slate-955 border-2 border-slate-200 dark:border-slate-808 rounded-xl text-xs font-bold text-slate-808 dark:text-white focus:outline-none focus:border-[#4f46e5] dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition" />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-widest block">Correo Electrónico *</label>
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-550"><Mail size={13} /></span>
                    <input type="text" required placeholder="ejemplo" value={newMemberForm.email} onChange={(e) => setNewMemberForm({...newMemberForm, email: e.target.value})} className="w-full pl-8 p-2.5 bg-slate-50 dark:bg-slate-955 border-2 border-slate-200 dark:border-slate-808 rounded-xl text-xs font-bold text-slate-808 dark:text-white focus:outline-none focus:border-[#4f46e5] dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-955 transition" />
                  </div>
                  {!newMemberForm.email.includes('@') && newMemberForm.email.trim().length > 0 && (
                    <button 
                      type="button" 
                      onClick={appendGmailSuffix}
                      className="px-2.5 bg-blue-50 dark:bg-indigo-950/40 border border-blue-200 dark:border-indigo-900/60 text-[#4f46e5] dark:text-indigo-400 rounded-xl font-black text-[10px] transition-colors hover:bg-blue-100 dark:hover:bg-indigo-900/40 cursor-pointer"
                    >
                      + @gmail.com
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Fecha de Nacimiento</label>
                  <input type="date" value={newMemberForm.birthDate} onChange={(e) => setNewMemberForm({...newMemberForm, birthDate: e.target.value})} className="w-full p-2.5 bg-slate-55 dark:bg-slate-955 border-2 border-slate-200 dark:border-slate-808 rounded-xl text-xs font-bold text-slate-808 dark:text-white focus:outline-none focus:border-[#4f46e5] dark:focus:border-indigo-500 bg-white dark:bg-slate-955 transition" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Cargo Asignado</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {roleCardsOptions.map((roleOpt) => {
                      const isSelected = newMemberForm.groupRole === roleOpt.value;
                      return (
                        <button
                          key={`create-${roleOpt.value}`}
                          type="button"
                          onClick={() => setNewMemberForm({ ...newMemberForm, groupRole: roleOpt.value })}
                          className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between cursor-pointer transform hover:scale-[1.015] active:scale-[0.985] hover:shadow-xs ${
                            isSelected ? roleOpt.activeClass : roleOpt.defaultClass
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${isSelected ? roleOpt.activeIconClass : roleOpt.iconClass}`}>
                              {roleOpt.icon}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-black block uppercase tracking-wide truncate">{roleOpt.label}</span>
                              <span className={`text-[10px] block font-medium truncate mt-0.5 ${isSelected ? 'opacity-90 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>{roleOpt.desc}</span>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 size={15} className="shrink-0 text-current ml-2 animate-fadeIn" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-105 dark:border-slate-808">
                <button type="button" onClick={() => setIsCreateMemberModalOpen(false)} className="px-4 py-2 bg-slate-105 dark:bg-slate-800 text-slate-600 dark:text-slate-355 rounded-xl font-black uppercase text-[10px] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition duration-200 active:scale-95">Volver</button>
                <button type="submit" disabled={refreshing} className="px-4 py-2 bg-[#4f46e5] dark:bg-indigo-650 hover:bg-blue-700 dark:hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-[10px] cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5 shadow-xs">
                  {refreshing && <RefreshCw size={11} className="animate-spin shrink-0" />} Registrar e Integrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SYSTEM ALERTS */}
      {alertConfig.isOpen && (
        <div className="fixed inset-0 bg-slate-955/50 dark:bg-slate-955/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xs p-5 rounded-3xl border border-slate-200 dark:border-slate-808 text-center space-y-4 shadow-2xl shadow-black/20">
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center bg-blue-50 dark:bg-indigo-955/20 text-[#4f46e5] dark:text-indigo-400 border border-blue-105 dark:border-indigo-900/30 shadow-xs`}>
              {alertConfig.type === 'success' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">{alertConfig.title}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">{alertConfig.message}</p>
            </div>
            <button 
              onClick={() => setAlertConfig({ ...alertConfig, isOpen: false })} 
              className="w-full py-2.5 text-white font-black text-[10px] rounded-xl uppercase tracking-wider cursor-pointer bg-[#4f46e5] hover:bg-blue-750 dark:bg-indigo-650 dark:hover:bg-indigo-755 transition-colors shadow-sm shadow-indigo-500/10"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
};