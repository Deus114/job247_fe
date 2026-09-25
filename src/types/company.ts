export interface Company {
  id: string;
  name: string;
  nameEn: string;
  logo: string;
  banner: string;
  description: string;
  industry: string;
  size: string;
  location: string;
  address: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  taxCode: string;
  status: "pending" | "approved" | "rejected" | "needs_revision";
  adminNote?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
  deletedAt?: string;
}
