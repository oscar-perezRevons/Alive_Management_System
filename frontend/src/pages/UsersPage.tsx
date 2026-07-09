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
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    selectClass: 'bg-blue-50 text-blue-700 border-blue-200'
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
        <div className="inline-flex items-center gap-2 text-sm font-black uppercase text-blue-600">
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

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-r from-[#002ec4] via-blue-700 to-indigo-700 p-6 shadow-xl shadow-blue-900/10">
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 left-20 h-40 w-40 rounded-full bg-cyan-300/15 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-blue-100">
              <ShieldCheck size={14} /> Zona Administrativa
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">
              Control de Usuarios
            </h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-100 md:text-sm">
              Asigna perfiles de acceso y administra activaciones desde un solo panel.
            </p>
          </div>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Sincronizar
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Usuarios" value={stats.total} icon={<Users size={16} />} className="from-slate-50 to-slate-100 text-slate-700 border-slate-200" />
        <StatCard label="Administradores" value={stats.admins} icon={<Crown size={16} />} className="from-violet-50 to-violet-100 text-violet-700 border-violet-200" />
        <StatCard label="Lideres GP" value={stats.lideres} icon={<UserCog size={16} />} className="from-blue-50 to-blue-100 text-blue-700 border-blue-200" />
        <StatCard label="Usuarios" value={stats.usuarios} icon={<UserCircle2 size={16} />} className="from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200" />
        <StatCard label="Inactivos" value={stats.inactivos} icon={<PowerOff size={16} />} className="from-rose-50 to-rose-100 text-rose-700 border-rose-200" />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(['TODOS', 'ADMIN', 'LIDER_GP', 'USUARIO'] as const).map((filterValue) => (
              <button
                key={filterValue}
                onClick={() => setProfileFilter(filterValue)}
                className={`rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-wider transition ${
                  profileFilter === filterValue
                    ? 'border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600'
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

        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Perfil de acceso</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <div className="inline-flex items-center gap-2 text-sm font-black uppercase text-blue-600">
                      <RefreshCw size={16} className="animate-spin" /> Cargando usuarios...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
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
                    <tr key={user.id} className="transition hover:bg-blue-50/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-black text-white shadow-sm">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">{user.name}</p>
                            {isSelf && (
                              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                                Tu cuenta
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${profileOption.badgeClass}`}
                          >
                            {profileOption.label}
                          </span>
                          <select
                            disabled={isSelf || isActionLoading}
                            value={profile}
                            onChange={(e) => updateAccessProfile(user, e.target.value as AccessProfile)}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-black uppercase tracking-wider outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${profileOption.selectClass}`}
                          >
                            {ACCESS_PROFILE_OPTIONS.map((option) => (
                              <option key={option.key} value={option.key}>
                                {option.label} - {option.subtitle}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                            user.isActive
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-rose-200 bg-rose-50 text-rose-700'
                          }`}
                        >
                          {user.isActive ? <Power size={12} /> : <PowerOff size={12} />}
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          disabled={isSelf || isActionLoading}
                          onClick={() => toggleUserStatus(user)}
                          className={`rounded-xl border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            user.isActive
                              ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
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
  className: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, className }) => {
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${className}`}>
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{label}</p>
        <span className="rounded-lg bg-white/70 p-2">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-black leading-none">{value}</p>
    </div>
  );
};