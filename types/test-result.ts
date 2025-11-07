export interface TestResult {
  id: number;
  createdAt: string;
  testType: string;
  imagePath: string;
  results?: string;
  notes?: string;
  analyzedData?: string;
}

export interface NewTestResult {
  testType: string;
  imagePath: string;
  results?: string;
  notes?: string;
  analyzedData?: string;
}

