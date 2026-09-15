export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: 'hero' | 'sidebar' | 'footer' | 'popup';
  status: 'active' | 'inactive';
  order: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
