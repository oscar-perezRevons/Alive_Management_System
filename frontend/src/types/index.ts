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
  motto?: string;
  leaderName?: string;
  subLeaderName?: string;
  totalPoints: number;
  administratorId: number;
  administrator: Partial<User>;
  members?: User[];
  scores?: Score[];
  penalties?: any[]; 
}

export interface PointCategory {
  id: number;
  name: string;
  description?: string;
}

export interface Activity {
  id: number;
  name: string;
  description?: string;
  points: number;
  date: string;
  createdById: number;
  groupSmallId: number;
  pointCategoryId: number;
  pointCategory?: PointCategory;
  createdBy?: Partial<User>;
}

export interface Score {
  id: number;
  userId: number;
  groupId: number;
  activityId: number;
  points: number;
  date: string;
  user?: Partial<User>;
  activity?: Partial<Activity>;
}

export interface AuthResponse {
  token: string;
  user: User;
}