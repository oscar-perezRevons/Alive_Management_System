import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminUserExtensions } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { User as UserType } from '../types';
import {
  ShieldCheck,
  Users,
  RefreshCw,
  Search,
  Crown,
  UserCircle2,
  UserCog,
  Power,
  PowerOff
} from 'lucide-react';
import { Loader } from '../components/Loader';

type AccessProfile = 'ADMIN' | 'LIDER_GP' | 'USUARIO';

const ACCESS_PROFILE_OPTIONS: {
  key: AccessProfile;
  label: string;
  subtitle: string;
  badgeClass: string;
  selectClass: string;
}[] = [
  {
    key: 'ADMIN',
    label: 'Administrador',
    subtitle: 'Acceso total',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    selectClass: 'bg-violet-50 text-violet-700 border-violet-200'
  },
  {
    key: 'LIDER_GP',
    label: 'Lider GP',
    subtitle: 'Gestion de GP',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    selectClass: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  {
    key: 'USUARIO',
    label: 'Usuario',
    subtitle: 'Solo consulta',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    selectClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
];

const normalizeText = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\s]+/g, '')
    .trim()
    .toUpperCase();

const resolveProfile = (user: UserType): AccessProfile => {
  if (normalizeText(user.role) === 'ADMIN') return 'ADMIN';
  if (normalizeText(user.groupRole) === 'LIDER') return 'LIDER_GP';
  return 'USUARIO';
};

const getOptionByProfile = (profile: AccessProfile) =>
  ACCESS_PROFILE_OPTIONS.find((item) => item.key === profile) || ACCESS_PROFILE_OPTIONS[2];

export const UsersPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [profileFilter, setProfileFilter] = useState<'TODOS' | AccessProfile>('TODOS');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminUserExtensions.getAll();
      setUsers(response.data?.users || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo cargar el listado de usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      const profile = resolveProfile(user);
      const matchesProfile = profileFilter === 'TODOS' || profile === profileFilter;
      const matchesSearch =
        !q || user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
      return matchesProfile && matchesSearch;
    });
  }, [users, search, profileFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((user) => resolveProfile(user) === 'ADMIN').length;
    const lideres = users.filter((user) => resolveProfile(user) === 'LIDER_GP').length;
    const usuarios = users.filter((user) => resolveProfile(user) === 'USUARIO').length;
    const inactivos = users.filter((user) => !user.isActive).length;
    return { total, admins, lideres, usuarios, inactivos };
  }, [users]);

  const updateAccessProfile = async (targetUser: UserType, accessProfile: AccessProfile) => {
    if (targetUser.id === currentUser?.id) {
      setError('No puedes modificar tu propio perfil de acceso.');
      return;
    }

    try {
      setActionLoadingId(targetUser.id);
      setError('');
      await adminUserExtensions.updateRole(targetUser.id, { accessProfile });
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo actualizar el rol seleccionado.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const toggleUserStatus = async (targetUser: UserType) => {
    if (targetUser.id === currentUser?.id) {
      setError('No puedes desactivar tu propia cuenta.');
      return;
    }

    try {
      setActionLoadingId(targetUser.id);
      setError('');
      await adminUserExtensions.toggleStatus(targetUser.id, { isActive: !targetUser.isActive });
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo actualizar el estado del usuario.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!currentUser) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
        <div className="inline-flex items-center gap-2 text-sm font-black uppercase text-indigo-600">
          <RefreshCw size={16} className="animate-spin" /> Verificando sesion...
        </div>
      </div>
    );
  }

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center">
        <h2 className="text-lg font-black text-rose-700 uppercase">Acceso restringido</h2>
        <p className="mt-2 text-sm font-semibold text-rose-600">
          Esta pagina solo esta disponible para administradores del sistema.
        </p>
      </div>
    );
  }

  if (loading) {
    return <Loader text="Cargando Información..." />;
  }

  return (
    <div className="space-y-6 bg-[#f0f2fc] min-h-screen p-4 sm:p-6 font-sans">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      {/* HEADER PREMIUM */}
      <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 via-violet-500 via-fuchsia-500 to-orange-400" style={{backgroundSize: '200% 100%', animation: 'shimmer 4s linear infinite'}} />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 pt-7">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-3 rounded-2xl shadow-lg shadow-violet-500/30">
                <ShieldCheck size={26} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-700">Control de Usuarios</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Zona administrativa — Asigna perfiles y administra activaciones</p>
            </div>
          </div>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-violet-500/25 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Sincronizar
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Usuarios" value={stats.total} icon={<Users size={18} />} gradient="from-indigo-500 to-violet-500" />
        <StatCard label="Administradores" value={stats.admins} icon={<Crown size={18} />} gradient="from-violet-600 to-fuchsia-600" />
        <StatCard label="Lideres GP" value={stats.lideres} icon={<UserCog size={18} />} gradient="from-blue-500 to-indigo-600" />
        <StatCard label="Usuarios" value={stats.usuarios} icon={<UserCircle2 size={18} />} gradient="from-emerald-500 to-teal-600" />
        <StatCard label="Inactivos" value={stats.inactivos} icon={<PowerOff size={18} />} gradient="from-rose-500 to-rose-600" />
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lg md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/20"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(['TODOS', 'ADMIN', 'LIDER_GP', 'USUARIO'] as const).map((filterValue) => (
              <button
                key={filterValue}
                onClick={() => setProfileFilter(filterValue)}
                className={`rounded-2xl border px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
                  profileFilter === filterValue
                    ? 'border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:text-violet-600'
                }`}
              >
                {filterValue === 'LIDER_GP' ? 'Lider GP' : filterValue}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200/60 shadow-inner">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-200">
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-5 py-4">Usuario</th>
                <th className="px-5 py-4">Correo</th>
                <th className="px-5 py-4">Perfil de acceso</th>
                <th className="px-5 py-4 text-center">Estado</th>
                <th className="px-5 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm font-bold text-slate-400">
                    No hay registros para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSelf = user.id === currentUser?.id;
                  const profile = resolveProfile(user);
                  const profileOption = getOptionByProfile(profile);
                  const isActionLoading = actionLoadingId === user.id;

                  return (
                    <tr key={user.id} className={`transition hover:bg-violet-50/30 border-b border-slate-100 last:border-0 ${isSelf ? 'bg-indigo-50/20' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-black text-white shadow-md shadow-violet-500/20">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">{user.name}</p>
                            {isSelf && (
                              <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-md border border-violet-100">
                                Tu cuenta
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-500 font-mono">{user.email}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-2xl border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${profileOption.badgeClass}`}
                          >
                            {profileOption.label}
                          </span>
                          <select
                            disabled={isSelf || isActionLoading}
                            value={profile}
                            onChange={(e) => updateAccessProfile(user, e.target.value as AccessProfile)}
                            className={`rounded-xl border-2 px-3 py-1.5 text-xs font-black uppercase tracking-wider outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:ring-2 focus:ring-violet-500/20 ${profileOption.selectClass}`}
                          >
                            {ACCESS_PROFILE_OPTIONS.map((option) => (
                              <option key={option.key} value={option.key}>
                                {option.label} - {option.subtitle}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider shadow-sm ${
                            user.isActive
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-rose-200 bg-rose-50 text-rose-700'
                          }`}
                        >
                          {user.isActive ? <Power size={11} /> : <PowerOff size={11} />}
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          disabled={isSelf || isActionLoading}
                          onClick={() => toggleUserStatus(user)}
                          className={`rounded-2xl border px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm ${
                            user.isActive
                              ? 'border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100 text-rose-700 hover:from-rose-100 hover:to-rose-200'
                              : 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 hover:from-emerald-100 hover:to-emerald-200'
                          }`}
                        >
                          {isActionLoading ? 'Procesando...' : user.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, gradient }) => {
  return (
    <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <span className={`rounded-2xl bg-gradient-to-br ${gradient} p-2.5 text-white shadow-md`}>{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-black leading-none text-slate-800">{value}</p>
    </div>
  );
};