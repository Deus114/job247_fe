export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  coverLetter: string;
  cvFileName: string;
  status: "pending" | "reviewing" | "accepted" | "rejected";
  appliedAt: string;
}
