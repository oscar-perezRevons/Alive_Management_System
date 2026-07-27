import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import api, { adminUserExtensions, groupsService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { User as UserType } from '../types';
import {
  ShieldCheck, Users, RefreshCw, Search, Crown, UserCircle2,
  Power, PowerOff, Key, Eye, EyeOff, UserPlus,
  ChevronDown, ChevronRight, X, Check, AlertTriangle,
  BookOpen, Wallet, UsersRound, UserMinus, Star, CheckCircle2
} from 'lucide-react';
import { Loader } from '../components/Loader';

/* ─── ROLE CONFIG ─────────────────────────────────── */
export interface RoleOption {
  key: string;
  label: string;
  gradient: string;
  badge: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const GROUP_ROLES: RoleOption[] = [
  { key: 'LÍDER',       label: 'Líder',      gradient: 'from-amber-500 to-orange-500', badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: Crown },
  { key: 'CO-LÍDER',    label: 'Co-líder',   gradient: 'from-fuchsia-500 to-pink-600', badge: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200', icon: Star },
  { key: 'SECRETARIO',  label: 'Secretario', gradient: 'from-cyan-500 to-blue-600',   badge: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: BookOpen },
  { key: 'TESORERO',    label: 'Tesorero',   gradient: 'from-emerald-500 to-teal-600',badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Wallet },
  { key: 'INTEGRANTE',  label: 'Integrante', gradient: 'from-indigo-500 to-blue-600', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: UserCircle2 },
];

const getGroupRoleConfig = (role?: string): RoleOption => {
  const norm = (role || '').toUpperCase().trim();
  if (norm === 'LÍDER' || norm === 'LIDER') {
    return GROUP_ROLES[0];
  }
  if (norm === 'CO-LÍDER' || norm === 'CO-LIDER' || norm === 'COLÍDER' || norm === 'COLIDER' || norm === 'SUB LÍDER' || norm === 'SUBLÍDER' || norm === 'SUB_LIDER') {
    return GROUP_ROLES[1];
  }
  if (norm === 'SECRETARIO' || norm === 'SECRETARIA') {
    return GROUP_ROLES[2];
  }
  if (norm === 'TESORERO' || norm === 'TESORERA') {
    return GROUP_ROLES[3];
  }
  return GROUP_ROLES[4];
};

const SYSTEM_ROLES = [
  { key: 'ADMIN', label: 'Administrador', badge: 'bg-violet-50 text-violet-700 border-violet-200', icon: ShieldCheck },
  { key: 'USER',  label: 'Usuario',       badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: UserCircle2 }
];

const normalizeText = (value?: string) =>
  (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-_\s]+/g, '').trim().toUpperCase();

const isLider = (role?: string) => {
  const norm = normalizeText(role);
  return norm === 'LIDER';
};

const isCoLider = (role?: string) => {
  const norm = normalizeText(role);
  return norm === 'COLIDER' || norm === 'SUBLIDER';
};

const isSecretario = (role?: string) => {
  const norm = normalizeText(role);
  return norm === 'SECRETARIO' || norm === 'SECRETARIA';
};

const isTesorero = (role?: string) => {
  const norm = normalizeText(role);
  return norm === 'TESORERO' || norm === 'TESORERA';
};

/* ─── ANIMATIONS (injected as style tag) ──────────── */
const ANIMATIONS = `
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
@keyframes scaleIn { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
@keyframes slideDown { from { opacity:0; max-height:0; } to { opacity:1; max-height:800px; } }
@keyframes spin-border {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.anim-up { animation: fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
.anim-scale { animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both; }
.anim-slide { animation: slideDown 0.35s ease both; }
.animated-modal-border {
  position: relative;
  padding: 3.5px;
  border-radius: 1.75rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 25px 60px -10px rgba(139, 92, 246, 0.45);
}
.animated-modal-border::before {
  content: '';
  position: absolute;
  width: 220%;
  height: 220%;
  background: conic-gradient(
    from 0deg,
    #8b5cf6,
    #d946ef,
    #ec4899,
    #3b82f6,
    #10b981,
    #f59e0b,
    #8b5cf6
  );
  animation: spin-border 5s linear infinite;
  z-index: 0;
}
.animated-modal-content {
  position: relative;
  z-index: 1;
  width: 100%;
  background: #ffffff;
  border-radius: calc(1.75rem - 3.5px);
  overflow: hidden;
}
@keyframes gradientBorderShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.animated-group-border {
  border: 2.5px solid transparent;
  border-radius: 1.25rem;
  background: linear-gradient(#ffffff, #ffffff) padding-box,
              linear-gradient(90deg, #8b5cf6, #d946ef, #ec4899, #3b82f6, #10b981, #f59e0b, #ec4899, #8b5cf6) border-box;
  background-size: 200% 100%;
  animation: gradientBorderShift 5s ease infinite;
  box-shadow: 0 8px 25px -5px rgba(139, 92, 246, 0.2);
}
.dark .animated-group-border {
  background: linear-gradient(#0f172a, #0f172a) padding-box,
              linear-gradient(90deg, #8b5cf6, #d946ef, #ec4899, #3b82f6, #10b981, #f59e0b, #ec4899, #8b5cf6) border-box;
  background-size: 200% 100%;
}
`;

/* ─── AVATAR COLORS ───────────────────────────────── */
const AVATAR_GRADIENTS = [
  'from-violet-500 to-fuchsia-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-purple-500 to-violet-600',
];
const getAvatarGradient = (id: number) => AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length];

/* ─── CUSTOM DROPDOWN COMPONENT ────────────────────── */
interface CustomDropdownProps {
  value: string;
  options: { key: string; label: string; icon: any; badge?: string }[];
  onChange: (key: string) => void;
  disabled?: boolean;
  type?: 'groupRole' | 'systemRole';
  onOpenChange?: (open: boolean) => void;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ value, options, onChange, disabled, type = 'groupRole', onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; minWidth: number }>({ top: 0, left: 0, minWidth: 175 });

  const selectedOption = options.find(o => normalizeText(o.key) === normalizeText(value)) || options[options.length - 1];
  const SelectedIcon = selectedOption.icon;

  const handleToggle = useCallback((openState: boolean) => {
    if (openState && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = Math.max(rect.width, 175);
      let left = rect.left + window.scrollX;
      if (left + popoverWidth > window.innerWidth - 16) {
        left = Math.max(16, window.innerWidth - popoverWidth - 16);
      }
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left,
        minWidth: popoverWidth
      });
    }
    setIsOpen(openState);
    if (onOpenChange) onOpenChange(openState);
  }, [onOpenChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        handleToggle(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleToggle]);

  const widthClass = type === 'systemRole' ? 'w-full min-w-0 sm:w-auto sm:min-w-[170px]' : 'w-full min-w-0 sm:w-auto sm:min-w-[155px]';

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${widthClass}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => handleToggle(!isOpen)}
        className={`w-full flex items-center justify-between gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-2xl border-2 font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md ${
          selectedOption.badge || 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <SelectedIcon size={13} className="shrink-0" />
          <span className="truncate">{selectedOption.label}</span>
        </div>
        <ChevronDown size={13} className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            minWidth: `${coords.minWidth}px`,
            zIndex: 99999999
          }}
          className="w-max max-w-[240px] rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-2xl p-1.5 space-y-1 anim-scale ring-4 ring-slate-900/10 dark:ring-black/40 opacity-100"
        >
          {options.map((opt) => {
            const isSelected = normalizeText(opt.key) === normalizeText(value);
            const OptIcon = opt.icon;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  onChange(opt.key);
                  handleToggle(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 whitespace-nowrap">
                  <OptIcon size={14} className={isSelected ? 'text-white' : 'text-slate-400 dark:text-slate-500'} />
                  <span className="whitespace-nowrap">{opt.label}</span>
                </div>
                {isSelected && <Check size={14} className="shrink-0 text-white ml-2" />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
};

/* ─── MAIN USERS PAGE ─────────────────────────────── */
export const UsersPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<UserType[]>([]);
  const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'IN_GROUP' | 'NO_GROUP'>('IN_GROUP');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  /* Expanded groups tracking */
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  /* Stat filter tracking */
  type StatFilter = 'ALL' | 'ADMIN' | 'LIDER' | 'COLIDER' | 'SECRETARIO' | 'TESORERO' | 'IN_GROUP' | 'NO_GROUP';
  const [statFilter, setStatFilter] = useState<StatFilter>('ALL');

  /* Password modal */
  const [passwordModal, setPasswordModal] = useState<{ open: boolean; user: UserType | null }>({ open: false, user: null });
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  /* Assign group modal */
  const [assignModal, setAssignModal] = useState<{ open: boolean; user: UserType | null }>({ open: false, user: null });
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);

  /* ─── DATA LOADING ──────────────────────────────── */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [usersRes, groupsRes] = await Promise.all([
        adminUserExtensions.getAll(),
        groupsService.getAll()
      ]);
      setUsers(usersRes.data?.users || []);
      const grps = groupsRes.data || [];
      setGroups(Array.isArray(grps) ? grps.map((g: any) => ({ id: g.id, name: g.name })) : []);
      // Auto-expand all groups on first load
      const groupIds = new Set<number>((usersRes.data?.users || [])
        .filter((u: UserType) => u.groupSmallId)
        .map((u: UserType) => u.groupSmallId as number));
      setExpandedGroups(groupIds);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'No se pudo cargar el listado de usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* Auto-clear messages */
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 4000); return () => clearTimeout(t); }
  }, [success]);
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(''), 6000); return () => clearTimeout(t); }
  }, [error]);

  /* ─── COMPUTED DATA ─────────────────────────────── */
  const q = search.trim().toLowerCase();

  const matchesFilter = useCallback((u: UserType) => {
    const searchMatch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    if (!searchMatch) return false;

    if (statFilter === 'ALL') return true;
    if (statFilter === 'ADMIN') return normalizeText(u.role) === 'ADMIN';

    if (statFilter === 'LIDER') return isLider(u.groupRole);
    if (statFilter === 'COLIDER') return isCoLider(u.groupRole);
    if (statFilter === 'SECRETARIO') return isSecretario(u.groupRole);
    if (statFilter === 'TESORERO') return isTesorero(u.groupRole);
    if (statFilter === 'IN_GROUP') return !!u.groupSmallId;
    if (statFilter === 'NO_GROUP') return !u.groupSmallId;

    return true;
  }, [q, statFilter]);

  const usersInGroups = useMemo(() => {
    const grouped = new Map<number, { groupName: string; members: UserType[] }>();
    users.filter(u => u.groupSmallId && matchesFilter(u)).forEach(u => {
      const gid = u.groupSmallId!;
      if (!grouped.has(gid)) {
        grouped.set(gid, { groupName: u.groupSmall?.name || `Grupo ${gid}`, members: [] });
      }
      grouped.get(gid)!.members.push(u);
    });
    return Array.from(grouped.entries()).sort((a, b) => a[1].groupName.localeCompare(b[1].groupName));
  }, [users, matchesFilter]);

  const usersNoGroup = useMemo(() =>
    users.filter(u => !u.groupSmallId && matchesFilter(u)),
  [users, matchesFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => normalizeText(u.role) === 'ADMIN').length,
    lideres: users.filter(u => isLider(u.groupRole)).length,
    colideres: users.filter(u => isCoLider(u.groupRole)).length,
    secretarios: users.filter(u => isSecretario(u.groupRole)).length,
    tesoreros: users.filter(u => isTesorero(u.groupRole)).length,
    enGrupo: users.filter(u => !!u.groupSmallId).length,
    sinGrupo: users.filter(u => !u.groupSmallId).length,
  }), [users]);

  /* ─── ACTIONS ───────────────────────────────────── */
  const handleOpenPasswordModal = async (targetUser: UserType) => {
    setPasswordModal({ open: true, user: targetUser });
    setCurrentPassword('Cargando...');
    setNewPassword('');
    setShowCurrentPassword(false);
    setShowPassword(false);
    try {
      const res = await api.get(`/users/${targetUser.id}/password`);
      if (res.data?.currentPassword) {
        setCurrentPassword(res.data.currentPassword);
      } else {
        setCurrentPassword(targetUser.role === 'ADMIN' ? 'AdminPassword123*' : '123456');
      }
    } catch {
      setCurrentPassword(targetUser.role === 'ADMIN' ? 'AdminPassword123*' : '123456');
    }
  };

  const updateSystemRole = async (targetUser: UserType, newRole: string) => {
    if (targetUser.id === currentUser?.id) { setError('No puedes modificar tu propio perfil.'); return; }
    try {
      setActionLoadingId(targetUser.id);
      setError('');
      await adminUserExtensions.updateGroupRole(targetUser.id, { role: newRole });
      await loadData();
      setSuccess(`Rol de sistema de ${targetUser.name} actualizado a ${newRole === 'ADMIN' ? 'Administrador' : 'Usuario'}.`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'No se pudo actualizar el rol.');
    } finally { setActionLoadingId(null); }
  };

  const updateGroupRole = async (targetUser: UserType, groupRole: string) => {
    if (targetUser.id === currentUser?.id) { setError('No puedes modificar tu propio rol.'); return; }
    try {
      setActionLoadingId(targetUser.id);
      setError('');
      await adminUserExtensions.updateGroupRole(targetUser.id, { groupRole });
      await loadData();
      setSuccess(`Cargo en grupo de ${targetUser.name} actualizado a "${groupRole}".`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'No se pudo actualizar el cargo en el grupo.');
    } finally { setActionLoadingId(null); }
  };

  const toggleUserStatus = async (targetUser: UserType) => {
    if (targetUser.id === currentUser?.id) { setError('No puedes desactivar tu propia cuenta.'); return; }
    try {
      setActionLoadingId(targetUser.id);
      setError('');
      await adminUserExtensions.toggleStatus(targetUser.id, { isActive: !targetUser.isActive });
      await loadData();
      setSuccess(`${targetUser.name} ${targetUser.isActive ? 'desactivado' : 'activado'}.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar estado.');
    } finally { setActionLoadingId(null); }
  };

  const handleResetPassword = async () => {
    if (!passwordModal.user || !newPassword) return;
    try {
      setPasswordLoading(true);
      await adminUserExtensions.resetPassword(passwordModal.user.id, newPassword);
      setSuccess(`Contraseña de ${passwordModal.user.name} actualizada exitosamente.`);
      setPasswordModal({ open: false, user: null });
      setNewPassword('');
      setShowPassword(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar contraseña.');
    } finally { setPasswordLoading(false); }
  };

  const handleAssignGroup = async () => {
    if (!assignModal.user || !selectedGroupId) return;
    try {
      setAssignLoading(true);
      await groupsService.addMember(selectedGroupId, assignModal.user.id);
      await loadData();
      setSuccess(`${assignModal.user.name} asignado al grupo exitosamente.`);
      setAssignModal({ open: false, user: null });
      setSelectedGroupId(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al asignar grupo.');
    } finally { setAssignLoading(false); }
  };

  const handleRemoveFromGroup = async (user: UserType) => {
    if (!user.groupSmallId) return;
    try {
      setActionLoadingId(user.id);
      await groupsService.removeMember(user.groupSmallId, user.id);
      await loadData();
      setSuccess(`${user.name} removido del grupo.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al remover del grupo.');
    } finally { setActionLoadingId(null); }
  };

  const toggleGroupExpand = (groupId: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  };

  /* ─── GUARD ─────────────────────────────────────── */
  if (!currentUser) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
        <div className="inline-flex items-center gap-2 text-sm font-black uppercase text-indigo-600">
          <RefreshCw size={16} className="animate-spin" /> Verificando sesión...
        </div>
      </div>
    );
  }

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center">
        <h2 className="text-lg font-black text-rose-700 uppercase">Acceso restringido</h2>
        <p className="mt-2 text-sm font-semibold text-rose-600">Esta página solo está disponible para administradores.</p>
      </div>
    );
  }

  if (loading) return <Loader text="Cargando panel de usuarios..." />;

  /* ─── RENDER ────────────────────────────────────── */
  return (
    <div className="space-y-6 bg-[#f0f2fc] dark:bg-slate-950 min-h-screen p-4 sm:p-6 font-sans text-slate-800 dark:text-slate-100">
      <style>{ANIMATIONS}</style>

      {/* ═══ HEADER ═══════════════════════════════════ */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg overflow-hidden anim-up">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 via-violet-500 via-fuchsia-500 to-orange-400"
          style={{ backgroundSize: '200% 100%', animation: 'shimmer 4s linear infinite' }} />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 sm:gap-4 p-4 sm:p-5 pt-6 sm:pt-7">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-2.5 sm:p-3.5 rounded-2xl shadow-lg shadow-violet-500/30">
                <ShieldCheck size={24} className="text-white sm:w-7 sm:h-7" />
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-700 dark:from-indigo-400 dark:to-violet-300 truncate">
                Control de Usuarios
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">
                Gestión de cargos de Grupo Pequeño, roles de acceso y perfiles
              </p>
            </div>
          </div>
          <button onClick={loadData} disabled={loading}
            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-violet-500/25 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50 cursor-pointer w-full sm:w-auto shrink-0">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* ═══ STATS ════════════════════════════════════ */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8 anim-up" style={{ animationDelay: '0.05s' }}>
        <StatCard label="Total" value={stats.total} icon={<Users size={16} />} gradient="from-indigo-500 to-violet-500" isActive={statFilter === 'ALL'} onClick={() => setStatFilter('ALL')} />
        <StatCard label="Admins" value={stats.admins} icon={<Crown size={16} />} gradient="from-violet-600 to-fuchsia-600" isActive={statFilter === 'ADMIN'} onClick={() => setStatFilter(statFilter === 'ADMIN' ? 'ALL' : 'ADMIN')} />
        <StatCard label="Líderes" value={stats.lideres} icon={<Crown size={16} />} gradient="from-amber-500 to-orange-500" isActive={statFilter === 'LIDER'} onClick={() => setStatFilter(statFilter === 'LIDER' ? 'ALL' : 'LIDER')} />
        <StatCard label="Co-líderes" value={stats.colideres} icon={<Star size={16} />} gradient="from-fuchsia-500 to-pink-600" isActive={statFilter === 'COLIDER'} onClick={() => setStatFilter(statFilter === 'COLIDER' ? 'ALL' : 'COLIDER')} />
        <StatCard label="Secretarios" value={stats.secretarios} icon={<BookOpen size={16} />} gradient="from-cyan-500 to-blue-600" isActive={statFilter === 'SECRETARIO'} onClick={() => setStatFilter(statFilter === 'SECRETARIO' ? 'ALL' : 'SECRETARIO')} />
        <StatCard label="Tesoreros" value={stats.tesoreros} icon={<Wallet size={16} />} gradient="from-emerald-500 to-teal-600" isActive={statFilter === 'TESORERO'} onClick={() => setStatFilter(statFilter === 'TESORERO' ? 'ALL' : 'TESORERO')} />
        <StatCard label="En Grupo" value={stats.enGrupo} icon={<UsersRound size={16} />} gradient="from-blue-500 to-indigo-600" isActive={statFilter === 'IN_GROUP'} onClick={() => setStatFilter(statFilter === 'IN_GROUP' ? 'ALL' : 'IN_GROUP')} />
        <StatCard label="Sin Grupo" value={stats.sinGrupo} icon={<UserPlus size={16} />} gradient="from-rose-500 to-pink-600" isActive={statFilter === 'NO_GROUP'} onClick={() => setStatFilter(statFilter === 'NO_GROUP' ? 'ALL' : 'NO_GROUP')} />
      </section>

      {/* ═══ MESSAGES ═════════════════════════════════ */}
      {error && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 px-5 py-3.5 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2 anim-scale shadow-sm">
          <AlertTriangle size={15} className="shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 px-5 py-3.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 anim-scale shadow-sm">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" /> {success}
        </div>
      )}

      {/* ═══ MAIN CONTENT ════════════════════════════ */}
      <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg anim-up min-h-[400px]" style={{ animationDelay: '0.1s' }}>
        {/* Search + Tabs + Clear Filter */}
        <div className="p-5 pb-0 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-700 dark:text-slate-100 outline-none transition focus:border-violet-500 dark:focus:border-violet-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-violet-500/20" />
            </div>
            <div className="flex items-center gap-2 w-full lg:w-auto">
              {(statFilter !== 'ALL' || search !== '') && (
                <button
                  onClick={() => { setStatFilter('ALL'); setSearch(''); }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer shadow-xs whitespace-nowrap"
                  title="Limpiar todos los filtros"
                >
                  <X size={12} className="shrink-0" />
                  Limpiar
                </button>
              )}
              {([
                { key: 'IN_GROUP' as const, label: 'En Grupos', icon: UsersRound, count: usersInGroups.reduce((s, [, g]) => s + g.members.length, 0) },
                { key: 'NO_GROUP' as const, label: 'Sin Grupo', icon: UserPlus, count: usersNoGroup.length }
              ]).map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border px-3 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-300'
                  }`}>
                  <tab.icon size={12} className="shrink-0" />
                  <span>{tab.label}</span>
                  <span className={`ml-0.5 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black ${
                    activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                  }`}>{tab.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── TAB: IN GROUP ──────────────────────────── */}
        {activeTab === 'IN_GROUP' && (
          <div className="p-5 space-y-4">
            {usersInGroups.length === 0 ? (
              <div className="text-center py-16">
                <UsersRound size={48} className="mx-auto mb-4 text-slate-200 dark:text-slate-700" />
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500">No hay usuarios en grupos que coincidan con la búsqueda.</p>
              </div>
            ) : (
              usersInGroups.map(([groupId, { groupName, members }]) => (
                <div key={groupId} className="animated-group-border transition-all duration-300">
                  {/* Group Header */}
                  <button onClick={() => toggleGroupExpand(groupId)}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-900 hover:from-violet-50/40 dark:hover:from-violet-950/30 transition-all duration-200 cursor-pointer rounded-t-xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 p-2 rounded-xl text-white shadow-md shadow-violet-500/20">
                        <UsersRound size={16} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">{groupName}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{members.length} integrante{members.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 text-[10px] font-black border border-violet-100 dark:border-violet-900/50">
                        {members.length}
                      </span>
                      {expandedGroups.has(groupId)
                        ? <ChevronDown size={16} className="text-slate-400 transition-transform" />
                        : <ChevronRight size={16} className="text-slate-400 transition-transform" />
                      }
                    </div>
                  </button>

                  {/* Members List */}
                  {expandedGroups.has(groupId) && (
                    <div className="anim-slide border-t border-slate-100 dark:border-slate-800/80">
                      <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
                        {members.map((user, idx) => (
                          <UserRow key={user.id} user={user} currentUser={currentUser}
                            rowIndex={idx}
                            actionLoadingId={actionLoadingId}
                            onChangeSystemRole={updateSystemRole}
                            onChangeGroupRole={updateGroupRole}
                            onToggleStatus={toggleUserStatus}
                            onOpenPasswordModal={handleOpenPasswordModal}
                            onRemoveFromGroup={handleRemoveFromGroup}
                            showGroupActions />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── TAB: NO GROUP ──────────────────────────── */}
        {activeTab === 'NO_GROUP' && (
          <div className="p-5">
            {usersNoGroup.length === 0 ? (
              <div className="text-center py-16">
                <UserPlus size={48} className="mx-auto mb-4 text-slate-200 dark:text-slate-700" />
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Todos los usuarios tienen un grupo asignado.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {usersNoGroup.map((user, idx) => (
                  <UserRow key={user.id} user={user} currentUser={currentUser}
                    rowIndex={idx}
                    actionLoadingId={actionLoadingId}
                    onChangeSystemRole={updateSystemRole}
                    onChangeGroupRole={updateGroupRole}
                    onToggleStatus={toggleUserStatus}
                    onOpenPasswordModal={handleOpenPasswordModal}
                    onOpenAssignModal={(u) => { setAssignModal({ open: true, user: u }); setSelectedGroupId(null); }}
                    showAssignButton />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ═══ PASSWORD MODAL ═══════════════════════════ */}
      {passwordModal.open && passwordModal.user && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md anim-scale">
          <div className="animated-modal-border w-full max-w-md">
            <div className="animated-modal-content bg-white dark:bg-slate-900">
              {/* Header */}
              <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner"><Key size={22} className="animate-pulse" /></div>
                    <div>
                      <h3 className="font-black text-base uppercase tracking-wider">Cambiar Contraseña</h3>
                      <p className="text-[10px] text-white/80 font-extrabold uppercase tracking-widest">{passwordModal.user.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setPasswordModal({ open: false, user: null })}
                    className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition cursor-pointer">
                    <X size={16} />
                  </button>
                </div>
              </div>
              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Contraseña Actual */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Contraseña Actual</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Verificar o ingresar contraseña actual..."
                      className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-3 px-4 pr-12 text-sm font-semibold text-slate-700 dark:text-slate-100 outline-none transition focus:border-violet-500 dark:focus:border-violet-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-violet-500/20"
                    />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition cursor-pointer p-1">
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Nueva Contraseña */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Nueva Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres..."
                      className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-3 px-4 pr-12 text-sm font-semibold text-slate-700 dark:text-slate-100 outline-none transition focus:border-violet-500 dark:focus:border-violet-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-violet-500/20"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition cursor-pointer p-1">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {newPassword.length > 0 && newPassword.length < 6 && (
                    <p className="text-[10px] text-rose-500 dark:text-rose-400 font-bold mt-1.5">La contraseña debe tener al menos 6 caracteres.</p>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setPasswordModal({ open: false, user: null })}
                    className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black uppercase text-xs tracking-wider rounded-2xl transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-slate-700">
                    Cancelar
                  </button>
                  <button onClick={handleResetPassword}
                    disabled={newPassword.length < 6 || passwordLoading}
                    className="flex-1 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition-all active:scale-95 cursor-pointer shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {passwordLoading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ASSIGN GROUP MODAL ═══════════════════════ */}
      {assignModal.open && assignModal.user && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md anim-scale">
          <div className="animated-modal-border w-full max-w-md">
            <div className="animated-modal-content bg-white dark:bg-slate-900">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner"><UserPlus size={22} className="animate-pulse" /></div>
                    <div>
                      <h3 className="font-black text-base uppercase tracking-wider">Asignar a Grupo</h3>
                      <p className="text-[10px] text-white/80 font-extrabold uppercase tracking-widest">{assignModal.user.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setAssignModal({ open: false, user: null })}
                    className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition cursor-pointer">
                    <X size={16} />
                  </button>
                </div>
              </div>
              {/* Body */}
              <div className="p-6 space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">Seleccionar Grupo Pequeño</label>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {groups.map(g => {
                      const isSelected = selectedGroupId === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setSelectedGroupId(g.id)}
                          className={`w-full p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-black ring-2 ring-indigo-500/20 shadow-sm'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300'}`}>
                              <UsersRound size={16} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-wide">{g.name}</span>
                          </div>
                          {isSelected && <CheckCircle2 size={16} className="text-indigo-600 dark:text-indigo-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setAssignModal({ open: false, user: null })}
                    className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black uppercase text-xs tracking-wider rounded-2xl transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-slate-700">
                    Cancelar
                  </button>
                  <button onClick={handleAssignGroup}
                    disabled={!selectedGroupId || assignLoading}
                    className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase text-xs tracking-wider rounded-2xl transition-all active:scale-95 cursor-pointer shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {assignLoading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                    Asignar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   USER ROW COMPONENT
   ═══════════════════════════════════════════════════════ */
interface UserRowProps {
  user: UserType;
  currentUser: any;
  actionLoadingId: number | null;
  rowIndex?: number;
  onChangeSystemRole: (u: UserType, role: string) => void;
  onChangeGroupRole: (u: UserType, groupRole: string) => void;
  onToggleStatus: (u: UserType) => void;
  onOpenPasswordModal: (u: UserType) => void;
  onRemoveFromGroup?: (u: UserType) => void;
  onOpenAssignModal?: (u: UserType) => void;
  showGroupActions?: boolean;
  showAssignButton?: boolean;
}

const UserRow: React.FC<UserRowProps> = ({
  user, currentUser, actionLoadingId, rowIndex = 0,
  onChangeSystemRole, onChangeGroupRole, onToggleStatus,
  onOpenPasswordModal, onRemoveFromGroup, onOpenAssignModal,
  showGroupActions, showAssignButton
}) => {
  const isSelf = user.id === currentUser?.id;
  const groupRoleConfig = getGroupRoleConfig(user.groupRole);
  const isActionLoading = actionLoadingId === user.id;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const groupRoleOptions = GROUP_ROLES.map(r => ({ key: r.label, label: r.label, icon: r.icon, badge: r.badge }));
  const systemRoleOptions = SYSTEM_ROLES.map(s => ({ key: s.key, label: s.label, icon: s.icon, badge: s.badge }));

  const calculatedZIndex = isDropdownOpen ? 99999 : (1000 - rowIndex);

  return (
    <div
      style={{ zIndex: calculatedZIndex }}
      className={`flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 sm:gap-3.5 p-3.5 sm:p-4.5 transition-all duration-200 hover:bg-violet-50/30 dark:hover:bg-violet-950/20 ${
        isSelf ? 'bg-indigo-50/20 dark:bg-indigo-950/30' : ''
      } relative`}
    >
      {/* Avatar + Name */}
      <div className="flex items-center gap-3 min-w-0 sm:min-w-[210px] shrink-0">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${getAvatarGradient(user.id)} text-sm font-black text-white shadow-md shrink-0`}>
          {user.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 font-mono truncate">{user.email}</p>
          {isSelf && (
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/50 px-1.5 py-0.5 rounded-md border border-violet-100 dark:border-violet-900/50 mt-0.5 inline-block font-extrabold">
              Tu cuenta
            </span>
          )}
        </div>
      </div>

      {/* Selectors Group */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 my-0.5 xl:my-0 w-full xl:w-auto min-w-0">
        {/* Cargo en Grupo Pequeño */}
        <div className="flex flex-col min-w-0 w-full sm:w-auto">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 mb-1 px-1">Cargo GP</span>
          <CustomDropdown
            value={groupRoleConfig.label}
            options={groupRoleOptions}
            onChange={(selectedLabel) => onChangeGroupRole(user, selectedLabel)}
            disabled={isActionLoading}
            type="groupRole"
            onOpenChange={setIsDropdownOpen}
          />
        </div>

        {/* Rol de Sistema */}
        <div className="flex flex-col min-w-0 w-full sm:w-auto">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400 mb-1 px-1">Acceso</span>
          <CustomDropdown
            value={user.role}
            options={systemRoleOptions}
            onChange={(selectedKey) => onChangeSystemRole(user, selectedKey)}
            disabled={isSelf || isActionLoading}
            type="systemRole"
            onOpenChange={setIsDropdownOpen}
          />
        </div>
      </div>

      {/* Status badge & Actions Bar */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 shrink-0 w-full xl:w-auto mt-1 xl:mt-0 pt-2 border-t border-slate-100 dark:border-slate-800/60 xl:border-none xl:pt-0 min-w-0">
        <span className={`inline-flex items-center gap-1 rounded-xl border px-2 sm:px-3 py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-xs shrink-0 ${
          user.isActive
            ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
            : 'border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
        }`}>
          {user.isActive ? <Power size={10} /> : <PowerOff size={10} />}
          {user.isActive ? 'Activo' : 'Inactivo'}
        </span>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Password */}
          <button onClick={() => onOpenPasswordModal(user)}
            disabled={isActionLoading}
            title="Cambiar contraseña"
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-950/50 hover:border-violet-300 dark:hover:border-violet-700 text-slate-500 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-300 transition-all duration-200 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs">
            <Key size={13} />
          </button>

          {/* Toggle status */}
          <button onClick={() => onToggleStatus(user)}
            disabled={isSelf || isActionLoading}
            className={`rounded-xl border px-2.5 sm:px-3 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-2xs ${
              user.isActive
                ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60'
                : 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
            }`}>
            {isActionLoading ? '...' : user.isActive ? 'Desactivar' : 'Activar'}
          </button>

          {/* Assign to group (for no-group users) */}
          {showAssignButton && onOpenAssignModal && (
            <button onClick={() => onOpenAssignModal(user)}
              className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs flex items-center gap-1">
              <UserPlus size={11} /> Asignar
            </button>
          )}

          {/* Remove / Leave group (for in-group users) */}
          {showGroupActions && onRemoveFromGroup && (
            <button onClick={() => onRemoveFromGroup(user)}
              disabled={isActionLoading}
              title={isSelf ? "Salir del grupo" : "Remover del grupo"}
              className="p-1.5 sm:p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all duration-200 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs">
              <UserMinus size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   STAT CARD COMPONENT
   ═══════════════════════════════════════════════════════ */
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  isActive?: boolean;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, gradient, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left rounded-2xl border p-3.5 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl group cursor-pointer ${
      isActive
        ? 'border-violet-500 dark:border-violet-400 bg-violet-50 dark:bg-violet-950/80 ring-4 ring-violet-500/25 shadow-lg shadow-violet-500/20 scale-[1.03]'
        : 'border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-violet-300 dark:hover:border-violet-700'
    }`}
  >
    <div className="flex items-center justify-between">
      <p className={`text-[9px] font-black uppercase tracking-widest truncate ${isActive ? 'text-violet-700 dark:text-violet-300' : 'text-slate-400 dark:text-slate-400'}`}>
        {label}
      </p>
      <span className={`rounded-xl bg-gradient-to-br ${gradient} p-2 text-white shadow-md group-hover:scale-110 transition-transform duration-300 shrink-0`}>
        {icon}
      </span>
    </div>
    <p className={`mt-2 text-2xl font-black leading-none ${isActive ? 'text-violet-900 dark:text-violet-100' : 'text-slate-800 dark:text-slate-100'}`}>
      {value}
    </p>
  </button>
);