export interface PagedList<T> {
  items: T[];
  pageIndex: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  isActive?: boolean;
}

export interface DomainRecipient {
  id: string;
  userId: string;
  name: string;
  email: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  provider: string;
  avatarUrl: string | null;
  avatarBgColor: string | null;
  role: number;
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
}
