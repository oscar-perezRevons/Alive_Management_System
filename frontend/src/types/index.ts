export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  createdAt: string;
}

export interface GroupSmall {
  id: number;
  name: string;
  description?: string;
  totalPoints: number;
  administratorId: number;
  administrator: User;
  members: User[];
}

export interface Activity {
  id: number;
  name: string;
  description?: string;
  points: number;
  date: string;
  createdById: number;
  groupSmallId: number;
}

export interface Score {
  id: number;
  userId: number;
  groupId: number;
  activityId: number;
  points: number;
  date: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}