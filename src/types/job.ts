export interface Job {
  id: string;
  title: string;
  company: string;
  companyId: string;
  companyLogo: string;
  location: string;
  salary: string;
  category: string;
  educationLevel: string;
  type: string;
  experience: string;
  description: string;
  requirements: string[];
  benefits: string[];
  deadline: string;
  createdAt: string;
  featured: boolean;
  status: "pending" | "approved" | "rejected";
  isActive?: boolean;
  deletedAt?: string;
}

export interface CategoryItem {
  name: string;
  image?: string;
  isActive?: boolean;
  createdAt?: string;
  deletedAt?: string;
}

export interface EducationLevelItem {
  name: string;
  isActive?: boolean;
  createdAt?: string;
  deletedAt?: string;
}

export interface JobsCatalog {
  jobs: Job[];
  categories: CategoryItem[];
  educationLevels: EducationLevelItem[];
  locations: string[];
}
