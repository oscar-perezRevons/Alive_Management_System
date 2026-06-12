import React, { useEffect, useState } from 'react';
import { usersService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { User as UserType } from '../types';
import { Trash2, Shield, User, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('📡 Cargando listado administrativo de usuarios...');
      const response = await usersService.getAll();
      setUsers(response.data);
    } catch (err: any) {
      console.error('Error capturado al cargar usuarios:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al obtener los usuarios del servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (targetUser: UserType) => {
    if (targetUser.id === currentUser?.id) {
      alert('No puedes quitarte los permisos de Administrador a ti mismo.');
      return;
    }

    const newRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      setActionLoadingId(targetUser.id);
      console.log(`🔧 Modificando rol del usuario ${targetUser.id} a: ${newRole}`);
      await usersService.update(targetUser.id, { role: newRole });
      
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar el rol del usuario.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleStatus = async (targetUser: UserType) => {
    if (targetUser.id === currentUser?.id) {
      alert('No puedes desactivar tu propia cuenta de administrador.');
      return;
    }

    const newStatus = !targetUser.isActive;
    try {
      setActionLoadingId(targetUser.id);
      console.log(`🔧 Modificando estado de activación del usuario ${targetUser.id} a: ${newStatus}`);
      await usersService.update(targetUser.id, { isActive: newStatus });
      
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === targetUser.id ? { ...u, isActive: newStatus } : u))
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar el estado del usuario.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (id === currentUser?.id) {
      alert('Operación denegada: No es posible auto-eliminarse del sistema.');
      return;
    }

    if (window.confirm('¿Estás completamente seguro de que deseas eliminar permanentemente este usuario? Esta acción es irreversible.')) {
      try {
        setActionLoadingId(id);
        console.log('Despachando eliminación de usuario ID:', id);
        await usersService.delete(id);
        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== id));
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al eliminar el usuario.');
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Control de Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">Sección administrativa para la gestión de cuentas, roles y accesos.</p>
        </div>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-50 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Sincronizar
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4 font-medium">Consultando registros en la base de datos...</p>
        </div>
      )}

      {!loading && users.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center space-y-3">
          <div className="p-4 bg-gray-50 inline-block rounded-2xl text-gray-400 shadow-inner">
            <User size={36} />
          </div>
          <p className="text-gray-500 text-sm font-medium">No se encontraron usuarios registrados en la plataforma.</p>
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4">Usuario / Email</th>
                  <th className="px-6 py-4">Nombre Completo</th>
                  <th className="px-6 py-4">Rol del Sistema</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const isActionDisabled = actionLoadingId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition duration-150">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <div className="flex flex-col">
                          <span>{u.email}</span>
                          {isSelf && (
                            <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wide mt-0.5">
                              Tu Cuenta (Activa)
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 font-medium text-gray-600">{u.name}</td>
                      
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={isSelf || isActionDisabled}
                          title={isSelf ? 'No puedes cambiar tu propio rol' : 'Hacer clic para cambiar rol'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                              : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                          } disabled:opacity-80 disabled:pointer-events-none`}
                        >
                          <Shield size={12} className={u.role === 'ADMIN' ? 'fill-purple-100' : 'fill-blue-100'} />
                          {u.role}
                        </button>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={isSelf || isActionDisabled}
                          className={`transition duration-200 rounded-lg p-1 ${
                            u.isActive ? 'text-emerald-500 hover:text-emerald-600' : 'text-gray-300 hover:text-gray-400'
                          } disabled:opacity-50 disabled:pointer-events-none`}
                          title={u.isActive ? 'Desactivar cuenta' : 'Activar cuenta'}
                        >
                          {u.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        </button>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={isSelf || isActionDisabled}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition duration-150 disabled:opacity-30 disabled:pointer-events-none"
                          title={isSelf ? 'No puedes eliminarte a ti mismo' : 'Eliminar usuario'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};