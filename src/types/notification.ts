import type { ApiPagination } from "@/types/catalog";

export type NotificationAudience = "public" | "admin";

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  relatedId: number;
  readAt: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationListParams {
  unreadOnly?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface NotificationList {
  data: AppNotification[];
  pagination: ApiPagination;
}
