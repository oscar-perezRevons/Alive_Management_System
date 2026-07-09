type AuthLikeUser = {
  role?: string;
  groupRole?: string;
} | null | undefined;

export type AccessRole = 'ADMIN' | 'LIDER_GP' | 'USUARIO';

const normalizeText = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\s]+/g, '')
    .trim()
    .toUpperCase();

export const isLeaderGroupRole = (groupRole?: string) => {
  const normalized = normalizeText(groupRole);
  return normalized === 'LIDER';
};

export const resolveAccessRole = (user: AuthLikeUser): AccessRole => {
  if (normalizeText(user?.role) === 'ADMIN') return 'ADMIN';
  if (isLeaderGroupRole(user?.groupRole)) return 'LIDER_GP';
  return 'USUARIO';
};

export const hasAnyAccessRole = (user: AuthLikeUser, allowedRoles: AccessRole[]) => {
  const currentRole = resolveAccessRole(user);
  return allowedRoles.includes(currentRole);
};

export const canManageEvents = (user: AuthLikeUser) =>
  hasAnyAccessRole(user, ['ADMIN', 'LIDER_GP']);
