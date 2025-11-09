export interface UserSettings {
  id: number;
  userId: string; // Eindeutige Benutzer-ID
  userName: string;
  userPhone?: string;
  userEmail?: string;
  userAddress?: string;
  userDateOfBirth?: string;
  insuranceCompany?: string;
  insuranceNumber?: string;
  doctorName: string;
  doctorPhone?: string;
  doctorEmail?: string;
  doctorAddress?: string;
  openaiApiKey?: string;
  aiProvider?: string;
  aiApiKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewUserSettings {
  userName: string;
  userPhone?: string;
  userEmail?: string;
  userAddress?: string;
  userDateOfBirth?: string;
  insuranceCompany?: string;
  insuranceNumber?: string;
  doctorName: string;
  doctorPhone?: string;
  doctorEmail?: string;
  doctorAddress?: string;
  openaiApiKey?: string;
  aiProvider?: string;
  aiApiKey?: string;
}

