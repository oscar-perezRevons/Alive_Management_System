export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  groupRole?: string;
  isActive: boolean;
  createdAt: string;
  avatarUrl?: string | null;
  groupSmallId?: number | null;
  groupSmall?: { id: number; name: string } | null;
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

export interface LeaderboardGroup {
  id: number;
  name: string;
  motto?: string;
  leaderName?: string;
  totalPoints: number;
  variation: number;    
  level: string;         
  stars: number;         
  membersCount: number;
}

export interface ProgressStats {
  accumulatedPoints: number;
  pointsThisMonth: number;
  currentPosition: number;
  currentLevel: string;
  levelDescription: string;
  pointsByArea: {
    asistencia: number;
    evangelismo: number;
    estudioBiblico: number;
    recreacion: number;
    deportes: number;
  };
  recentHistory: {
    id: number;
    activity: string;
    points: number;
    date: string;
  }[];
}

export interface GroupMemberDetailed {
  id: number;
  name: string;
  email: string;
  groupRole: string;   
  birthDate: string;      
  contributedPoints: number; 
}

export interface GroupDetailsResponse {
  id: number;
  name: string;
  description: string | null;
  motto: string | null;
  bibleVerse: string;
  anthemUrl: string;
  totalPoints: number;
  netPoints: number;
  leaderName: string | null;
  subLeaderName: string | null;
  administrator: { id: number; name: string; email: string };
  members: GroupMemberDetailed[];
  penalties: any[];
}

export interface OfficialAnnouncement {
  id: number;
  title: string;
  content: string;
  timeAgo: string; 
  type: 'INFO' | 'WARNING' | 'ALERT';
}

export interface UpcomingActivity {
  id: number;
  day: string;
  month: string;
  title: string;
  time: string;
  location: string;
  iconType: 'PROGRAMA' | 'FUTBOL' | 'ALABANZA' | 'GENERAL';
}

export interface FeaturedGroup {
  name: string;
  reason: string;
  totalPoints: number;
}

export interface DashboardHomeData {
  announcements: OfficialAnnouncement[];
  activities: UpcomingActivity[];
  featuredGroup: FeaturedGroup | null;
  totalGroupsCount: number;
  totalPointsAccumulated: number;
  myGroupSmall?: { id: number; name: string } | null;
}

export interface GPMember {
  id: number;
  name: string;
  birthDate: string;
  hasLifeInsurance: boolean;
  roleInGP: 'Líder' | 'Sub Líder' | 'Secretario' | 'Tesorera' | 'Integrante';
  avatarUrl?: string;
}

export interface GPIdentity {
  name: string;
  motto: string;
  verse: string;
  verseReference: string;
  flagUrl: string;
  anthemTitle: string;
  anthemArtist: string;
  anthemDuration: string;
  createdAtDate: string;
  timeElapsed: string;
}

export interface SecretariatData {
  members: GPMember[];
  identity: GPIdentity;
}